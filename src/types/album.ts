export type AlbumSummary = {
    uniqueId: string;
    name: string;
    description?: string | null;
    passwordProtected: boolean;
    itemCount: number;
    coverUrl?: string | null;
    coverType?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type AlbumItem = {
    uniqueId: string;
    type: string;
    description?: string | null;
    size: number;
    uploadedAt: string;
    locked: boolean;
    portalUrl: string;
    rawUrl: string;
    shortUrl?: string | null;
    posterUrl?: string | null;
};

export type AlbumView = {
    uniqueId: string;
    name: string;
    description?: string | null;
    passwordProtected: boolean;
    canEdit: boolean;
    createdAt: string;
    updatedAt: string;
    ownerName: string;
    ownerAvatar?: string | null;
    items: AlbumItem[];
};
