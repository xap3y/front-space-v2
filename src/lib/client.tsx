"use client";

import {toast} from "react-toastify";
import {RoleType, UserObjShort} from "@/types/user";
import {JSX} from "react";
import {UploadedImage} from "@/types/image";
import axios from "axios";
import {getApiKey, getApiUrl, getCurlHeaders, getValidatedResponse} from "@/lib/core";
import {CallServer, DefaultResponse} from "@/types/core";
import LanguageModel from "@/types/LanguageModel";
import {Album} from "@/types/album";
import {logToServer} from "@/lib/serverFuncs";
import {EmbedSettings, UrlPreferences} from "@/types/configs";
import translations from "@/hooks/useTranslation";

export const errorToast = (message: string, delay: number = 1000) => {
    return toast.error(message, {
        autoClose: delay,
        closeOnClick: true,
    })
}

export const okToast = (message: string, delay: number = 1000) => {
    return toast.success(message, {
        autoClose: delay,
        closeOnClick: true,
    })
}

export const infoToast = (message: string, delay: number = 1000) => {
    return toast.info(message, {
        autoClose: delay,
        closeOnClick: true,
    })
}

export async function deleteVerifyToken() {
    await fetch("/api/auth/clear", { method: "POST", credentials: "include" });
}

export const copyToClipboard = (text: string, lang: LanguageModel | null = null, delay: number = 500) => {
    navigator.clipboard.writeText(text);
    infoToast(lang ? lang.toasts.success.copied_to_clipboard : "Copied to clipboard", delay);
};

export function secondsToHuman(seconds: number): string {
    if (!seconds || seconds <= 0) return "Permanent";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    return parts.length ? parts.join(" ") : `${seconds}s`;
}

export function isValidDurationExpr(expr: string): boolean {
    if (!expr) return false;
    const s = expr.trim();
    const re = /^[+-]?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?\s*$/i;
    const m = s.match(re);
    if (!m) return false;
    const hasAny = (m[1] && m[1] !== "0") || (m[2] && m[2] !== "0") || (m[3] && m[3] !== "0");
    return !!hasAny;
}

export const debugLog = (text: string, text2?: any) => {
    if (process.env.NODE_ENV === "development") {
        (text2) ? console.debug("[D] " + text) : console.debug("[D] " + text + " => " + text2);
    } else { // TODO: remove this in production
        console.log(text);
    }
}

type BadgeSize = "xs" | "sm" | "md";

type BadgeOptions = {
    size?: BadgeSize;
    uppercase?: boolean;
    labelOverride?: string;
    className?: string;
};


export const getUserRoleBadge = (
    role: RoleType,
    opts?: { size?: "xs" | "sm" | "md" }
): JSX.Element => {
    const size = opts?.size ?? "sm";

    const sizeClass =
        size === "xs"
            ? "text-[10px] px-2 py-0.5"
            : size === "md"
                ? "text-sm px-3 py-1"
                : "text-xs px-2.5 py-0.5";

    // Keep your "border same" vibe: not too rounded, consistent border, slightly cleaner typography
    const base = `inline-flex items-center border border-white/10 rounded-md font-semibold tracking-wide leading-none ${sizeClass}`;

    switch (role) {
        case "OWNER":
            return (
                <span className={`${base} bg-yellow-900/80 text-yellow-200`}>
          owner
        </span>
            );

        case "ADMIN":
            return (
                <span className={`${base} bg-red-900/70 text-red-200`}>
          admin
        </span>
            );

        case "MODERATOR":
            return (
                <span className={`${base} bg-blue-500/20 text-blue-200`}>
          moderator
        </span>
            );

        case "USER":
            return (
                <span className={`${base} bg-gray-700/40 text-gray-200`}>
          user
        </span>
            );

        case "GUEST":
            return (
                <span className={`${base} bg-primary-darker/70 text-white`}>
          guest
        </span>
            );

        case "BANNED":
            return (
                <span className={`${base} bg-red-600/70 text-white font-bold`}>
          BANNED
        </span>
            );

        case "DELETED":
            return (
                <span className={`${base} bg-red-600/70 text-white font-bold`}>
          DELETED
        </span>
            );

        case "TESTER":
            return (
                <span className="inline-flex items-center gap-2">
          <span className={`${base} bg-gray-700/40 text-gray-200`}>tester</span>
          <span className={`${base} bg-red-900/70 text-red-200`}>admin</span>
        </span>
            );

        default:
            return (
                <span className={`${base} bg-gray-700/40 text-gray-200`}>
          user
        </span>
            );
    }
};

