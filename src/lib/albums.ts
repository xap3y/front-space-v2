import {getApiUrl} from "@/lib/core";

export class AlbumRequestError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
    }
}

/** Calls `/v1/album{path}` with the session cookie and returns the response payload. */
export async function albumRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const response = await fetch(`${getApiUrl()}/v1/album${path}`, {
        method,
        credentials: "include",
        headers: {"Content-Type": "application/json", "Accept": "application/json"},
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.error) {
        throw new AlbumRequestError(data?.message || "Request failed", response.status);
    }
    return data.message as T;
}

export function getAlbumShareUrl(uniqueId: string) {
    return `${window.location.origin}/album/${uniqueId}`;
}
