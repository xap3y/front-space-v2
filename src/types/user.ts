export interface UserObj {
    uid: number;
    email: string;
    username: string;
    role: RoleType;
    avatar?: string;
    createdAt: string;
    invitor?: UserInvitor;
    socials?: UserSocials;
    apiKey: string;
    stats: {
        totalUploads: number;
        pastesCreated: number;
        urlsShortened: number;
        storageUsed: number;
    }
}

export interface TrUserObj {
    uid: number;
    ownerEmail?: string | null;
    serverIp?: string | null;
    serverName: string;
    createdAt: string;
    apiKey: string;
}

export interface UserInvitor {
    uid: number;
    username: string;
    role: RoleType;
    avatar: string;
    createdAt: string;
}

export interface UserSocials {
    website?: string | null;
    twitter?: string | null;
    github?: string | null;
    gitlab?: string | null;
    discord?: string | null;
    telegram?: string | null;
    vk?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    twitch?: string | null;
    steam?: string | null;
    reddit?: string | null;
    linkedin?: string | null;
    tiktok?: string | null;
    snapchat?: string | null;
    whatsapp?: string | null;
    soundcloud?: string | null;
    spotify?: string | null;
    threads?: string | null;
    email?: string | null;
    messenger?: string | null;
}

export interface UserObjShort {
    uid: number;
    username: string;
    role: string;
    avatar: string;
    createdAt: string;
    invitor: UserInvitor | null;
}

export type RoleType = "DELETED" | "BANNED" | "TESTER" | "GUEST" | "MODERATOR" | "USER" | "ADMIN" | "OWNER";