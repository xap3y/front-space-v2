import {UserInvitor} from "@/types/user";

export interface InviteCode {
    code: string;
    used: boolean;
    createdAt: string;
    usedAt: string;
    usedBy?: UserInvitor;
    createdBy?: UserInvitor;
}