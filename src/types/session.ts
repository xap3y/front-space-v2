import { UserObjShort } from "@/types/user";

export interface SessionDto {
    id: number;
    user?: UserObjShort;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string;
    isValid: boolean;
    userAgent: string;
    ipAddress: string;
    isCurrent: boolean;
}
