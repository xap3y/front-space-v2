"use client";

import {useState} from "react";
import {FaArrowsRotate, FaSpinner} from "react-icons/fa6";
import HoverDiv from "@/components/HoverDiv";
import {responseErrorMessage} from "@/lib/apiError";
import {errorToast, okToast} from "@/lib/client";
import {getApiUrl} from "@/lib/core";
import {hasPermission} from "@/lib/permissions";
import {linkRotationResources, type LinkResourceType} from "@/lib/linkRotation";
import type {UrlSet} from "@/types/core";
import type {UserObj} from "@/types/user";

type Replacement = {uniqueId: string; urlSet?: UrlSet | null};

type RotateLinkButtonProps = {
    type: LinkResourceType;
    resourceId: string;
    user: UserObj | null;
    onRotated: (replacement: Replacement) => void;
    className?: string;
};

export default function RotateLinkButton({type, resourceId, user, onRotated, className}: RotateLinkButtonProps) {
    const [pending, setPending] = useState(false);
    const apiKey = user?.apiKey;
    if (!apiKey || !hasPermission(user, linkRotationResources[type].permission)) {
        return null;
    }

    const rotate = async () => {
        if (!window.confirm("Generate a new link? The current link will stop working immediately.")) {
            return;
        }

        setPending(true);
        try {
            const response = await fetch(`${getApiUrl()}/v1/link-rotation/${type}/${encodeURIComponent(resourceId)}`, {
                method: "POST",
                headers: {"X-API-Key": apiKey, Accept: "application/json"},
            });
            if (!response.ok) {
                throw new Error(await responseErrorMessage(response, "Could not generate a new link"));
            }
            const {message}: {message: Replacement} = await response.json();
            onRotated(message);
            okToast("New link generated");
        } catch (error) {
            errorToast(error instanceof Error ? error.message : "Could not generate a new link");
        } finally {
            setPending(false);
        }
    };

    return (
        <HoverDiv
            data-pack-action
            type="WARN"
            aria-label="Generate new link"
            title="Generate new link"
            aria-busy={pending}
            disabled={pending}
            className={`shrink-0 p-0 ${className ?? "h-[26px] w-[26px] text-xs"}`}
            icon={pending ? <FaSpinner className="animate-spin" aria-hidden="true" /> : <FaArrowsRotate aria-hidden="true" />}
            onClick={(event) => {
                event.stopPropagation();
                void rotate();
            }}
        />
    );
}
