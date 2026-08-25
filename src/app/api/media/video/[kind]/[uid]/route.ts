import {GetObjectCommand, HeadObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {NextRequest} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {params: Promise<{kind: string; uid: string}>};

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

function objectHeaders(result: {
    AcceptRanges?: string; CacheControl?: string; ContentLength?: number;
    ContentRange?: string; ContentType?: string; ETag?: string; LastModified?: Date;
}) {
    const headers = new Headers();
    headers.set("Accept-Ranges", result.AcceptRanges || "bytes");
    headers.set("Cache-Control", result.CacheControl || "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    if (result.ContentLength != null) headers.set("Content-Length", String(result.ContentLength));
    if (result.ContentRange) headers.set("Content-Range", result.ContentRange);
    if (result.ContentType) headers.set("Content-Type", result.ContentType);
    if (result.ETag) headers.set("ETag", result.ETag);
    if (result.LastModified) headers.set("Last-Modified", result.LastModified.toUTCString());
    return headers;
}

async function resolveObject(context: RouteContext) {
    const {kind, uid} = await context.params;
    if (!["media", "files"].includes(kind) || !/^[A-Za-z0-9._-]+$/.test(uid)) throw new Error("INVALID_PATH");
    if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !process.env.S3_BUCKET_NAME) throw new Error("NOT_CONFIGURED");
    return {Bucket: process.env.S3_BUCKET_NAME, Key: `${kind}/${uid}`};
}

function errorResponse(error: unknown) {
    if (error instanceof Error && error.message === "INVALID_PATH") return new Response("Invalid video path", {status: 400});
    if (error instanceof Error && error.message === "NOT_CONFIGURED") return new Response("R2 storage is not configured", {status: 503});
    const status = (error as {$metadata?: {httpStatusCode?: number}})?.$metadata?.httpStatusCode;
    if (status === 404) return new Response("Video not found", {status: 404});
    console.error("R2 video proxy failed", error);
    return new Response("Video storage is unavailable", {status: 502});
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const object = await resolveObject(context);
        const result = await s3.send(new GetObjectCommand({...object, Range: request.headers.get("range") || undefined}));
        const body = result.Body?.transformToWebStream();
        if (!body) return new Response("Video storage returned an empty body", {status: 502});
        return new Response(body, {status: result.ContentRange ? 206 : 200, headers: objectHeaders(result)});
    } catch (error) {
        return errorResponse(error);
    }
}

export async function HEAD(_request: NextRequest, context: RouteContext) {
    try {
        const object = await resolveObject(context);
        const result = await s3.send(new HeadObjectCommand(object));
        return new Response(null, {status: 200, headers: objectHeaders(result)});
    } catch (error) {
        return errorResponse(error);
    }
}
