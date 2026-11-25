import {NextRequest, NextResponse} from "next/server";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {getApiUrl} from "@/lib/core";

const s3 = new S3Client({
    region: 'auto',
    endpoint: `${process.env.S3_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
})

export async function POST(req: NextRequest) {

    const body = await req.json().catch(() => null) as {contentType?: string} | null;
    // The request itself is JSON; the R2 object type must come from the selected file.
    const contentType = body?.contentType?.trim();
    const filename = req.headers.get('filename');

    if (!contentType || !filename || !/^[a-zA-Z0-9]+$/.test(filename)) {
        return NextResponse.json({ error: 'Invalid content type or filename' }, { status: 400 })
    }

    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return NextResponse.json({error: true, message: "Missing API key"}, {status: 401});
    }

    const availability = await fetch(`${getApiUrl()}/v1/image/cloud-upload-availability/${encodeURIComponent(filename)}`, {
        headers: {"X-API-Key": apiKey, Accept: "application/json"},
        cache: "no-store",
    });
    if (!availability.ok) {
        return new NextResponse(availability.body, {
            status: availability.status,
            headers: {"Content-Type": availability.headers.get("content-type") ?? "application/json"},
        });
    }

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `media/${filename}`,
        ContentType: contentType,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return NextResponse.json({ url })
}
