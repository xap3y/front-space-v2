import {CallServer, UrlSet} from "@/types/core";
import {UserObjShort} from "@/types/user";
import {ImageWebhookSettings} from "@/types/configs";


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
    webhookSettings?: ImageWebhookSettings | null;
}


export interface ImageUploadModifiers {
    description: string | null;
    password: string | null;
    customUid: string | null;
    callServer: CallServer | null;
    expiryDate: Date | null;
}