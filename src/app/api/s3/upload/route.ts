import {NextRequest, NextResponse} from "next/server";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import {cookies} from "next/headers";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {generateRandomUniqueId} from "@/lib/client";

const s3 = new S3Client({
    region: 'auto',
    endpoint: `${process.env.S3_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
})

export async function POST(req: NextRequest) {

    // check content type of req
    const contentType = req.headers.get('content-type');
    const filename = req.headers.get('filename');

    if (!contentType || !filename) {
        return NextResponse.json({ error: 'Invalid content type or filename' }, { status: 400 })
    }
    /*if (!contentType || !contentType.startsWith('multipart/form-data')) {
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }*/

    /*const formData = await req.formData()
    const file = formData.get('file') as File

    const cookieHeader = (await cookies()).toString();

    if (!file) {
        console.log("NO FORM DATA FILE")
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }*/

    //const buffer = Buffer.from(await file.arrayBuffer())

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `media/${filename}`,
        ContentType: contentType,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return NextResponse.json({ url })
}

/*
export async function POST(req: NextRequest) {

    // check content type of req
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    const cookieHeader = (await cookies()).toString();

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const command = new PutObjectCommand({
        Bucket: 'space',
        Key: "media/" + file.name,
        Body: buffer,
        ContentType: file.type,
    })

    try {
        await s3.send(command)
        return NextResponse.json({ success: true, filename: file.name })
    } catch (error) {
        return NextResponse.json({ error: 'Upload failed', details: error }, { status: 500 })
    }
}*/
