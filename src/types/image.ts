import {CallServer, UrlSet} from "@/types/core";
import {UserObjShort} from "@/types/user";


export interface UploadedImage {
    uniqueId: string;
    type: string;
    size: number;
    urlSet: UrlSet;
    uploader: UserObjShort | null;
    uploadedAt: string;
    requiresPassword: boolean;
    isPublic: boolean;
    description: string;
    expiresAt?: string;
}


export interface ImageUploadModifiers {
    description: string | null;
    password: string | null;
    customUid: string | null;
    callServer: CallServer | null;
    expiryDate: Date | null;
}