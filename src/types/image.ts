import {CallServer, UrlSet} from "@/types/core";
import {UserObjShort} from "@/types/user";
import {EmbedSettings} from "@/types/configs";


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
    location: string;
    webhookSettings?: EmbedSettings | null;
}

export interface UploadedImagePage {
    uniqueId: string;
    type: string;
    size: number;
    uploadedAt: string;
    requiresPassword: boolean;
    hasPoster: boolean;
    location: "LOCAL" | "R2" | "S3";
    urls: UrlSet;
    public: boolean;
    description?: string;
}

export interface ImageListResponse {
    images: UploadedImagePage[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}



export interface ImageUploadModifiers {
    description: string | null;
    password: string | null;
    customUid: string | null;
    callServer: CallServer | null;
    expiryDate: Date | null;
}