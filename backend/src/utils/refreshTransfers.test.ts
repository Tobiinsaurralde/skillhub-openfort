
import { describe, it, expect, vi, beforeEach } from 'vitest';

// define vars first via vi.hoisted
const mocks = vi.hoisted(() => ({
    client: {
        getBlockNumber: vi.fn(),
        getLogs: vi.fn(),
        getBlock: vi.fn(),
    },
    purchase: {
        findOne: vi.fn(),
        find: vi.fn(),
    },
    transfer: {
        find: vi.fn(),
        bulkWrite: vi.fn(),
    },
    walletRelationship: {
        findOne: vi.fn(),
        updateOne: vi.fn(),
    },
    review: {
        find: vi.fn(),
    },
}));

// Mock viem
vi.mock('viem', async () => {
    const actual = await vi.importActual('viem');
    return {
        ...actual,
        createPublicClient: () => mocks.client,
    };
});

// Mock Mongoose models
vi.mock('../models/purchase.model', () => ({ Purchase: mocks.purchase }));
vi.mock('../models/transfer.model', () => ({ Transfer: mocks.transfer }));
vi.mock('../models/walletRelationship.model', () => ({ WalletRelationship: mocks.walletRelationship }));
vi.mock('../models/review.model', () => ({ Review: mocks.review }));

// Import AFTER mocking
import { refreshTransfers } from './refreshTransfers';

describe('refreshTransfers', () => {
    const buyer = '0xbuyer';
    const seller = '0xseller';
    const lastProcessedBlock = 1000n;
    const currentBlock = 2000n;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mocks
        mocks.purchase.findOne.mockReturnValue({ sort: () => Promise.resolve({ blockNumber: '500' }) });
        mocks.purchase.find.mockReturnValue({ distinct: () => Promise.resolve([]) });

        mocks.walletRelationship.findOne.mockResolvedValue({ lastProcessedBlock: lastProcessedBlock.toString() });

        mocks.client.getBlockNumber.mockResolvedValue(currentBlock);

        mocks.transfer.find.mockReturnValue({ sort: () => Promise.resolve([]) });
        mocks.review.find.mockReturnValue({ distinct: () => Promise.resolve([]) });
    });

    it('should return empty list if no purchase found', async () => {
        mocks.purchase.findOne.mockReturnValue({ sort: () => Promise.resolve(null) });

        const result = await refreshTransfers(buyer, seller);

        expect(result.transfers).toEqual([]);
        expect(result.hasMore).toBe(false);
    });

    it('should process new logs correctly', async () => {
        // Mock logs
        const mockLogs = [
            {
                transactionHash: '0xtx1',
                blockNumber: 1500n,
                args: { value: 20000000n } // 20 USDC
            }
        ];
        mocks.client.getLogs.mockResolvedValue(mockLogs);
        mocks.client.getBlock.mockResolvedValue({ timestamp: 1234567890n });

        await refreshTransfers(buyer, seller);

        // Should call bulkWrite
        expect(mocks.transfer.bulkWrite).toHaveBeenCalledTimes(1);
        expect(mocks.transfer.bulkWrite).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                updateOne: expect.objectContaining({
                    filter: { chainId: 8453, txHash: '0xtx1' }
                })
            })
        ]));

        // Should update cursor
        expect(mocks.walletRelationship.updateOne).toHaveBeenCalledWith(
            expect.objectContaining({ buyerWallet: buyer.toLowerCase(), sellerWallet: seller.toLowerCase() }),
            expect.objectContaining({ $set: { lastProcessedBlock: expect.any(String) } }),
            { upsert: true }
        );
    });

    it('should handle logic when already up to date', async () => {
        mocks.walletRelationship.findOne.mockResolvedValue({ lastProcessedBlock: (currentBlock - 12n).toString() });

        const result = await refreshTransfers(buyer, seller);

        expect(mocks.client.getLogs).not.toHaveBeenCalled();
        expect(result.hasMore).toBe(false);
    });
});
