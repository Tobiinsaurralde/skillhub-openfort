import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
    txHash: string;
    chainId: number;
    sellerWallet: string;
    serviceId?: mongoose.Types.ObjectId; // Optional - only for on-site purchases
    reviewerWallet: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

const ReviewSchema: Schema = new Schema(
    {
        txHash: {
            type: String,
            required: true,
        },
        chainId: {
            type: Number,
            required: true,
            default: 8453, // Base mainnet
        },
        sellerWallet: {
            type: String,
            required: true,
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: false, // Optional for off-site reviews
            index: true,
        },
        reviewerWallet: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            minlength: 10,
        },
    },
    {
        timestamps: true,
    }
);

// THE guardrail: one review per payment per chain
ReviewSchema.index({ chainId: 1, txHash: 1 }, { unique: true });

// Query optimization: fetch reviews for a service
ReviewSchema.index({ serviceId: 1, createdAt: -1 });

// Query optimization: fetch reviews for a buyer-seller relationship
ReviewSchema.index({ reviewerWallet: 1, sellerWallet: 1, chainId: 1 });

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
