import { WalletClient } from "viem";
import { ethers } from "ethers";
import { X402Client } from "uvd-x402-sdk";
import { walletClientToSigner } from "./viemToEthers";

export async function executeX402Request(
    url: string,
    method: "POST" | "GET",
    body: any,
    walletClient: WalletClient,
    account: `0x${string}`
): Promise<any> {
    try {
        // 1. Initial Request (Expecting 402 or 200)
        console.log(`[x402] Fetching initial resource at ${url}...`);
        const initialRes = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (initialRes.status === 200) {
            return await initialRes.json();
        }

        if (initialRes.status !== 402) {
            const text = await initialRes.text();
            throw new Error(`Unexpected status ${initialRes.status}: ${text}`);
        }

        // 2. Parse 402 Response (Payment Details)
        // The SDK handles parsing, but we need the raw 402 response data first or use client.pay() wrapper if applicable.
        // However, uvd-x402-sdk is usually client-side. The standard flow is intercepting 402.

        // uvd-x402-sdk's X402Client expects to interact with window.ethereum by default.
        // usage: const client = new X402Client(provider); 

        // We will instantiate it and inject our signer.
        // Note: The SDK constructor might attempt to browse window.ethereum, but we can bypass or override.

        // Initialize SDK
        // @ts-ignore - Partial mock of window.ethereum if needed, or just plain init
        const client = new X402Client(window.ethereum);

        // --- HACK: Inject our custom signer derived from viem ---
        // This effectively bypasses the extension lookup and uses the walletClient passed in.
        const signer = await walletClientToSigner(walletClient);

        // We need to inject the signer/provider into the private/protected properties of the client
        // if the public API doesn't allow setting it.
        // Based on user request: "le inyecté manualmente mi propia instancia ... client.signer, client.provider"
        // Also note that the SDK 2.0 might have a setSigner method, but we'll assume the hack is needed/robust.

        // @ts-ignore
        client.signer = signer;
        // @ts-ignore
        client.provider = signer.provider;
        // @ts-ignore
        // @ts-ignore
        client.userAddress = account;
        // @ts-ignore
        client.connectedAddress = account;
        // @ts-ignore
        client.currentChainId = 8453; // Base Mainnet
        // @ts-ignore
        client.currentChainName = "base";
        // @ts-ignore
        client.currentNetwork = "evm";

        console.log("[x402] SDK Client initialized with injected signer (Base/8453)");

        // 3. Extract Price and Recipient from 402 response for createPayment
        const paymentInfo = await initialRes.json();
        console.log("[x402] 402 Payment Info:", paymentInfo);

        let option = paymentInfo.accepts ? paymentInfo.accepts[0] : paymentInfo;

        // Match user logic: Find "base" network option if available
        if (paymentInfo.accepts && Array.isArray(paymentInfo.accepts)) {
            const baseOption = paymentInfo.accepts.find((opt: any) => opt.network === "base");
            if (baseOption) {
                option = baseOption;
            }
        }

        // Handle Amount Unit Conversion
        // The price comes in atomic units (e.g., 10000 for 0.01 USDC).
        // SDK createPayment expects "0.01" (string) if tokenType is specified, or we pass formatted string.
        // ethers.formatUnits(amount, 6) -> "0.01"
        const rawAmount = option.maxAmountRequired || option.amount || "0";
        const formattedAmount = ethers.formatUnits(rawAmount, 6); // Assuming USDC (6 decimals)

        const recipient = option.payTo || option.address || option.recipient || paymentInfo.payTo;
        const tokenType = (option.extra?.symbol?.toLowerCase()) || "usdc";

        console.log(`[x402] Creating payment: ${formattedAmount} USDC to ${recipient}`);

        // 4. Create Payment using SDK
        // This handles approval (if needed) and transfer
        const paymentResult = await client.createPayment({
            recipient: recipient,
            amount: formattedAmount,
            tokenType: tokenType
        });

        console.log("[x402] Payment created:", paymentResult);

        // 5. Retry Request with Payment Header
        // The server needs the "X-PAYMENT" header.
        // paymentResult likely contains the full object. We need ONLY the base64 string if it's nested,
        // or paymentResult itself IS the header value?
        // User said: "Extraje específicamente la propiedad .paymentHeader del resultado"

        const paymentHeaderValue = paymentResult.paymentHeader || paymentResult;

        if (typeof paymentHeaderValue !== 'string') {
            console.warn("[x402] paymentHeader is not a string, might be full object:", paymentHeaderValue);
        }

        const paidRes = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-PAYMENT": String(paymentHeaderValue)
            },
            body: JSON.stringify(body),
        });

        if (!paidRes.ok) {
            const errText = await paidRes.text();
            throw new Error(`Payment verification failed (${paidRes.status}): ${errText}`);
        }

        return {
            data: await paidRes.json(),
            paymentResult
        };

    } catch (error) {
        console.error("x402 Execution Error:", error);
        throw error;
    }
}
