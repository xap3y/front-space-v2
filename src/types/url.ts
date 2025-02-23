import {UrlSet} from "@/types/core";
import {UserObjShort} from "@/types/user";

export interface ShortUrlDto {
    uniqueId: string;
    originalUrl: string;
    visits: number;
    maxUses: number;
    createdAt: string;
    expiresAt: string;
    urlSet: UrlSet;
    uploader: UserObjShort;
}