import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isSafeId(id: string) {
    return /^[A-Za-z0-9_-]+$/.test(id);
}

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = (await params)?.id;
    if (!id || !isSafeId(id)) {
        return new Response("Invalid id", { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
        return new Response("IMAGE_BASE_URL not set", { status: 500 });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("session_token")?.value;

    if (!session) {
        return new Response("Missing session_token", { status: 401 });
    }

    const upstreamUrl = `${base}/v1/image/get/${encodeURIComponent(id)}`;

    const headers: HeadersInit = {
        Cookie: `session_token=${session}`,
    };

    const upstreamRes = await fetch(upstreamUrl, {
        headers,
        cache: "no-store",
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
        return new Response("Failed to fetch image", {
            status: upstreamRes.status || 502,
            headers: { "content-type": "text/plain" },
        });
    }

    const contentType =
        upstreamRes.headers.get("content-type") ?? "application/octet-stream";

    const cacheControl =
        upstreamRes.headers.get("cache-control") ?? "private, no-store, max-age=0";

    return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
            "content-type": contentType,
            "cache-control": cacheControl,
        },
    });
}