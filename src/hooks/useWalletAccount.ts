import { useAccount, useWalletClient } from "wagmi";
import { createPublicClient, http } from "viem";
import { base, celo, scrollSepolia } from "@reown/appkit/networks";

export const useWalletAccount = () => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });


  return {
    isConnected,
    walletClient,
    publicClient,
    user: address,
  };
};
