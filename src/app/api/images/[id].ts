import type { NextApiRequest, NextApiResponse } from "next";

function isSafeId(id: string) {
    return /^[A-Za-z0-9_-]+$/.test(id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const imageId = Array.isArray(id) ? id[0] : id;

    if (!imageId || !isSafeId(imageId)) {
        res.status(400).send("Invalid id");
        return;
    }

    const base = process.env.IMAGE_BASE_URL;
    if (!base) {
        res.status(500).send("IMAGE_BASE_URL not set");
        return;
    }

    const session = req.cookies["session_token"];
    if (!session) {
        res.status(401).send("Missing session_token");
        return;
    }

    const upstreamUrl = `${base}/v1/image/get/${encodeURIComponent(imageId)}`;

    const upstreamRes = await fetch(upstreamUrl, {
        headers: { Cookie: `session_token=${session}` },
        cache: "no-store",
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
        res.status(upstreamRes.status || 502).send("Failed to fetch image");
        return;
    }

    // Pipe headers
    res.setHeader(
        "content-type",
        upstreamRes.headers.get("content-type") ?? "application/octet-stream"
    );
    res.setHeader(
        "cache-control",
        upstreamRes.headers.get("cache-control") ?? "private, no-store, max-age=0"
    );

    // Stream the body
    const reader = upstreamRes.body.getReader();
    const encoder = new TextEncoder();

    res.status(upstreamRes.status);
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // value is a Uint8Array; write directly
        res.write(Buffer.from(value));
    }
    res.end();
}