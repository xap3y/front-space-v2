import {UrlSet} from "@/types/core";
import {UserObjShort} from "@/types/user";

export interface PasteDto {
    title: string;
    content: string;
    isPublic: boolean;
    uniqueId: string;
    uploader: UserObjShort;
    urlSet: UrlSet;
    createdAt: string;
}