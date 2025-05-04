'use server';
import {getApiUrl, getCurlHeaders, getValidatedResponse} from "@/lib/core";
import {UploadedImage} from "@/types/image";
import {PasteDto} from "@/types/paste";
import {ShortUrlDto, ShortUrlLog} from "@/types/url";
import {DefaultResponse} from "@/types/core";
import {DiscordConnection} from "@/types/discord";

export async function getUserApi(id: string): Promise<DefaultResponse> {
    console.log("Calling getUserApi with id: " + id)

    const data = await getValidatedResponse('/v1/user/get/' + id);
    console.log("data is " + data)
    if (data.error) return data;
    /*const user = data["data"] as UserObj;
    user.createdAt = new Date(user.createdAt).toLocaleString()
    console.log("user is " + user)*/
    return data;
}

export async function getUserDiscordConnection(apiKey: string): Promise<DiscordConnection | null> {
    try {
        const url = '/v1/discord/get/@me';
        const response = await fetch(getApiUrl() + url, {
            method: 'GET',
            headers: getCurlHeaders(apiKey)
        });
        const data = await response.json();
        if (data.error) return null;
        return data["message"] as DiscordConnection;
    } catch (error) {
        return null;
    }
}

export async function revokeUserDiscordConnectionToken(token: string): Promise<boolean> {
    try {
        const url = '/v1/discord/token/' + token;
        const response = await fetch(getApiUrl() + url, {
            method: 'DELETE',
            headers: getCurlHeaders()
        });
        const data = await response.json();
        return !data.error
    } catch (error) {
        return false;
    }
}

export async function revokeUserDiscordConnection(apiKey: string): Promise<boolean> {
    try {
        const url = '/v1/discord/get/@me';
        const response = await fetch(getApiUrl() + url, {
            method: 'DELETE',
            headers: getCurlHeaders(apiKey)
        });
        const data = await response.json();
        return !data.error
    } catch (error) {
        return false;
    }
}

export async function getUserImages(uid: string): Promise<UploadedImage[] | null> {

    const data = await getValidatedResponse('/v1/admin/user/' + uid + "/images");
    if (!data) return null;
    const images = data["data"] as UploadedImage[];
    return images;
}

export async function getUserShortUrls(uid: string): Promise<ShortUrlDto[] | DefaultResponse> {

    const data = await getValidatedResponse('/v1/admin/user/' + uid + "/urls");
    if (data.error) return {error: true, message: "Failed to get short URLs"} as DefaultResponse;
    const urlList = data["data"] as ShortUrlDto[];
    return urlList;
}

export async function getUserShortUrlLogs(uid: string): Promise<ShortUrlLog[] | DefaultResponse> {
    const data = await getValidatedResponse('/v1/url/get/' + uid + "/logs");
    if (data.error) return {error: true, message: "Failed to get short URL logs"} as DefaultResponse;
    const urlList = data["data"] as ShortUrlLog[];
    return urlList;
}

export async function getImageInfoApi(uid: string): Promise<UploadedImage | null> {
    console.log("Calling getImageInfoApi with uid: " + uid)

    const data = await getValidatedResponse('/v1/image/info/' + uid, true);
    if (data.error) return null;
    const img = data["data"] as UploadedImage;
    img.uploader.createdAt = new Date(img.uploader.createdAt).toLocaleString()
    img.uploadedAt = new Date(img.uploadedAt).toLocaleString()
    return img;
}

export async function getPasteApi(uid: string): Promise<PasteDto | null> {
    console.log("Calling getPasteApi with uid: " + uid)

    const data = await getValidatedResponse('/v1/paste/get/' + uid);

    if (data.error) return null;

    const pasteDto = data["data"] as PasteDto;

    pasteDto.uploader.createdAt = new Date(pasteDto.uploader.createdAt).toLocaleString()
    pasteDto.createdAt = new Date(pasteDto.createdAt).toLocaleString()

    return pasteDto;
}

export async function getImageCountStatsOnDate(start: string, end: string, apiKey: string): Promise<any|null> {
    console.debug("[getImageCountStatsOnDate] CALL ")
    const response = await fetch(getApiUrl() + "/v1/stats/all", {
        method: 'POST',
        headers: getCurlHeaders(apiKey),
        body: JSON.stringify({
            fromDate: start,
            toDate: end,
            fillMissing: true
        })
    });

    const data = await response.json();
    if (!data) return null;
    console.debug("[getImageCountStatsOnDate] DATA IS " + data)
    return data;
}