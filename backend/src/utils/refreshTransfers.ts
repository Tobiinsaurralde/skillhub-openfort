import { createPublicClient, http, parseAbiItem, parseUnits, Address } from "viem";
import { base } from "viem/chains";
import { Purchase } from "../models/purchase.model";
import { Transfer } from "../models/transfer.model";
import { Review } from "../models/review.model";
import { WalletRelationship } from "../models/walletRelationship.model";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const CHAIN_ID = 8453; // Base mainnet
const MIN_CONFIRMATIONS = 12n;
const MIN_USDC = parseUnits("0", 6); // No minimum, show all transfers
const MAX_BLOCK_RANGE = 10_000n; // Increase chunk size for faster sync (2k was too slow)

const client = createPublicClient({
  chain: base,
  transport: http(),
});

interface TransferResult {
  txHash: string;
  amount: string;
  blockNumber: string;
  timestamp: Date;
  reviewed: boolean;
  buyerWallet: string; // Add this
}

interface RefreshResult {
  transfers: TransferResult[];
  hasMore: boolean;
  error?: string;
}

export async function refreshTransfers(
  buyer: string,
  seller: string
): Promise<RefreshResult> {
  const buyerLower = buyer.toLowerCase() as Address;
  const sellerLower = seller.toLowerCase();

  // 1. Get first on-site purchase (in either direction) to determine relationship start
  const firstPurchase = await Purchase.findOne({
    $or: [
      {
        buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
        sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
      },
      {
        buyerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
        sellerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
      }
    ]
  }).sort({ createdAt: 1 }); // Sort by time, not block string

  if (!firstPurchase) {
    // No on-site purchase = no relationship = nothing to scan
    return { transfers: [], hasMore: false };
  }

  // 2. Get all on-site purchase txHashes to exclude
  const onSiteTxHashes = await Purchase.find({
    buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
  }).distinct("txHash");
  const excludeSet = new Set(onSiteTxHashes.map((h: string) => h.toLowerCase()));

  // 3. Get cursor (or start from first purchase block)
  const relationship = await WalletRelationship.findOne({
    buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
    chainId: CHAIN_ID,
  });

  let paramsStartBlock = 0n;
  if (firstPurchase.blockNumber) {
    paramsStartBlock = BigInt(firstPurchase.blockNumber);
  } else {
    // Auto-heal: Fetch block number from chain if missing AND if it's a valid hash
    if (firstPurchase.txHash.startsWith("0x") && firstPurchase.txHash.length === 66) {
      try {
        console.log(`Recovering block number for tx: ${firstPurchase.txHash}`);
        const tx = await client.getTransaction({ hash: firstPurchase.txHash as `0x${string}` });
        if (tx && tx.blockNumber) {
          paramsStartBlock = tx.blockNumber;
          // Update DB asynchronously
          await Purchase.updateOne({ _id: firstPurchase._id }, { blockNumber: paramsStartBlock.toString() });
          console.log(`Recovered and saved block ${paramsStartBlock} for purchase ${firstPurchase._id}`);
        } else {
          console.error("Could not fetch tx from chain, defaulting to 0");
        }
      } catch (err) {
        console.error("Error healing block number:", err);
      }
    } else {
      console.warn(`Skipping block recovery for invalid/manual txHash: ${firstPurchase.txHash}, defaulting to 0`);
      paramsStartBlock = 0n;
    }
  }

  const relationshipStartBlock = paramsStartBlock;
  const lastProcessedBlock = relationship?.lastProcessedBlock
    ? BigInt(relationship.lastProcessedBlock)
    : relationshipStartBlock - 1n;

  // 4. Get latest block (with error handling)
  let latestBlock: bigint;
  try {
    latestBlock = await client.getBlockNumber();
  } catch (err) {
    console.error("Failed to fetch latest block:", err);
    return {
      transfers: await getCachedTransfers(buyer, seller),
      hasMore: true,
      error: "Failed to fetch latest block",
    };
  }

  const maxConfirmedBlock = latestBlock - MIN_CONFIRMATIONS;

  // OPTIMIZATION: User only cares about recent history (last ~4-5 months)
  // 6 months * 30 days * 24 hours * 1800 blocks/hour (~2s block time) = ~7.7M blocks
  // Let's use 6,000,000 blocks (~4.5 months) as a safe lookback window.
  const MAX_LOOKBACK_BLOCKS = 6_000_000n;
  const minAllowedBlock = maxConfirmedBlock - MAX_LOOKBACK_BLOCKS;

  let currentFromBlock = lastProcessedBlock + 1n;

  // Clamp start block if it's too old (e.g. defaulting to 0 or 2001)
  if (currentFromBlock < minAllowedBlock) {
    console.log(`Clamping scan start from ${currentFromBlock} to ${minAllowedBlock} (limiting to last ~4.5 months)`);
    currentFromBlock = minAllowedBlock;
  }

  let hasMore = true;
  let iterationCount = 0;
  const MAX_ITERATIONS = 20; // Sync up to 20 chunks (200k blocks) per click

  console.log(`Starting sync loop from ${currentFromBlock} to ${maxConfirmedBlock}`);

  while (currentFromBlock < maxConfirmedBlock && iterationCount < MAX_ITERATIONS) {
    iterationCount++;

    // Calculate current chunk range
    const toBlock =
      currentFromBlock + MAX_BLOCK_RANGE < maxConfirmedBlock
        ? currentFromBlock + MAX_BLOCK_RANGE
        : maxConfirmedBlock;

    console.log(`Sync iteration ${iterationCount}: ${currentFromBlock} -> ${toBlock}`);

    // Query chain logs
    let logs;
    try {
      // Rate limit mitigation: Add small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 200));

      logs = await client.getLogs({
        address: USDC_ADDRESS,
        event: parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 value)"
        ),
        args: { from: buyerLower, to: sellerLower as Address },
        fromBlock: currentFromBlock,
        toBlock: toBlock,
      });
    } catch (err: any) {
      // Handle Rate Limit Gracefully
      if (err?.message?.includes("429") || err?.details?.includes("rate limit") || err?.code === -32016) {
        console.warn("Rate limit hit (429), saving partial progress and stopping loop.");
        hasMore = true; // We explicitly have more but stopped early
        break; // Exit loop, but let the function continue to save progress
      }

      console.error("Failed to fetch logs:", err);
      return {
        transfers: await getCachedTransfers(buyer, seller),
        hasMore: true,
        error: "Failed to fetch latest payments (RPC error)",
      };
    }

    // Process logs immediately to avoid memory bloat
    const newTransfers = logs.filter(
      (log: { args: { value?: bigint }; blockNumber: bigint | null; transactionHash: string }) =>
        log.args.value !== undefined &&
        log.args.value >= MIN_USDC &&
        log.blockNumber !== null &&
        !excludeSet.has(log.transactionHash.toLowerCase())
    );

    if (newTransfers.length > 0) {
      // Fetch timestamps
      const uniqueBlocks = [...new Set(newTransfers.map((t: { blockNumber: bigint | null }) => t.blockNumber!))];
      const blockTimestamps = new Map<bigint, Date>();

      for (const blockNum of uniqueBlocks) {
        try {
          const block = await client.getBlock({ blockNumber: blockNum as bigint });
          blockTimestamps.set(blockNum as bigint, new Date(Number(block.timestamp) * 1000));
        } catch {
          blockTimestamps.set(blockNum as bigint, new Date());
        }
      }

      // Upsert transfers
      await Transfer.bulkWrite(
        newTransfers.map((log: { transactionHash: string; args: { value?: bigint }; blockNumber: bigint | null }) => ({
          updateOne: {
            filter: {
              chainId: CHAIN_ID,
              txHash: log.transactionHash.toLowerCase(),
            },
            update: {
              $setOnInsert: {
                chainId: CHAIN_ID,
                txHash: log.transactionHash.toLowerCase(),
                buyerWallet: buyerLower,
                sellerWallet: sellerLower,
                amount: log.args.value!.toString(),
                blockNumber: log.blockNumber!.toString(),
                timestamp: blockTimestamps.get(log.blockNumber!) || new Date(),
                createdAt: new Date(),
              },
            },
            upsert: true,
          },
        }))
      );
    }

    // Update cursor in variable
    currentFromBlock = toBlock + 1n;

    // Safety check if we are done
    if (toBlock >= maxConfirmedBlock) {
      hasMore = false;
      break;
    }
  }

  // Update DB with final progress
  const finalProcessedBlock = currentFromBlock - 1n; // We completed up to (currentFromBlock - 1)

  const existingRel = await WalletRelationship.findOne({
    buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
    chainId: CHAIN_ID,
  });

  if (existingRel) {
    existingRel.lastProcessedBlock = finalProcessedBlock.toString();
    await existingRel.save();
  } else {
    await WalletRelationship.create({
      buyerWallet: buyerLower,
      sellerWallet: sellerLower,
      chainId: CHAIN_ID,
      lastProcessedBlock: finalProcessedBlock.toString()
    });
  }

  return {
    transfers: await getCachedTransfers(buyer, seller),
    hasMore,
  };
}

