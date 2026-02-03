
import { Request, Response } from "express";
import { Service } from "../models/service.model";

// Mock data representing a fetch from 8004scan registry
const MOCK_REGISTRY_AGENTS = [
    {
        title: "Olas Predictor v2",
        description: "Autonomous prediction market agent powered by Olas. Analyzes Gnosis and Base markets to execute profitable trades and provide forecast reports.",
        price: 10.00,
        category: "AI Agent",
        walletAddress: "0x1234567890123456789012345678901234567890", // Mock
        deliveryTime: "Instant",
        revisions: "Unlimited",
        includes: ["Market Analysis", "Trade Execution", "Probability Report"],
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
        imagePublicId: "mock_olas",
        source: "8004scan",
        externalProfileUrl: "https://registry.olas.network/services/1",
        chainId: 8453
    },
    {
        title: "Polywrap Verifier",
        description: "Decentralized verification agent for Polywrap wrappers. Ensures your WASM modules are secure and compliant with the latest standards.",
        price: 5.00,
        category: "AI Agent",
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12", // Mock
        deliveryTime: "10 mins",
        revisions: "1",
        includes: ["Security Audit", "Compliance Check"],
        imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800",
        imagePublicId: "mock_poly",
        source: "8004scan",
        externalProfileUrl: "https://wrappers.io",
        chainId: 8453
    },
    {
        title: "Auto-Trader X",
        description: "High-frequency trading bot for Base Mainnet. specialized in arbitrage opportunities between Uniswap and Aerodrome.",
        price: 25.00,
        category: "AI Agent",
        walletAddress: "0x7890123456789012345678901234567890123456", // Mock
        deliveryTime: "Continuous",
        revisions: "N/A",
        includes: ["Arbitrage Scanning", "Flash Loan Execution"],
        imageUrl: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=800",
        imagePublicId: "mock_trader",
        source: "8004scan",
        externalProfileUrl: "https://8004scan.io/agent/77",
        chainId: 8453
    },
    {
        title: "ACP - Virtuals Protocol",
        description: "Pay for ACP jobs with x402 protocol on Virtuals Protocol. No inputs required.",
        price: 0.001,
        category: "AI Agent",
        walletAddress: "0x0000000000000000000000000000000000000000", // Dynamic via x402
        deliveryTime: "Instant",
        revisions: "N/A",
        includes: ["Job Budget funding", "Virtuals Protocol"],
        imageUrl: "https://acp-x402.virtuals.io/logo.png",
        imagePublicId: "mock_acp",
        source: "x402scan",
        externalProfileUrl: "https://acp-x402.virtuals.io",
        chainId: 8453 // Base Mainnet
    },
    {
        title: "x402-secure | t54.ai",
        description: "x402-secure is the trust layer for x402 ecosystem. Powered by t54.ai.",
        price: 0.01,
        category: "AI Agent",
        walletAddress: "0x0495d60c927B97d67D5018C6AA65C9b2bebaeED9",
        deliveryTime: "Instant",
        revisions: "N/A",
        includes: ["Social Trust Analysis", "Reputation Scoring"],
        imageUrl: "https://framerusercontent.com/images/k2Cjd0XCXe10T4XNdbqKSMx7g.png",
        imagePublicId: "mock_x402_secure",
        source: "x402scan",
        externalProfileUrl: "https://x402-secure-api.t54.ai",
        chainId: 8453
    },
    {
        title: "Padel Maps Agent",
        description: "Discover and rate padel clubs around the world. Find the perfect padel court for your next game.",
        price: 0.01,
        category: "AI Agent",
        walletAddress: "0x0495d60c927B97d67D5018C6AA65C9b2bebaeED9",
        deliveryTime: "Instant",
        revisions: "N/A",
        includes: ["Club Search", "Padel Courts"],
        imageUrl: "https://padelmaps.org/favicon.ico",
        imagePublicId: "mock_padel",
        source: "x402scan",
        externalProfileUrl: "https://padelmaps.org",
        chainId: 8453
    }
];

export const syncAgents = async (req: Request, res: Response) => {
    try {
        console.log("Syncing agents from registry...");

        // For now, we use the mock data.

        // CLEANUP: Remove old x402scan agents (like Lucy) to ensure we get the latest (ACP)
        await Service.deleteMany({ source: "x402scan" });

        let addedCount = 0;

        for (const agent of MOCK_REGISTRY_AGENTS) {
            // Check if already exists to avoid dupes
            const exists = await Service.findOne({
                title: agent.title,
                source: "8004scan"
            });

            if (!exists) {
                await Service.create(agent);
                addedCount++;
            }
        }

        return res.status(200).json({
            message: `Successfully synced. Added ${addedCount} new agents.`,
            added: addedCount
        });

    } catch (error) {
        console.error("SYNC AGENTS ERROR:", error);
        return res.status(500).json({ message: "Failed to sync agents", error });
    }
};
