export interface DiscordAttachment {
    id: string;
    filename: string;
    size: number;
    url: string;
    safeUrl?: string | null;
    contentType?: string | null;
}

export interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface DiscordEmbed {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: string | number;
    footer?: {
        text: string;
        icon_url?: string;
    };
    image?: {
        url: string;
    };
    thumbnail?: {
        url: string;
    };
    author?: {
        name: string;
        url?: string;
        icon_url?: string;
    };
    fields?: DiscordEmbedField[];
}

export interface DiscordMessage {
    id: string;
    author: AuthorEntry;
    authorAvatar?: string;
    content: string | null;
    replyToMessageId: string | null;
    timestamp: string;
    attachments: DiscordAttachment[] | null;
    embeds: DiscordEmbed[] | null;
    stickers: StickerEntry[] | null;
    isCompact?: boolean;
}

export interface DiscordTranscript {
    generatedAt: string;
    channelName?: string;
    messages: DiscordMessage[];
}

export interface AuthorEntry {
    username: string;
    avatarUrl: string;
    color: string | null;
}

export interface StickerEntry {
    name: string;
    formatType: string;
    ext: string;
    url: string;
}

export interface DiscordConnection {
    discordId: string;
    accessToken: string;
    refreshToken: string;
    email: string;
    username: string;
    globalName: string;
    connectedAt: string;
    avatar: string;
}

export interface DiscordTokenData {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface KeyRequest {
    name: string;
    email: string | null;
    address: string | null;
    ip: string | null;
    token: string | null;
    password: string;
}