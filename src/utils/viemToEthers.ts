import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { type WalletClient } from 'viem';

/**
 * Converts a viem WalletClient to an ethers.js Signer.
 * @param walletClient The viem WalletClient instance.
 * @returns A Promise that resolves to an ethers.js JsonRpcSigner.
 */
export async function walletClientToSigner(walletClient: WalletClient) {
    const { account, chain, transport } = walletClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new BrowserProvider(transport as any, network);
    const signer = new JsonRpcSigner(provider, account.address);
    return signer;
}
