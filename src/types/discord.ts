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