export async function validateApiKey(apiKey: string): Promise<UserObjShort | false> {
    console.log("Calling validateApiKey with key: " + apiKey)

    try {
        const response = await axios.get(getApiUrl() + "/v1/auth/validate", {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'multipart/form-data',
            },
            timeout: 0,
        });

        console.log(response)

        if (!response.status.toString().startsWith("2")) {
            return false;
        }

        const data = response.data;

        const error: boolean = data["error"];
        if (error) {
            console.error("Error validating API key: ", data["message"]);
            return false;
        }
        return data["message"] as UserObjShort;
    } catch (error) {
        return false;
    }
}

export async function saveUserEmbedSettings(apiKey: string, settings: EmbedSettings): Promise<boolean> {
    console.log("Calling saveUserEmbedSettings with key: " + apiKey)

    try {
        const response = await axios.patch(getApiUrl() + "/v1/user/get/@me/settings/webhook", settings, {
            headers: {
                'x-api-key': apiKey
            },
            timeout: 10000,
        });

        console.log("returned " + response.status)

        return !(!response.status.toString().startsWith("204"));
    } catch (e) {
        return false;
    }
}

export async function saveUserUrlPreferencesSettings(apiKey: string, settings: UrlPreferences): Promise<boolean> {
    console.log("Calling saveUserUrlPreferencesSettings with key: " + apiKey)

    try {
        const response = await axios.patch(getApiUrl() + "/v1/user/get/@me/settings/url", settings, {
            headers: {
                'x-api-key': apiKey
            },
            timeout: 10000,
        });

        return !(!response.status.toString().startsWith("204"));
    } catch (e) {
        return false;
    }
}

export async function getUserUrlPreferencesSettings(apiKey: string): Promise<UrlPreferences | null> {
    console.log("Calling getUserUrlPreferencesSettings with key: " + apiKey)

    try {
        const response = await axios.get(getApiUrl() + "/v1/user/get/@me/settings/url", {
            headers: {
                'x-api-key': apiKey
            },
            timeout: 6000,
        });
        if (!response.status.toString().startsWith("2") || !response.data) return null

        const data = response.data;
        const error: boolean = data["error"];
        if (error) return null;

        return data["message"] as UrlPreferences;
    } catch (e) {
        return null;
    }
}

export async function getUserEmbedSettings(apiKey: string): Promise<EmbedSettings | null> {
    console.log("Calling getUserEmbedSettings with key: " + apiKey)

    try {
        const response = await axios.get(getApiUrl() + "/v1/user/get/@me/settings/webhook", {
            headers: {
                'x-api-key': apiKey
            },
            timeout: 6000,
        });

        if (!response.status.toString().startsWith("2") || !response.data) return null

        const data = response.data;
        const error: boolean = data["error"];
        if (error) return null;

        return data["message"] as EmbedSettings;
    } catch (e) {
        return null;
    }
}

export async function uploadImage(formData: FormData, apiKey: string,  callServer: CallServer | null, onProgress?: (progress: number) => void, onSpeedChange?: (speed: number) => void): Promise<UploadedImage | null> {

    console.log("Calling uploadImage with CS: " + callServer?.url || "DEFAULT")

    /*const data = await postApiForm('/v1/image/upload', formData, apiKey);*/

    const startTime = performance.now()
    try {
        const response = await axios.post(getApiUrl() + "/v1/image/upload", formData, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'multipart/form-data',
            },
            timeout: 0,
            onUploadProgress: (progressEvent) => {
                const { loaded, total } = progressEvent
                if (!total) return

                const percent = (loaded / total) * 100
                onProgress?.(Math.round(percent))

                const elapsedSec = (performance.now() - startTime) / 1000
                if (elapsedSec > 0) {
                    const speedBps = loaded / elapsedSec
                    const realSpeedBps = Math.round(speedBps * 100) / 100
                    const kbps = Math.round(realSpeedBps / 1024)
                    onSpeedChange?.(kbps)
                }
            },
        });

        if (!response.status.toString().startsWith("2") || !response.data) {
            return null;
        }

        await logToServer("Response data: ", response.data)
        await logToServer("Response data.message: ", response.data["message"])
        console.log("Response data: ", response.data);
        console.log("Response data.message: ", response.data["message"]);
        return response.data["message"] as UploadedImage;
    } catch (error) {
        await logToServer("Upload error: ", error)
        console.error('Upload error:', error);
        return null;
    }
}

