export type VIPPackage = {
    name: string;
    displayName: string;
    priority: number;
    duration: number; // seconds
    createdAt: number | string;
    group: string; // luckperms group
};

export type ActiveVIP = {
    playerName: string;
    playerUniqueId: string; // UUID (no dashes)
    packageName: string;
    duration: number; // seconds (0 => permanent)
    activatedAt: string; // epoch seconds or "0"
};

export type Code = {
    type: "VIP" | "KIT" | string;
    code: string;
    identifier: string; // VIP package name or kit identifier
    used: boolean;
    usedBy: string | number; // player ID or "0"
    usedAt: string; // "N/A" or timestamp string
    generatedAt?: string | null;
    createdAt?: string | null;
    duration: number;
    email: string;
    uniqueId?: string; // may exist for server-side deletes
};

export type ApiPayload = {
    error?: boolean;
    message?: {
        version?: string;
        uniqueId?: string;
        vipPackages?: VIPPackage[];
        activePackages?: ActiveVIP[];
        codes?: Code[]; // NOTE: initial API will NOT include codes per spec
    };
    timestamp?: string;
    count?: number;
};

export type WsEnvelope =
    | { type: "CODE"; data: Code }
    | { type: "VIP"; data: VIPPackage }
    | { type: "ACTIVE_VIP"; data: ActiveVIP }
    | { type: "DELETE"; data: { type: "CODE" | "VIP" | "ACTIVE_VIP"; uniqueId: string } }
    | { type: "ERROR"; data: { message: string, type: string } };