'use server';

import {ShortUrlDto} from "@/types/url";
import {getApiKey, getApiUrl, getCurlHeaders, postApi} from "@/lib/core";
import {PasteDto} from "@/types/paste";
import {DefaultResponse} from "@/types/core";
import {DiscordConnection, KeyRequest} from "@/types/discord";
import defaultPeriodStats, {PeriodStats} from "@/types/stats";
import axios, {CancelToken} from "axios";
import {headers} from "next/headers";


export async function createShortUrl(url: string, apikey: string, uniqueId: string | null): Promise<ShortUrlDto | null> {
    console.log("Calling createShortUrl with url: " + url)

    const data = await postApi('/v1/url/create', {url: url, uniqueId: uniqueId}, apikey);

    if (!data) return null;

    const shortUrlDto = data as ShortUrlDto;

    shortUrlDto.uploader.createdAt = new Date(shortUrlDto.uploader.createdAt).toLocaleString()
    shortUrlDto.createdAt = new Date(shortUrlDto.createdAt).toLocaleString()

    return shortUrlDto;
}

export async function generatePresignedPutUrl(fileName: string, contentType: string): Promise<DefaultResponse> {

    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    console.log("Client IP:", clientIp);


    const presignRes = await axios.post(
        getApiUrl() + "/v1/files/presigned-url/put",
        {},
        {
            headers: {
                "x-api-key": getApiKey(),
                'x-forwarded-for': clientIp,
                'x-real-ip': clientIp,
            },
            params: {
                filename: fileName,
                contentType: contentType,
            },
        }
    );

    if (!presignRes.data || presignRes.data.error) {
        return {error: true, message: "Failed to get presigned URL"} as DefaultResponse;
    }

    return {error: false, data: presignRes.data.url} as DefaultResponse;
}

export async function deleteShortUrl(shortUrl: ShortUrlDto, apikey: string): Promise<DefaultResponse> {
    console.debug("Calling deleteShortUrl with shortUrl: " + shortUrl.uniqueId)

    try {
        const response = await fetch(getApiUrl() + "/v1/url/get/" + shortUrl.uniqueId, {
            method: "DELETE",
            headers: getCurlHeaders(apikey)
        })

        if (!response) return {error: true, message: "Failed to delete short URL"} as DefaultResponse;

        return (await response.json()) as DefaultResponse;
    } catch (e) {
        return {error: true, message: "Server error"} as DefaultResponse;
    }
}

export async function createMinecraftServerApiKey(req: KeyRequest): Promise<DefaultResponse> {
    console.debug("Calling createMinecraftServerApiKey with name: " + req.name)

    try {
        const response = await fetch(getApiUrl() + "/v1/discord/transcript/create", {
            method: "POST",
            body: JSON.stringify({
                serverName: req.name,
                serverIp: req.address,
                ownerEmail: req.email,
                ownerIp: req.ip,
                token: req.token,
                password: req.password
            }),
            headers: getCurlHeaders()
        })

        if (!response) return {error: true, message: "Failed to create api key"} as DefaultResponse;

        return (await response.json()) as DefaultResponse;
    } catch (e) {
        return {error: true, message: "Server error"} as DefaultResponse;
    }
}

export async function createInvites(count: number, prefix?: string, creator?: number): Promise<DefaultResponse> {
    console.debug("Calling createInvites with count: " + count)

    try {
        const response = await fetch(getApiUrl() + "/v1/admin/invite/create?amount=" + count + ((prefix !== undefined) ? "&prefix=" + prefix : ""), {
            method: "POST",
            headers: getCurlHeaders()
        })

        if (!response) return {error: true, message: "Failed to create codes!"} as DefaultResponse;

        return (await response.json()) as DefaultResponse;
    } catch (e) {
        return {error: true, message: "Server error"} as DefaultResponse;
    }

}

export async function createPaste(title: string, paste: string, apikey: string): Promise<PasteDto | null> {
    console.log("Calling createPaste with paste: " + paste.substring(0, 15) + "...")

    const data = await postApi('/v1/paste/create', {title: title, text: paste}, apikey);

    if (!data) return null;

    const pasteDto = data as PasteDto;

    pasteDto.uploader.createdAt = new Date(pasteDto.uploader.createdAt).toLocaleString()
    pasteDto.createdAt = new Date(pasteDto.createdAt).toLocaleString()

    return pasteDto;
}

export async function authorizeDiscordConnectionRaw(tokenData: any, apiKey: string, url: string = "/v1/discord/authorize"): Promise<Response> {
    const body = JSON.stringify({
        accessToken: tokenData["access_token"],
        refreshToken: tokenData["refresh_token"],
        expiresAt: tokenData["expires_in"]
    })
    const response = await fetch(getApiUrl() + url, {
        method: 'POST',
        headers: getCurlHeaders(apiKey),
        body: body,
        credentials: "include"
    });

    return response
}

export async function authorizeDiscordConnection(tokenData: any, apiKey: string, url: string = "/v1/discord/authorize"): Promise<DiscordConnection | null> {
    const response = await authorizeDiscordConnectionRaw(tokenData, apiKey, url);
    const data = await response.json();
    if (data.error) {
        console.log(data)
        return null;
    }
    return data["message"] as DiscordConnection;
}

export async function getPeriodStats(preset: string = "TODAY"): Promise<PeriodStats> {

    console.log("GETTING PERIOD DATA")
    const data = await postApi('/v1/stats/get', {preset: preset}, getApiKey());
    if (!data) return defaultPeriodStats;

    return data as PeriodStats;
}

export async function updateMinecraftServer(
    serverId: string,
    updates: {
        password?: string;
        apiKey?: string;
        paused?: boolean;
    }
): Promise<boolean> {
    console.log("Updating Minecraft server:", serverId, updates);

    try {
        const response = await fetch(getApiUrl() + `/v1/discord/transcript/get/${serverId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'X-API-Key': getApiKey() || "",
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            console.error("Failed to update server:");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error updating server:", error);
        return false;
    }
}

export async function deleteMinecraftServer(serverId: string): Promise<boolean> {
    console.log("Deleting Minecraft server:", serverId);

    try {
        const response = await fetch(getApiUrl() + `/v1/discord/transcript/get/${serverId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                'X-API-Key': getApiKey() || "",
            },
        });

        if (!response.ok) {
            console.error("Failed to delete server:", response.statusText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error deleting server:", error);
        return false;
    }
}

function getClientIp(headersList: any): string {
    // Check common headers (in order of preference)
    const xForwardedFor = headersList.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = headersList.get('x-real-ip');
    if (xRealIp) {
        return xRealIp;
    }

    const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return 'unknown';
}