export async function uploadImageBucket(formData: FormData, apiKey: string,  callServer: CallServer | null, onProgress?: (progress: number) => void, onSpeedChange?: (speed: number) => void): Promise<UploadedImage | null> {

    console.log("Calling uploadImageBucket");

    const file = formData.get('file') as File
    if (!file) return null
    const startTime = performance.now()

    const type = file.name.split('.').pop()?.toLowerCase() || 'png';

    const uid = generateRandomUniqueId();

    try {
        // STEP 1: Request a presigned URL from your backend
        const presignRes = await axios.post('/api/s3/upload', {
            filename: uid,
            contentType: file.type,
            formData: formData
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'filename': uid,
            },
        })

        const uploadUrl = presignRes.data.url

        console.log("Presigned URL:", uploadUrl)

        // Upload the file directly to R2 (bad idea but fast)
        await axios.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type,
            },
            onUploadProgress: (progressEvent) => {
                const { loaded, total } = progressEvent
                if (!total) return

                const percent = (loaded / total) * 100
                onProgress?.(Math.round(percent))

                const elapsedSec = (performance.now() - startTime) / 1000
                if (elapsedSec > 0) {
                    const speedBps = loaded / elapsedSec
                    const realSpeedBps = Math.round(speedBps * 100) / 100
                    const kbps = Math.round(realSpeedBps / 1024)
                    onSpeedChange?.(kbps)
                }
            },
        })

        logToServer("REGISTER TO BACKEND")

        // STEP 3 (optional): register to space-api
        const spaceFormData = new FormData();
        spaceFormData.append('uniqueId', uid);
        spaceFormData.append('fileType', type);
        spaceFormData.append('source', "PORTAL");
        spaceFormData.append('size', file.size + "");
        const response = await axios.post(getApiUrl() + "/v1/image/register", spaceFormData, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'multipart/form-data',
            },
            timeout: 0
        });

        await logToServer("Response data: ", response.data)
        console.log("Response data: ", response.data);
        return response.data["message"] as UploadedImage;

    } catch (error) {
        console.error('Upload to R2 failed:', error)
        return null
    }
}

/*export async function uploadImageBucket(formData: FormData, apiKey: string,  callServer: CallServer | null, onProgress?: (progress: number) => void, onSpeedChange?: (speed: number) => void): Promise<UploadedImage | null> {

    console.log("Calling uploadImageBucket");

    /!*const data = await postApiForm('/v1/image/upload', formData, apiKey);*!/

    let startTime: number | null = null

    try {
        const response = await axios.post('/api/s3/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${apiKey}`,
                'x-api-key': apiKey,
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (onProgress) onProgress(percent);
                }

                if (startTime === null) {
                    startTime = Date.now();
                } else {
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    const speed = progressEvent.loaded / elapsedTime;
                    if (onSpeedChange) onSpeedChange(speed);
                }
            },
        })
        return response.data as UploadedImage
    } catch (error) {
        console.error('Upload failed:', error)
        return null
    }
}*/

export async function deleteImageApi(imageId: string, apiKey: string): Promise<boolean> {
    console.log("Calling deleteImage with imageId: " + imageId)

    try {
        const response = await axios.delete(getApiUrl() + "/v1/image/get/" + imageId, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            timeout: 0,
        });
        if (!response.status.toString().startsWith("2") || !response.data) {
            return false;
        }
        const error: boolean = response.data["error"];
        if (error) {
            console.error("Error deleting image: ", response.data["message"]);
            return false;
        }
        return !error;
    }
    catch (error) {
        //console.error('Delete error:', error);
        return false;
    }
}

export async function getImageAlbum(uid: string): Promise<Album | null> {
    const data = await getValidatedResponse('/v1/image/playlist/get/' + uid);
    if (data.error) return null;
    console.log(data + " THIS IS DATA")
    return data["data"] as Album;
}

export async function pingServer(url: string): Promise<number | null> {

    const http = new XMLHttpRequest();

    const started = new Date().getTime();

    let time= null;

    http.open("GET", url, true);

    http.onreadystatechange = function () {

        console.log("test" + url)
        if (http.readyState == 4) {
            const ended = new Date().getTime();

            time = started - ended;
        }
    }

    try {
        http.send(null)
        return time;
    } catch (e) {
        return null;
    }
}

export function generateRandomUniqueId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        result += chars[idx];
    }
    return result;
}