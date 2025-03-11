const API_URL = process.env.API_URL || "http://127.0.0.1:8012";

const supportedLocales = ['ru', 'en', 'cs'];

export function getApiUrl() {
    return process.env.API_URL || "http://127.0.0.1:8012";
}

export function getSecretKey() {
    return process.env.SECRET_KEY || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
}

export function getDefaultLocale(): string {
    const locale = process.env.DEFAULT_LOCALE || "ru";

    if (!supportedLocales.includes(locale)) {
        return "ru";
    }

    return locale;
}

export function getApiKey() {
    return process.env.API_KEY || "null_API";
}

export function getCurlHeaders(apiKey: string = getApiKey()) {
    return {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': apiKey
    }
}

export async function postApi(url: string, body: any, apiKey: string) {
    const response = await fetch(API_URL + url, {
        method: "POST",
        headers: getCurlHeaders(apiKey),
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    if (!validateResponse(data)) {
        return null;
    }

    return data["message"];

}

export async function postApiForm(url: string, body: FormData, apiKey: string) {
    const response = await fetch(API_URL + url, {
        method: "POST",
        headers: {
            'x-api-key': apiKey,
            "Access-Control-Allow-Origin": "*"
        },
        body: body
    })

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    if (!validateResponse(data)) {
        return null;
    }

    return data["message"];

}

export function validateResponse(data: any): boolean {
    return !data["error"] && data["message"];
}

export async function getValidatedResponse(url: string): Promise<any> {
    const response = await fetch(getApiUrl() + url, {
        method: 'GET',
        headers: getCurlHeaders(),
    });

    const data = await response.json();

    console.log("response is " + data.toString())
    if (!response.ok) {
        return null;
    }

    //const data = await response.json();

    if (!validateResponse(data)) {
        return null;
    }

    return data["message"];
}

export default supportedLocales;