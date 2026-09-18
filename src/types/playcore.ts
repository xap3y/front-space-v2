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

export type PausedVIP = {
    id: number;
    uuid: string;
    playerName: string;
    packageUi: string;
    activatedAt: number;
    pausedAt: number;
    group: string;
    displayName: string;
    priority: number;
    duration: number;
    packageDuration: number;
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

export type KitEnchantment = { first: string; second: number } | [string, number];

export type KitItem = {
    item: string;
    amount: number;
    displayName: string;
    lore?: string[] | null;
    itemFlags?: string[] | null;
    enchantments?: KitEnchantment[] | null;
    hexString?: string | null;
    customModelData?: number | null;
    bannerPatterns?: string[] | null;
    leatherColor?: number | null;
    potionType?: string | null;
    skullOwner?: string | null;
    storedEnchants?: Record<string, number> | null;
};

export type Kit = {
    name: string;
    displayName: string;
    icon: string;
    createdAt?: number | string | null;
    flags?: {
        redeemTimes?: number | null;
        allowedServers?: string[] | null;
        commands?: string[] | null;
    } | null;
    content: KitItem[];
};

export type ApiPayload = {
    error?: boolean;
    message?: {
        version?: string;
        uniqueId?: string;
        vipPackages?: VIPPackage[];
        activePackages?: ActiveVIP[];
        pausedPackages?: PausedVIP[];
        codes?: Code[]; // NOTE: initial API will NOT include codes per spec
        kits?: Kit[];
    };
    timestamp?: string;
    count?: number;
};

export type WsEnvelope =
    | { type: "CODE"; data: Code }
    | { type: "VIP"; data: VIPPackage }
    | { type: "ACTIVE_VIP"; data: ActiveVIP }
    | { type: "PAUSED_PACKAGE"; data: PausedVIP }
    | { type: "GROUPS"; data: string[] }
    | { type: "KIT"; data: Kit }
    | { type: "DELETE"; data: { type: "CODE" | "VIP" | "ACTIVE_VIP" | "PAUSED_VIP" | "KIT"; uniqueId: string } }
    | { type: "ERROR"; data: { message: string, type: string } };
