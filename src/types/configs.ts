//ImageWebhookSettings
export type EmbedSettings = {
    enabled: boolean;
    title: string;
    titleUrl: string;
    description: string;
    color: string;
    authorName: string;
};

export type UrlType = "PORTAL" | "SHORT" | "RAW";

export type UrlPreferences = {
    image: UrlType | null,
    paste: UrlType | null,
    url: UrlType | null,
}