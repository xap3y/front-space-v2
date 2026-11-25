"use client";

import {type ReactNode, useEffect, useId} from "react";
import {FaXmark} from "react-icons/fa6";
import {Button} from "@/components/ui";

/** Modal dialog: full screen on phones, centered card from `sm` up. Escape and backdrop close it. */
export default function Dialog({open, title, onClose, footer, children, size = "md"}: {
    open: boolean;
    title: ReactNode;
    onClose: () => void;
    footer?: ReactNode;
    children: ReactNode;
    size?: "md" | "lg";
}) {
    const titleId = useId();

    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
            <div role="dialog" aria-modal="true" aria-labelledby={titleId}
                 className={`relative flex w-full flex-col overflow-hidden border-zinc-800 bg-[#0a0a0a] sm:max-h-[85vh] sm:rounded-lg sm:border ${size === "lg" ? "sm:max-w-4xl" : "sm:max-w-md"}`}>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                    <h2 id={titleId} className="text-sm font-semibold">{title}</h2>
                    <Button size="small" iconOnly aria-label="Close" icon={<FaXmark/>} onClick={onClose}/>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
                {footer && (
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 px-4 py-3">{footer}</div>
                )}
            </div>
        </div>
    );
}
