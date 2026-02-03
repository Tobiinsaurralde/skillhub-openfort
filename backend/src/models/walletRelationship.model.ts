import mongoose, { Document, Schema } from "mongoose";

export interface IWalletRelationship extends Document {
  buyerWallet: string;
  sellerWallet: string;
  chainId: number;
  lastProcessedBlock: string;
  createdAt: Date;
}

const WalletRelationshipSchema: Schema = new Schema(
  {
    buyerWallet: {
      type: String,
      required: true,
    },
    sellerWallet: {
      type: String,
      required: true,
    },
    chainId: {
      type: Number,
      required: true,
    },
    lastProcessedBlock: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one cursor per buyer-seller-chain combination
WalletRelationshipSchema.index(
  { buyerWallet: 1, sellerWallet: 1, chainId: 1 },
  { unique: true }
);

export const WalletRelationship = mongoose.model<IWalletRelationship>(
  "WalletRelationship",
  WalletRelationshipSchema
);

