import "server-only";

import {cookies} from "next/headers";
import {getApiUrl, validateResponse} from "@/lib/core";
import type {DefaultResponse} from "@/types/core";

export async function sessionHeaders(json = false): Promise<Record<string, string>> {
    const token = (await cookies()).get("session_token")?.value;
    return {
        Accept: "application/json",
        ...(token ? {Cookie: `session_token=${token}`} : {}),
        ...(json ? {"Content-Type": "application/json"} : {}),
    };
}

export async function getAuthenticatedResponse(url: string, noAuth = false): Promise<DefaultResponse> {
    try {
        const response = await fetch(getApiUrl() + url, {
            headers: noAuth ? {Accept: "application/json"} : await sessionHeaders(),
            cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !validateResponse(data)) {
            return {error: true, message: data?.message || "Request failed"} as DefaultResponse;
        }
        return {
            error: false,
            message: data.data,
            data: data.message,
            count: data.count,
            timestamp: data.timestamp,
        } as DefaultResponse;
    } catch {
        return {error: true, message: "Server error"} as DefaultResponse;
    }
}
