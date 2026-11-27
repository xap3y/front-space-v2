"use client";

import {useEffect, useId, useRef, useState, type ReactNode} from "react";
import {FaChevronDown, FaCopy, FaDownload, FaGlobe, FaImage, FaLink} from "react-icons/fa6";
import ResourceDeleteButton from "@/components/ResourceDeleteButton";
import {NativeButton} from "@/components/ui/NativeButton";
import Surface from "@/components/ui/Surface";
import ui from "@/components/ui/ui.module.css";
import {useTranslation} from "@/hooks/useTranslation";
import {errorToast, infoToast} from "@/lib/client";
import type {UploadedImage} from "@/types/image";

export default function ImageActions({image, password, viewerId, children}: {
    image: UploadedImage;
    password: string;
    viewerId?: number;
    children?: ReactNode;
}) {
    const lang = useTranslation();
    const [open, setOpen] = useState(false);
    const copyGroup = useRef<HTMLDivElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    const {portalUrl, rawUrl, shortUrl} = image.urlSet;
    const downloadUrl = viewerId === image.uploader?.uid && image.location === "LOCAL"
        ? `/api/images/${encodeURIComponent(image.uniqueId)}?download=true`
        : `${rawUrl}${rawUrl?.includes("?") ? "&" : "?"}download=true&password=${encodeURIComponent(password)}`;

    const options = [
        {label: "Short URL", description: "Compact link for sharing", value: shortUrl, icon: FaLink},
        {label: "Portal URL", description: "Opens this image viewer", value: portalUrl, icon: FaGlobe},
        {label: "Raw URL", description: "Direct link to the media file", value: rawUrl, icon: FaImage},
    ];

    useEffect(() => {
        const element = menu.current;
        if (!open || !element) return;

        const closeOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && !copyGroup.current?.contains(event.target)) setOpen(false);
        };
        const place = () => {
            const rect = trigger.current?.getBoundingClientRect();
            if (!rect) return;
            const roomAbove = rect.top - 8;
            const roomBelow = document.documentElement.clientHeight - rect.bottom - 8;
            element.dataset.below = String(roomAbove < element.scrollHeight && roomBelow > roomAbove);
        };

        place();
        document.addEventListener("pointerdown", closeOutside);
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            document.removeEventListener("pointerdown", closeOutside);
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open]);

    async function copy(label: string, value: string) {
        if (open) {
            setOpen(false);
            trigger.current?.focus();
        }
        try {
            await navigator.clipboard.writeText(value);
            infoToast(`${label} · ${lang.toasts.success.copied_to_clipboard}`);
        } catch {
            errorToast("Could not copy the link to the clipboard.");
        }
    }

    function copyPortal() {
        void copy("Portal URL", portalUrl || window.location.href);
    }

    return (
        <div className="mt-4 w-full min-w-0">
            <div className={`${ui.toolbar} relative justify-center`}>
                <a className={`${ui.action} ${ui.nativeButton} ${ui.button}`} href={downloadUrl} onClick={() => infoToast("Downloading image")}>
                    <FaDownload aria-hidden="true" />
                    {lang.pages.image_viewer.download_button_text}
                </a>
                <div ref={copyGroup} className="inline-flex items-center"
                    onBlur={event => {
                        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
                    }}
                    onKeyDown={event => {
                        if (event.key === "Escape" && open) {
                            event.stopPropagation();
                            setOpen(false);
                            trigger.current?.focus();
                        }
                    }}
                >
                    <NativeButton className={`${ui.button} !rounded-r-none focus-visible:relative focus-visible:z-10`} type="button" onClick={copyPortal}>
                        <FaCopy aria-hidden="true" />
                        {lang.pages.image_viewer.copy_button_text}
                    </NativeButton>
                    <NativeButton className={`${ui.button} ${ui.icon} -ml-px !rounded-l-none focus-visible:relative focus-visible:z-10`} type="button" ref={trigger}
                        aria-label="Copy link options" title="Copy link options" aria-expanded={open} aria-controls={menuId}
                        data-active={open} onClick={() => setOpen(value => !value)}>
                        <FaChevronDown className={open ? "rotate-180" : undefined} aria-hidden="true" />
                    </NativeButton>
                    <Surface ref={menu} id={menuId} hidden={!open} role="group" aria-label="Copy image link"
                        className="absolute bottom-full left-1/2 z-50 mb-1.5 w-56 max-w-[calc(100%_-_1rem)] -translate-x-1/2 overflow-y-auto border p-1 max-h-[calc(100dvh_-_3.5rem)] data-[below=true]:bottom-auto data-[below=true]:top-full data-[below=true]:mb-0 data-[below=true]:mt-1.5">
                        {options.map(({label, description, value, icon: Icon}) => (
                            <NativeButton key={label} type="button" layout="row" className="group" disabled={!value && label !== "Portal URL"}
                                onClick={() => label === "Portal URL" ? copyPortal() : void copy(label, value || "")}>
                                <span className="flex items-center gap-2 px-2.5 py-1.5">
                                    <Icon className="size-3 shrink-0 text-zinc-400 group-hover:text-zinc-100" aria-hidden="true" />
                                    <span className="min-w-0"><strong className="block font-semibold group-hover:text-zinc-50">{label}</strong><small className="block text-[11px] text-zinc-400">{description}</small></span>
                                </span>
                            </NativeButton>
                        ))}
                    </Surface>
                </div>
                {children}
                <ResourceDeleteButton kind="image" id={image.uniqueId} ownerId={image.uploader?.uid} className={ui.button} />
            </div>
        </div>
    );
}
