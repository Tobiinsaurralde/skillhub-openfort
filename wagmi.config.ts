import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { getDefaultConfig } from "@openfort/react";

export const wagmiConfig = createConfig(
    getDefaultConfig({
        appName: "skillhub",
        chains: [base],
        transports: {
            [base.id]: http(),
        },
    })
);
