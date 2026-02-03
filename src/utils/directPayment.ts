import { WalletClient, parseUnits, createPublicClient, http } from "viem";
import { base, arbitrum, sepolia } from "viem/chains";

// USDC Contract Addresses
const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [arbitrum.id]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Verify this is Circle's Sepolia USDC (Testnet)
};

// Minimal ERC20 ABI for transfer
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  blockNumber?: string;
  error?: string;
}

/**
 * Simple USDC Transfer - MetaMask handles gas (can pay with USDC via MetaMask settings)
 */
export async function executeDirectUSDCPayment(
  walletClient: WalletClient,
  from: `0x${string}`,
  to: `0x${string}`,
  amountUSD: number,
  chainId: number = base.id
): Promise<PaymentResult> {
  try {
    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }

    // Convert to USDC decimals (6)
    const amount = parseUnits(amountUSD.toFixed(6), 6);

    // Pick Chain
    let chainObj = base;
    if (chainId === arbitrum.id) chainObj = arbitrum;
    else if (chainId === sepolia.id) chainObj = sepolia;

    // Create public client to wait for receipt
    const publicClient = createPublicClient({
      chain: chainObj as any,
      transport: http(),
    });

    // Execute transfer - MetaMask will show balance and handle gas
    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, amount],
      account: from,
      chain: chainObj,
    });

    // Wait for transaction receipt to get blockNumber
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    };
  } catch (error: any) {
    console.error("USDC payment error:", error);

    // User rejected
    if (error.message?.includes("User rejected") || error.message?.includes("denied")) {
      return { success: false, error: "Transaction cancelled" };
    }

    return {
      success: false,
      error: error.shortMessage || error.message || "Payment failed",
    };
  }
}
