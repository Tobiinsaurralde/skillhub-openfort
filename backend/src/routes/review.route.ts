import express from "express";
import {
  addReview,
  getReviews,
  getReviewsByRelationship,
  checkReviewStatus,
} from "../controllers/review.controller";

const router = express.Router();

// Add a review (works for both on-site purchases and off-site transfers)
router.post("/", addReview);

// Get reviews for a service
router.get("/service/:serviceId", getReviews);

// Legacy route for backwards compatibility
router.get("/:serviceId", getReviews);

// Get reviews for a buyer-seller relationship
router.get("/relationship/:buyerWallet/:sellerWallet", getReviewsByRelationship);

// Check if a txHash has been reviewed
router.get("/status/:txHash", checkReviewStatus);

export default router;
