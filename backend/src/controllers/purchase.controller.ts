import { Request, Response } from "express";
import { Purchase } from "../models/purchase.model";
import { Service } from "../models/service.model";

const CHAIN_ID = 8453; // Base mainnet

// Create a new purchase record
export const createPurchase = async (req: Request, res: Response) => {
    try {
        console.log("=== CREATE PURCHASE REQUEST ===");
        console.log("Body:", req.body);
        const { serviceId, buyerWallet, sellerWallet, txHash, blockNumber, taskInput } = req.body;

        if (!serviceId || !buyerWallet || !sellerWallet || !txHash || blockNumber === undefined) {
            console.log("Missing required fields");
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify service exists (optional but good practice)
        const service = await Service.findById(serviceId);
        if (!service) {
            console.log("Service not found:", serviceId);
            return res.status(404).json({ message: "Service not found" });
        }

        // Check if duplicate (optional, txHash should be unique via db index)
        const existing = await Purchase.findOne({ txHash });
        if (existing) {
            console.log("Transaction already recorded:", txHash);
            return res.status(409).json({ message: "Transaction already recorded" });
        }

        const purchase = await Purchase.create({
            serviceId,
            buyerWallet: buyerWallet.trim().toLowerCase(),
            sellerWallet: sellerWallet.trim().toLowerCase(),
            txHash: txHash.toLowerCase(),
            blockNumber: blockNumber.toString(),
            chainId: CHAIN_ID,
            taskInput: taskInput || undefined
        });

        console.log("Purchase created successfully:", purchase);

        return res.status(201).json({
            message: "Purchase recorded successfully",
            purchase,
        });
    } catch (error) {
        console.error("Error creating purchase:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

// Check if a user has purchased a service
export const checkPurchaseStatus = async (req: Request, res: Response) => {
    try {
        const { serviceId, buyerWallet } = req.params;

        const purchase = await Purchase.findOne({
            serviceId,
            buyerWallet: { $regex: new RegExp(`^${buyerWallet}$`, "i") }
        });

        return res.status(200).json({
            hasPurchased: !!purchase,
        });
    } catch (error) {
        console.error("Error checking purchase:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
