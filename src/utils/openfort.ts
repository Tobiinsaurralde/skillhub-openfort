import { Openfort } from "@openfort/openfort-js";

const publishableKey = import.meta.env.VITE_OPENFORT_PUBLIC_KEY;

if (!publishableKey) {
    throw new Error("Missing VITE_OPENFORT_PUBLIC_KEY");
}

export const openfort = new Openfort(publishableKey);
