import { Request, Response } from "express";

export const proxyRequest = async (req: Request, res: Response) => {
    try {
        const targetUrl = req.query.targetUrl as string;

        if (!targetUrl) {
            return res.status(400).json({ message: "Missing targetUrl query parameter" });
        }

        console.log(`[Proxy] Forwarding ${req.method} request to: ${targetUrl}`);

        // DEBUG: Check for X-Payment header
        const xPayment = req.headers['x-payment'];
        if (xPayment) {
            console.log("[Proxy] Found X-PAYMENT header:", xPayment.toString().substring(0, 20) + "...");
        } else {
            console.warn("[Proxy] WARNING: No X-PAYMENT header found in request!");
        }

        // Forward headers (excluding host/origin ones to avoid mismatch)
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
            const lowerKey = key.toLowerCase();
            if (["host", "origin", "referer", "content-length"].includes(lowerKey)) continue;

            // Force uppercase for X-PAYMENT as some servers are strict
            if (lowerKey === 'x-payment') {
                headers['X-PAYMENT'] = value as string;
            } else if (value) {
                headers[key] = value as string;
            }
        }

        // Add correct content-type if missing (fetch might default differently)
        if (!headers["content-type"]) {
            headers["content-type"] = "application/json";
        }

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body)
        });

        // Read response body as text first to avoid JSON parse errors on non-JSON responses
        const data = await response.text();

        // Forward status
        res.status(response.status);

        // Forward headers (e.g. content-type)
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        console.log(`[Proxy] Response status: ${response.status}`);

        return res.send(data);

    } catch (error) {
        console.error("[Proxy] Error:", error);
        return res.status(500).json({ message: "Proxy error", error: String(error) });
    }
};
