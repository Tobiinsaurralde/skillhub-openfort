import { Request, Response } from "express";
import {
  refreshTransfers,
  getCachedTransfersForRelationship,
} from "../utils/refreshTransfers";
import { Purchase } from "../models/purchase.model";

// Helper to merge and sort transfers
const mergeTransfers = (result1: any, result2: any) => {
  // Merge transfers, deduplicating by txHash
  const seen = new Set();
  const allTransfers = [...(result1.transfers || []), ...(result2.transfers || [])].filter(t => {
    const isDuplicate = seen.has(t.txHash.toLowerCase());
    seen.add(t.txHash.toLowerCase());
    return !isDuplicate;
  });

  // Sort by block number descending (newest first)
  allTransfers.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

  return {
    transfers: allTransfers,
    hasMore: result1.hasMore || result2.hasMore,
    error: result1.error || result2.error
  };
};

// Get cached transfers for a buyer-seller relationship (instant)
export const getTransfers = async (req: Request, res: Response) => {
  try {
    const { buyerWallet, sellerWallet } = req.params;

    if (!buyerWallet || !sellerWallet) {
      return res.status(400).json({ message: "Missing wallet addresses" });
    }

    // Fetch bidirectional: Me->Them AND Them->Me
    const [forward, reverse] = await Promise.all([
      getCachedTransfersForRelationship(buyerWallet, sellerWallet),
      getCachedTransfersForRelationship(sellerWallet, buyerWallet)
    ]);

    const result = mergeTransfers(forward, reverse);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Refresh transfers from the blockchain (may be slow)
export const refreshTransfersEndpoint = async (req: Request, res: Response) => {
  try {
    const { buyerWallet, sellerWallet } = req.params;

    if (!buyerWallet || !sellerWallet) {
      return res.status(400).json({ message: "Missing wallet addresses" });
    }

    // Refresh bidirectional
    const [forward, reverse] = await Promise.all([
      refreshTransfers(buyerWallet, sellerWallet),
      refreshTransfers(sellerWallet, buyerWallet)
    ]);

    const result = mergeTransfers(forward, reverse);

    if (result.error) {
      return res.status(200).json({
        ...result,
        warning: result.error,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error refreshing transfers:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get on-site purchases for a buyer-seller relationship
export const getPurchases = async (req: Request, res: Response) => {
  try {
    const { buyerWallet, sellerWallet } = req.params;

    if (!buyerWallet || !sellerWallet) {
      return res.status(400).json({ message: "Missing wallet addresses" });
    }

    const purchases = await Purchase.find({
      buyerWallet: { $regex: new RegExp(`^${buyerWallet}$`, "i") },
      sellerWallet: { $regex: new RegExp(`^${sellerWallet}$`, "i") },
    })
      .populate("serviceId", "title imageUrl price")
      .sort({ createdAt: -1 });

    return res.status(200).json({ purchases });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get all sellers a buyer has worked with
export const getBuyerRelationships = async (req: Request, res: Response) => {
  try {
    const { buyerWallet } = req.params;

    if (!buyerWallet) {
      return res.status(400).json({ message: "Missing buyer wallet" });
    }

    // Get unique sellers from purchases
    const sellerWallets = await Purchase.find({
      buyerWallet: { $regex: new RegExp(`^${buyerWallet}$`, "i") },
    }).distinct("sellerWallet");

    return res.status(200).json({ sellers: sellerWallets });
  } catch (error) {
    console.error("Error fetching buyer relationships:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

