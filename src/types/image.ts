import {UrlSet} from "@/types/core";
import {UserObjShort} from "@/types/user";


export interface UploadedImage {
    uniqueId: string;
    type: string;
    size: number;
    urlSet: UrlSet;
    uploader: UserObjShort;
    uploadedAt: string;
}
