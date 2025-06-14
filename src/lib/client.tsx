import {toast} from "react-toastify";
import {RoleType} from "@/types/user";
import {JSX} from "react";
import {UploadedImage} from "@/types/image";
import axios from "axios";
import {getApiUrl} from "@/lib/core";
import {CallServer} from "@/types/core";
import {request} from "node:http";
import LanguageModel from "@/types/LanguageModel";

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

export async function uploadImage(formData: FormData, apiKey: string,  callServer: CallServer | null, onProgress?: (progress: number) => void): Promise<UploadedImage | null> {

    console.log("Calling uploadImage with CS: " + callServer?.url || "DEFAULT")

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