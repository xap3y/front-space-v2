import type {Permission} from "@/lib/permissions";

export const linkRotationResources = {
    IMAGE: {label: "Images", permission: "ROTATE_IMAGE_LINK"},
    PASTE: {label: "Pastes", permission: "ROTATE_PASTE_LINK"},
    URL: {label: "Short URLs", permission: "ROTATE_SHORT_URL"},
    FILE_PACK: {label: "File packs", permission: "ROTATE_FILE_PACK_LINK"},
} satisfies Record<string, {label: string; permission: Permission}>;

export type LinkResourceType = keyof typeof linkRotationResources;

