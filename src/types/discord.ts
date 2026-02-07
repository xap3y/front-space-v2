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

export type AttachmentEntry = {
    filename: string;
    url: string;
    size: number;
};

export type EmbedFieldEntry = {
    name: string;
    value: string;
    inline: boolean;
};

export type EmbedEntry = {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: string;
    author?: string;
    footer?: string;
    fields?: EmbedFieldEntry[];
};

export type MessageEntry = {
    id: string;
    channelId: string;
    timestamp: string;
    author: string;
    content: string;
    attachments?: AttachmentEntry[];
    embeds?: EmbedEntry[];
};

export type DiscordTranscript = {
    generatedAt: string;
    messages: MessageEntry[];
};
