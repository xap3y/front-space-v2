'use server';

import {getApiKey, getApiUrl, getCurlHeaders, getValidatedResponse, postApi} from "@/lib/core";

export async function logToServer(message: string, ...optionalParams: any[]) {
    console.log(`[Server] ${message}`, ...optionalParams);
}

export async function getSecretKey(): Promise<string> {
    const key = process.env.SECRET_KEY;
    if (!key) {
        throw new Error("SECRET_KEY is not defined in environment variables.");
    }
    return key;
}

export async function validateApiKeyServer(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(getApiUrl() + "/v1/auth/validate", {
            method: 'GET',
            headers: getCurlHeaders(apiKey)
        });

        if (!response.ok) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}