async function getCachedTransfers(
  buyer: string,
  seller: string
): Promise<TransferResult[]> {
  const transfers = await Transfer.find({
    buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
    chainId: CHAIN_ID,
  }).sort({ blockNumber: -1 });

  // Get reviewed txHashes (O(1) lookup)
  const reviewedTxHashes = await Review.find({
    reviewerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
    chainId: CHAIN_ID,
  }).distinct("txHash");
  const reviewedSet = new Set(reviewedTxHashes.map((h: string) => h.toLowerCase()));

  return transfers.map((t: { txHash: string; amount: string; blockNumber: string; timestamp: Date; buyerWallet: string }) => ({
    txHash: t.txHash,
    amount: t.amount,
    blockNumber: t.blockNumber,
    timestamp: t.timestamp,
    reviewed: reviewedSet.has(t.txHash.toLowerCase()),
    buyerWallet: t.buyerWallet, // Return buyerWallet
  }));
}

// Get cached transfers without refreshing (for instant page load)
export async function getCachedTransfersForRelationship(
  buyer: string,
  seller: string
): Promise<RefreshResult> {
  // Check if relationship exists
  const firstPurchase = await Purchase.findOne({
    buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
  });

  if (!firstPurchase) {
    return { transfers: [], hasMore: false };
  }

  // Check if we need to scan more
  const relationship = await WalletRelationship.findOne({
    buyerWallet: { $regex: new RegExp(`^${buyer}$`, "i") },
    sellerWallet: { $regex: new RegExp(`^${seller}$`, "i") },
    chainId: CHAIN_ID,
  });

  let hasMore = false;
  if (relationship?.lastProcessedBlock) {
    try {
      const latestBlock = await client.getBlockNumber();
      const maxConfirmedBlock = latestBlock - MIN_CONFIRMATIONS;
      hasMore = BigInt(relationship.lastProcessedBlock) < maxConfirmedBlock;
    } catch {
      hasMore = true; // Assume there might be more if we can't check
    }
  } else {
    hasMore = true; // Never scanned before
  }

  return {
    transfers: await getCachedTransfers(buyer, seller),
    hasMore,
  };
}

