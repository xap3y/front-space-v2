"use client";

import React, { useEffect, useRef } from "react";

function clsx(...arr: Array<string | false | null | undefined>) {
    return arr.filter(Boolean).join(" ");
}

export function SlideOver({
                              title,
                              open,
                              onClose,
                              onSave,
                              saveLabel = "Save",
                              saveDisabled,
                              children,
                              widthClass = "w-full sm:w-[480px]",
                          }: {
    title: React.ReactNode;
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
    saveLabel?: string;
    saveDisabled?: boolean;
    children: React.ReactNode;
    widthClass?: string;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    // Focus the panel when opened so Enter works immediately
    useEffect(() => {
        if (open) {
            // small timeout to ensure it's mounted
            const t = setTimeout(() => {
                panelRef.current?.focus();
            }, 10);
            return () => clearTimeout(t);
        }
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && onSave && !saveDisabled) {
            e.preventDefault();
            e.stopPropagation();
            onSave();
        }
    };

    return (
        <div
            className={clsx(
                "fixed inset-0 z-[100]",
                open ? "pointer-events-auto" : "pointer-events-none"
            )}
            aria-hidden={!open}
        >
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={clsx(
                    "absolute inset-0 bg-black/50 transition-opacity",
                    open ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                className={clsx(
                    "absolute right-0 top-0 h-full bg-zinc-950 border-l border-zinc-800 shadow-xl flex flex-col outline-none",
                    "transition-transform duration-300",
                    open ? "translate-x-0" : "translate-x-full",
                    widthClass
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <div className="text-sm font-semibold truncate">{title}</div>
                    <button
                        onClick={onClose}
                        className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                        Close
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">{children}</div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
                    <button
                        onClick={onClose}
                        className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
                    >
                        Cancel
                    </button>
                    {onSave && (
                        <button
                            onClick={onSave}
                            disabled={saveDisabled}
                            className={clsx(
                                "rounded border px-3 py-1.5 text-sm",
                                saveDisabled
                                    ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                                    : "border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
                            )}
                            title="Press Enter to save"
                        >
                            {saveLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}