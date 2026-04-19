import {NextRequest, NextResponse} from "next/server";

export async function POST(req: NextRequest) {

    return NextResponse.json({error: true, message: "Deprecated"}, {status: 404});

    /*const {fileName, contentType} = await req.json();

    if (!fileName || !contentType) {
        return NextResponse.json({error: true, message: "Missing fileName or contentType"}, {status: 400});
    }

    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return NextResponse.json({error: true, message: "Missing API key"}, {status: 401});
    }

    const isValidKey = await validateApiKeyServer(apiKey);
    if (!isValidKey) {
        return NextResponse.json({error: true, message: "Invalid API key"}, {status: 403});
    }

    const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';

    console.log("Client IP:", clientIp);

    // Forward to backend with client IP
    const response = await axios.post(getApiUrl() + "/v1/files/presigned-url/put", {}, {
        headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': clientIp,
            'x-real-ip': clientIp,
            'x-api-key': getApiKey()
        },
        params: {
            filename: fileName,
            contentType: contentType,
        },
    });

    if (!response.data || response.data.error) {
        return NextResponse.json({error: true, message: "Failed to get presigned URL"}, {status: 500});
    }

    return NextResponse.json({error: false, data: response.data} as DefaultResponse);*/
}