import type { UserObj } from "@/types/user";

export interface AdminPackFile {
    uniqueId: string;
    fileName: string;
    fileType: string;
    size: number;
    description?: string | null;
    uploadTime?: string | null;
    expirationTime?: string | null;
}

export interface AdminFilePack {
    packId: string;
    description?: string | null;
    isComplete: boolean;
    totalFiles: number;
    totalSize: number;
    uploadTime: string;
    isPasswordProtected: boolean;
    source: string;
    uploader?: UserObj | null;
    files: AdminPackFile[];
}
