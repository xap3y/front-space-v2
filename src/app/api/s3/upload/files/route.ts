import {NextRequest, NextResponse} from "next/server";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {validateApiKeyServer} from "@/lib/serverFuncs";

const s3 = new S3Client({
    region: 'auto',
    endpoint: `${process.env.S3_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
})

export async function POST(req: NextRequest) {

    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Missing API key' },
            { status: 401 }
        );
    }

    const isValidKey = await validateApiKeyServer(apiKey);

    if (!isValidKey) {
        return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 403 }
        );
    }

    // check content type of req
    const contentType = req.headers.get('content-type');
    const filename = req.headers.get('filename');

    console.log("filename is " + filename)

    if (!contentType || !filename) {
        return NextResponse.json({ error: 'Invalid content type or filename' }, { status: 400 })
    }

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `files/${filename}`,
        ContentType: contentType,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return NextResponse.json({ url })
}