"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {NativeDeleteButton} from "@/components/ui/NativeButton";
import {useUser} from "@/hooks/useUser";
import {hasPermission, type Permission} from "@/lib/permissions";
import {getApiUrl} from "@/lib/core";
import {errorToast, okToast} from "@/lib/client";

const resources = {
    image: {permission: "DELETE_IMAGES", endpoint: "/v1/image/get/", destination: "/home/gallery"},
    paste: {permission: "DELETE_PASTES", endpoint: "/v1/paste/get/", destination: "/home/pastes"},
    pack: {permission: "DELETE_FILE_PACKS", endpoint: "/v1/files/pack/public/", destination: "/home/files"},
} satisfies Record<string, {permission: Permission; endpoint: string; destination: string}>;

type Props = {
    kind: keyof typeof resources;
    id: string;
    ownerId?: number;
    canDelete?: boolean;
    className?: string;
};

export default function ResourceDeleteButton({kind, id, ownerId, canDelete = false, className}: Props) {
    const {user} = useUser();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const resource = resources[kind];
    const allowed = !!user && (canDelete || ownerId === user.uid || hasPermission(user, resource.permission));

    if (!allowed) {
        return null;
    }

    const remove = async () => {
        if (!window.confirm(`Delete this ${kind === "pack" ? "file pack and all its files" : kind}?`)) {
            return;
        }
        setBusy(true);
        try {
            const response = await fetch(getApiUrl() + resource.endpoint + encodeURIComponent(id), {
                method: "DELETE",
                credentials: "include",
            });
            const body = await response.json();
            if (!response.ok || body.error) {
                throw new Error(body.message || "Failed to delete resource");
            }
            okToast("Deleted successfully");
            router.replace(resource.destination);
            router.refresh();
        } catch (error) {
            errorToast(error instanceof Error ? error.message : "Failed to delete resource");
        } finally {
            setBusy(false);
        }
    };

    return (
        <NativeDeleteButton
            type="button"
            className={className ?? "px-3 py-1.5 text-xs"}
            disabled={busy}
            onClick={remove}
        >
            {busy ? "Deleting…" : "Delete"}
        </NativeDeleteButton>
    );
}
