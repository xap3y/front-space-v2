export interface UserObj {
    uid: number;
    email: string;
    username: string;
    role: string;
    avatar?: string | null;
    createdAt: string;
    invitor?: UserInvitor | null;
    socials?: UserSocials | null;
    apiKey: string;
}

export interface UserInvitor {
    uid: number;
    username: string;
    role: string;
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