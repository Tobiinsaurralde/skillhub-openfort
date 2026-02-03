import { Schema, model } from "mongoose";

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true },
    walletAddress: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    paymentCurrency: { type: String, default: "USDC" },
    deliveryTime: { type: String, required: true },
    revisions: { type: String, required: true },
    description: { type: String, required: true },
    includes: {
      type: [String],
      validate: [
        (arr: string | any[]) => arr.length > 0,
        "Includes must have at least 1 item",
      ],
      default: [],
    },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    source: { type: String, default: "local" }, // local, 8004scan
    externalProfileUrl: { type: String },
    chainId: { type: Number, default: 8453 } // 8453 = Base, 11155111 = Sepolia
  },
  { timestamps: true }
);

// Indexes for performance
ServiceSchema.index({ category: 1, createdAt: -1 }); // Browse by category + sort
ServiceSchema.index({ walletAddress: 1 }); // "My Services"
ServiceSchema.index({ title: "text", description: "text" }); // Future-proofing for text search

export const Service = model("Service", ServiceSchema);
