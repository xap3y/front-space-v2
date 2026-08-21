export type AnalyticsDailyPoint = {
    date: string;
    images: number;
    pastes: number;
    urls: number;
    tempMails: number;
    storageAddedBytes: number;
    storageBytes: number;
};

export type AnalyticsCategory = {
    label: string;
    count: number;
    bytes?: number;
};

export type UserAnalytics = {
    from: string;
    to: string;
    daily: AnalyticsDailyPoint[];
    summary: {
        images: number;
        pastes: number;
        urls: number;
        tempMails: number;
        storageAddedBytes: number;
        storageBytes: number;
        urlVisits: number;
    };
    fileTypes: AnalyticsCategory[];
    storageLocations: AnalyticsCategory[];
    visibility: AnalyticsCategory[];
    pasteLanguages: AnalyticsCategory[];
    mailStatuses: AnalyticsCategory[];
};
