import {UserObjShort} from "@/types/user";


export type AuditLog = {
    id: number;
    user: UserObjShort;
    type: AuditLogType;
    description: string;
    source: string;
    time: string;
};

export type AuditLogType =
    "USER_LOGIN" |
    "USER_LOGOUT" |
    "USER_REGISTER" |
    "USER_UPDATE_PROFILE" |
    "USER_SETTINGS_CHANGE" |
    "USER_DELETE_ACCOUNT" |
    "INVITE_CODE_CREATE" |
    "INVITE_CODE_USE" |
    "PASSWORD_RESET_REQUEST" |
    "PASSWORD_RESET_COMPLETE" |
    "IMAGE_UPLOAD" |
    "IMAGE_DELETE" |
    "PASTE_CREATE" |
    "PASTE_DELETE" |
    "URL_CREATE" |
    "URL_DELETE" |
    "EMAIL_CREATE" |
    "EMAIL_DELETE" |
    "EMAIL_RECEIVE"