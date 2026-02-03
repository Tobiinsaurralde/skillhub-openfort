import { Request, Response } from "express";
import { Review } from "../models/review.model";
import { Service } from "../models/service.model";
import { Purchase } from "../models/purchase.model";
import { Transfer } from "../models/transfer.model";
import mongoose from "mongoose";

const CHAIN_ID = 8453; // Base mainnet

// Add a Review for an on-site purchase
export const addReviewForPurchase = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { serviceId, reviewerWallet, rating, comment } = req.body;

    if (!serviceId || !reviewerWallet || !rating || !comment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const reviewerLower = reviewerWallet.toLowerCase();

    // 1. Check if Purchased
    const purchase = await Purchase.findOne({
      serviceId,
      buyerWallet: reviewerLower,
    });
    if (!purchase) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json({ message: "You must purchase this service to review it." });
    }

    // 2. Get service for seller wallet
    const service = await Service.findById(serviceId).session(session);
    if (!service) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Service not found" });
    }

    const sellerWallet = service.get("walletAddress").toLowerCase();

    // 3. Create Review (unique index on chainId+txHash will prevent duplicates)
    try {
      const review = await Review.create(
        [
          {
            txHash: purchase.txHash.toLowerCase(),
            chainId: CHAIN_ID,
            sellerWallet,
            serviceId,
            reviewerWallet: reviewerLower,
            rating,
            comment,
          },
        ],
        { session }
      );

      // 4. Update Service Stats
      const currentTotal = service.get("totalReviews") || 0;
      const currentAvg = service.get("averageRating") || 0;

      const newTotal = currentTotal + 1;
      const newAvg = (currentAvg * currentTotal + rating) / newTotal;

      await Service.findByIdAndUpdate(
        serviceId,
        {
          averageRating: newAvg,
          totalReviews: newTotal,
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res
        .status(201)
        .json({ message: "Review added successfully", review: review[0] });
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();

      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: "You have already reviewed this purchase." });
      }
      throw err;
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error adding review:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Add a Review for an off-site transfer
export const addReviewForTransfer = async (req: Request, res: Response) => {
  try {
    const { txHash, reviewerWallet, rating, comment } = req.body;

    if (!txHash || !reviewerWallet || !rating || !comment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const reviewerLower = reviewerWallet.toLowerCase();
    const txHashLower = txHash.toLowerCase();

    // 1. Verify transfer exists and caller is the buyer
    const transfer = await Transfer.findOne({
      chainId: CHAIN_ID,
      txHash: txHashLower,
      buyerWallet: reviewerLower,
    });

    if (!transfer) {
      return res
        .status(403)
        .json({ message: "Invalid transfer or you are not the buyer" });
    }

    // 2. Create Review (unique index prevents duplicates)
    try {
      const review = await Review.create({
        txHash: txHashLower,
        chainId: CHAIN_ID,
        sellerWallet: transfer.sellerWallet,
        reviewerWallet: reviewerLower,
        rating,
        comment,
      });

      return res
        .status(201)
        .json({ message: "Review added successfully", review });
    } catch (err: any) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: "Review already exists for this payment" });
      }
      throw err;
    }
  } catch (error) {
    console.error("Error adding review for transfer:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Legacy endpoint - routes to appropriate handler
export const addReview = async (req: Request, res: Response) => {
  const { serviceId, txHash } = req.body;

  if (serviceId) {
    return addReviewForPurchase(req, res);
  } else if (txHash) {
    return addReviewForTransfer(req, res);
  } else {
    return res
      .status(400)
      .json({ message: "Either serviceId or txHash is required" });
  }
};

// Get Reviews for a service
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    // Use aggregation to join with profiles collection
    const reviews = await Review.aggregate([
      { $match: { serviceId: new mongoose.Types.ObjectId(serviceId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "profiles",
          let: { reviewerWallet: "$reviewerWallet" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: "$walletAddress" },
                    { $toLower: "$$reviewerWallet" },
                  ],
                },
              },
            },
          ],
          as: "reviewerProfile",
        },
      },
      {
        $unwind: {
          path: "$reviewerProfile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          reviewerWallet: 1,
          txHash: 1,
          "reviewerProfile.name": 1,
          "reviewerProfile.imageUrl": 1,
        },
      },
    ]);

    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get Reviews for a buyer-seller relationship
export const getReviewsByRelationship = async (req: Request, res: Response) => {
  try {
    const { buyerWallet, sellerWallet } = req.params;

    if (!buyerWallet || !sellerWallet) {
      return res.status(400).json({ message: "Missing wallet addresses" });
    }

    const reviews = await Review.aggregate([
      {
        $match: {
          $or: [
            {
              reviewerWallet: buyerWallet.toLowerCase(),
              sellerWallet: sellerWallet.toLowerCase(),
            },
            {
              reviewerWallet: sellerWallet.toLowerCase(),
              sellerWallet: buyerWallet.toLowerCase(),
            }
          ],
          chainId: CHAIN_ID,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          txHash: 1,
          "service.title": 1,
          "service.imageUrl": 1,
        },
      },
    ]);

    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews by relationship:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Check if a specific txHash has been reviewed
export const checkReviewStatus = async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    const review = await Review.findOne({
      txHash: txHash.toLowerCase(),
      chainId: CHAIN_ID,
    });

    return res.status(200).json({ reviewed: !!review, review });
  } catch (error) {
    console.error("Error checking review status:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
