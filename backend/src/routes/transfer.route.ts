import express from "express";
import {
  getTransfers,
  refreshTransfersEndpoint,
  getPurchases,
  getBuyerRelationships,
} from "../controllers/transfer.controller";

const router = express.Router();

// Get all sellers a buyer has worked with
router.get("/relationships/:buyerWallet", getBuyerRelationships);

// Get cached transfers for a buyer-seller relationship (instant)
router.get("/:buyerWallet/:sellerWallet", getTransfers);

// Refresh transfers from the blockchain
router.post("/:buyerWallet/:sellerWallet/refresh", refreshTransfersEndpoint);

// Get on-site purchases for a relationship
router.get("/:buyerWallet/:sellerWallet/purchases", getPurchases);

export default router;

