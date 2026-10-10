import { getApiUrl } from "@/lib/core";

export type VideoKind = "image" | "file";
export type VideoPolicy = { enabled: boolean; maxSizeMb: number; maxConcurrent: number };
export type VideoConversionState = {
    status: "PROBING" | "READY" | "QUEUED" | "CONVERTING" | "COMPLETED" | "FAILED" | "CANCELLED";
    codec: string | null;
    progress: number;
    error: string | null;
    activeCount: number;
    policy: VideoPolicy;
    updatedAt: string;
};

export async function conversionRequest<T>(path: string, apiKey?: string, method = "GET"): Promise<T> {
    const response = await fetch(getApiUrl() + "/v1/video-conversions" + path, {
        method,
        headers: apiKey ? { "X-API-Key": apiKey } : undefined,
        cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Video conversion is unavailable");
    }
    return payload.message as T;
}

let policyCache: { expires: number; value: Promise<VideoPolicy> } | undefined;

export function getVideoConversionPolicy() {
    if (!policyCache || policyCache.expires < Date.now()) {
        policyCache = {
            expires: Date.now() + 30000,
            value: conversionRequest<VideoPolicy>("/policy"),
        };
    }
    return policyCache.value;
}

export function startVideoConversion(kind: VideoKind, id: string, apiKey: string) {
    return conversionRequest<VideoConversionState>(`/${kind}/${encodeURIComponent(id)}`, apiKey, "POST");
}

export function versionedVideoUrl(url: string, version: string) {
    if (!version || url.startsWith("blob:")) return url;
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + "videoVersion=" + encodeURIComponent(version);
}
