'use server';
import {ShortUrlDto} from "@/types/url";
import {getApiKey, getApiUrl, getCurlHeaders, postApi} from "@/lib/core";
import {PasteDto} from "@/types/paste";
import {UploadedImage} from "@/types/image";
import {DefaultResponse} from "@/types/core";
import axios from "axios";
import {DiscordConnection} from "@/types/discord";
import defaultPeriodStats, {PeriodStats} from "@/types/stats";


export async function createShortUrl(url: string, apikey: string): Promise<ShortUrlDto | null> {
    console.log("Calling createShortUrl with url: " + url)

    const data = await postApi('/v1/url/create', {url: url}, apikey);

    if (!data) return null;

    const shortUrlDto = data as ShortUrlDto;

    shortUrlDto.uploader.createdAt = new Date(shortUrlDto.uploader.createdAt).toLocaleString()
    shortUrlDto.createdAt = new Date(shortUrlDto.createdAt).toLocaleString()

    return shortUrlDto;
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

export async function uploadImage(formData: FormData, apiKey: string, onProgress?: (progress: number) => void): Promise<UploadedImage | null> {

    console.log("Calling uploadImage with file:")

    /*const data = await postApiForm('/v1/image/upload', formData, apiKey);*/

    try {
        const response = await axios.post(getApiUrl() + "/v1/image/upload", formData, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'multipart/form-data',
            },
            timeout: 0,
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (onProgress) onProgress(percent);
                }
            },
        });

        if (!response.status.toString().startsWith("2") || !response.data) {
            return null;
        }

        console.log("Response data: ", response.data);
        console.log("Response data.message: ", response.data["message"]);
        return response.data["message"] as UploadedImage;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

export async function getPeriodStats(preset: string = "TODAY"): Promise<PeriodStats> {

    console.log("GETTING PERIOD DATA")
    const data = await postApi('/v1/stats/get', {preset: preset}, getApiKey());
    if (!data) return defaultPeriodStats;

    return data as PeriodStats;
}