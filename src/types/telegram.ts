import {UserObjShort} from "@/types/user";

export type TelegramConnection = {
    created_at?: string;
    telegram_id: string;
    username: string;
    full_name: string;
    avatar?: string;
    user: UserObjShort;
};