import mongoose, { Document, Schema } from "mongoose";

export interface ITransfer extends Document {
  txHash: string;
  chainId: number;
  buyerWallet: string;
  sellerWallet: string;
  amount: string;
  blockNumber: string;
  timestamp: Date;
  createdAt: Date;
}

const TransferSchema: Schema = new Schema(
  {
    txHash: {
      type: String,
      required: true,
    },
    chainId: {
      type: Number,
      required: true,
    },
    buyerWallet: {
      type: String,
      required: true,
    },
    sellerWallet: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    blockNumber: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one transfer per chain per txHash
TransferSchema.index({ chainId: 1, txHash: 1 }, { unique: true });

// Query optimization: find transfers for a buyer-seller relationship
TransferSchema.index({ buyerWallet: 1, sellerWallet: 1, chainId: 1 });

export const Transfer = mongoose.model<ITransfer>("Transfer", TransferSchema);

