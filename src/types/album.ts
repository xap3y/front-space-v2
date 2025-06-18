import {UserObjShort} from "@/types/user";

export type Uploader = {
    id: number;
    username: string;
};

export type ImageItem = {
    uniqueId: string;
    type: string;
    description?: string;
    size: number;
    uploadedAt: string;
    urlSet: {
        webUrl: string;
        portalUrl: string;
        rawUrl: string;
        shortUrl: string;
        customUrl?: string | null;
    };
    uploader: Uploader;
};

export type Album = {
    id: number;
    uniqueId: string;
    description?: string;
    createdAt: string;
    owner: UserObjShort;
    images: ImageItem[];
};