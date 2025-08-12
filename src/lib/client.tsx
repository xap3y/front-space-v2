import {toast} from "react-toastify";
import {RoleType} from "@/types/user";
import {JSX} from "react";
import {UploadedImage} from "@/types/image";
import axios from "axios";
import {getApiUrl, getCurlHeaders, getValidatedResponse} from "@/lib/core";
import {CallServer} from "@/types/core";
import LanguageModel from "@/types/LanguageModel";
import {Album} from "@/types/album";
import {logToServer} from "@/lib/serverFuncs";

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

export const copyToClipboard = (text: string, lang: LanguageModel, delay: number = 500) => {
    navigator.clipboard.writeText(text);
    toast.success(lang.toasts.success.copied_to_clipboard, {
        autoClose: delay,
        closeOnClick: true,
    });
};

export const debugLog = (text: string, text2?: any) => {
    if (process.env.NODE_ENV === "development") {
        (text2) ? console.debug("[D] " + text) : console.debug("[D] " + text + " => " + text2);
    } else { // TODO: remove this in production
        console.log(text);
    }
}

export const getUserRoleBadge: (role: RoleType) => JSX.Element = (role: RoleType) => {
    switch (role) {
        case "OWNER":
            return <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
                    owner
                </span>
        case "ADMIN":
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                    admin
                </span>
        case "MODERATOR":
            return <span className="bg-blue-500 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    moderator
                </span>
        case "USER":
            return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    user
                </span>
        case "GUEST":
            return <span className="bg-primary-darker text-white text-xs font-medium px-2.5 py-0.5 rounded">
                    guest
                </span>
        case "BANNED":
            return <span className="bg-red-600 text-gray-800 text-xs px-2.5 py-0.5 rounded font-parkinsans font-bold">
                    BANNED
                </span>
        case "DELETED":
            return <span className="bg-red-600 text-gray-800 text-xs px-2.5 py-0.5 rounded font-parkinsans font-bold">
                    DELETED
                </span>
        case "TESTER":
            return <span className={"flex gap-3"}>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        tester
                    </span>

                    <span
                        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                        admin
                    </span>
                </span>
        default:
            return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    user
                </span>
    }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
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
        return true;
    } catch (error) {
        return false;
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