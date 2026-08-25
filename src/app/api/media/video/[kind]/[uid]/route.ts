import {NextRequest} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
    params: Promise<{kind: string; uid: string}>;
};

const FORWARDED_RESPONSE_HEADERS = [
    "accept-ranges",
    "cache-control",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
] as const;

async function proxyR2Video(request: NextRequest, context: RouteContext) {
    const {kind, uid} = await context.params;

    if (!["media", "files"].includes(kind) || !/^[A-Za-z0-9._-]+$/.test(uid)) {
        return new Response("Invalid video path", {status: 400});
    }

    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL;
    if (!storageUrl) return new Response("R2 storage is not configured", {status: 503});

    const upstreamHeaders = new Headers();
    const range = request.headers.get("range");
    const ifRange = request.headers.get("if-range");
    if (range) upstreamHeaders.set("Range", range);
    if (ifRange) upstreamHeaders.set("If-Range", ifRange);

    try {
        const upstream = await fetch(
            `${storageUrl.replace(/\/$/, "")}/${kind}/${encodeURIComponent(uid)}`,
            {
                method: request.method,
                headers: upstreamHeaders,
                cache: "no-store",
                signal: request.signal,
            },
        );

        const headers = new Headers();
        for (const name of FORWARDED_RESPONSE_HEADERS) {
            const value = upstream.headers.get(name);
            if (value) headers.set(name, value);
        }
        headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");
        headers.set("X-Content-Type-Options", "nosniff");

        return new Response(request.method === "HEAD" ? null : upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers,
        });
    } catch {
        return new Response("Video storage is unavailable", {status: 502});
    }
}

export async function GET(request: NextRequest, context: RouteContext) {
    return proxyR2Video(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
    return proxyR2Video(request, context);
}
