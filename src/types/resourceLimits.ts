export type ResourceLimitType = "TOTAL" | "IMAGE" | "FILE" | "PASTE" | "URL" | "TEMP_MAIL";

export type LimitRule = {
    dailyCount: number | null;
    weeklyCount: number | null;
    dailyBytes: number | null;
    weeklyBytes: number | null;
};

export type LimitPolicy = Partial<Record<ResourceLimitType, LimitRule>>;

export type RoleLimitPolicy = {
    role: string;
    limits: LimitPolicy;
};

export type UsageValues = {
    dailyCount: number;
    weeklyCount: number;
    dailyBytes: number;
    weeklyBytes: number;
};

export type UserLimitPolicy = {
    uid: number;
    username: string;
    role: string;
    overrides: LimitPolicy;
    effective: LimitPolicy;
    usage: Partial<Record<ResourceLimitType, UsageValues>>;
    paused: boolean;
    pausedIndefinitely: boolean;
    pausedUntil: string | null;
};
