import type {UserObj} from "@/types/user";

export const PERMISSIONS = [
    {key: "BYPASS_IMAGE_PASSWORD", label: "Bypass image passwords"},
    {key: "BYPASS_FILE_PACK_PASSWORD", label: "Bypass file pack passwords"},
    {key: "FILE_PACK_VIEW_IP", label: "Show pack viewer IP addresses in My Files"},
    {key: "FILE_PACK_VIEW_UA", label: "Show pack viewer user agents in My Files"},
    {key: "DELETE_IMAGES", label: "Delete other users' images"},
    {key: "DELETE_PASTES", label: "Delete other users' pastes"},
    {key: "DELETE_FILE_PACKS", label: "Delete other users' file packs"},
    {key: "ADMIN_ACCESS", label: "Admin access — master switch"},
    {key: "ADMIN_OVERVIEW", label: "Overview", path: "/admin"},
    {key: "ADMIN_USERS", label: "Users", path: "/admin/users"},
    {key: "ADMIN_LIMITS", label: "Limits", path: "/admin/limits"},
    {key: "ADMIN_INVITES", label: "Invites", path: "/admin/invites"},
    {key: "ADMIN_SYSTEM", label: "System", path: "/admin/system"},
    {key: "ADMIN_SETTINGS", label: "Settings", path: "/admin/settings"},
    {key: "ADMIN_LOGS", label: "Logs", path: "/admin/logs"},
    {key: "ADMIN_IMAGES", label: "Images", path: "/admin/images"},
    {key: "ADMIN_PASTES", label: "Pastes", path: "/admin/pastes"},
    {key: "ADMIN_FILES", label: "File packs", path: "/admin/files"},
    {key: "ADMIN_URLS", label: "URLs", path: "/admin/urls"},
    {key: "ADMIN_EMAILS", label: "Emails", path: "/admin/emails"},
    {key: "ADMIN_MC_REPORTS", label: "MC reports", path: "/admin/mc-reports"},
    {key: "ADMIN_ACTIVE_SESSIONS", label: "Active sessions", path: "/admin/sessions"},
] as const;

export type Permission = typeof PERMISSIONS[number]["key"];
export type PermissionOverrides = Partial<Record<Permission, boolean>>;

export function hasPermission(user: UserObj | null | undefined, permission: Permission): boolean {
    if (!user || user.role === "BANNED" || user.role === "DELETED") {
        return false;
    }
    if (user.role === "OWNER") {
        return true;
    }
    const permissions = user.permissions ?? [];
    const adminSection = permission.startsWith("ADMIN_") && permission !== "ADMIN_ACCESS";
    return permissions.includes(permission) && (!adminSection || permissions.includes("ADMIN_ACCESS"));
}

export function canAccessAdminPath(user: UserObj | null | undefined, pathname: string): boolean {
    if (pathname === "/admin/permissions" || pathname.startsWith("/admin/permissions/")) {
        return user?.role === "OWNER";
    }
    const section = PERMISSIONS.find(permission => "path" in permission && (
        pathname === permission.path
        || (permission.path !== "/admin" && pathname.startsWith(permission.path + "/"))
    ));
    return !!section && hasPermission(user, section.key);
}

export function firstAdminPath(user: UserObj | null | undefined): string | null {
    const section = PERMISSIONS.find(permission => "path" in permission && hasPermission(user, permission.key));
    return section && "path" in section ? section.path : null;
}
