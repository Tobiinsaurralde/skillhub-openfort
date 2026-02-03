import { decodeErrorResult } from "viem";

export const ENTRY_POINT_ERRORS = [
    {
        inputs: [
            { name: "opIndex", type: "uint256" },
            { name: "reason", type: "string" },
        ],
        name: "FailedOp",
        type: "error",
    },
] as const;

export function decodeEntryPointError(error: any): string | null {
    try {
        // Check if error object has data or message containing the signature
        const errorData = error.data || error.metaMessages?.[0] || error.message;

        if (typeof errorData === "string" && errorData.includes("0x220266b6")) {
            // Try to extract the hex string if it's embedded in text
            const match = errorData.match(/(0x220266b6[0-9a-fA-F]*)/);
            if (match) {
                const data = match[1] as `0x${string}`;
                if (data.length <= 10) {
                    return "EntryPoint Revert: FailedOp (Reason unavailable - data truncated)";
                }
                const result = decodeErrorResult({
                    abi: ENTRY_POINT_ERRORS,
                    data: data,
                });
                return `EntryPoint Revert: ${result.args?.[1]} (OpIndex: ${result.args?.[0]})`;
            }
        }

        // Attempt direct decode if it's an RPC error object structure
        if (error.info?.error?.data) {
            const result = decodeErrorResult({
                abi: ENTRY_POINT_ERRORS,
                data: error.info.error.data,
            });
            return `EntryPoint Revert: ${result.args?.[1]} (OpIndex: ${result.args?.[0]})`;
        }

        return null;
    } catch (e) {
        console.error("Failed to decode error:", e);
        return null;
    }
}
