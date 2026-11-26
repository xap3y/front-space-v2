"use client";

import HoverDiv from "@/components/HoverDiv";
import Surface from "@/components/ui/Surface";
import { NativeButton, NativeDeleteButton } from "@/components/ui/NativeButton";
import { useEffect, useId, useRef, useState } from "react";
import type { TempMailHistoryEntry } from "@/hooks/useTempMail";
import { MdHistory, MdClose, MdDeleteOutline, MdRestoreFromTrash } from "react-icons/md";
import { FaBan } from "react-icons/fa";
import { FaCircleExclamation } from "react-icons/fa6";

interface Props {
    history: TempMailHistoryEntry[];
    onReopen: (entry: TempMailHistoryEntry) => void;
    onDelete: (email: string) => void;
}

function isExpiredEntry(entry: TempMailHistoryEntry): boolean {
    if (!entry.expireAt) return false;
    return new Date(entry.expireAt) < new Date();
}

function EntryStatusIcon({ entry }: { entry: TempMailHistoryEntry }) {
    if (entry.status === "DELETED") {
        return <MdDeleteOutline className="w-3.5 h-3.5 text-red-500 shrink-0" title="Deleted" />;
    }
    if (entry.status === "SUSPENDED") {
        return <FaBan className="w-3 h-3 text-orange-400 shrink-0" title="Suspended" />;
    }
    if (isExpiredEntry(entry)) {
        return <FaCircleExclamation className="w-3 h-3 text-gray-500 shrink-0" title="Expired" />;
    }
    return <span className="w-3 h-3 shrink-0 rounded-full bg-emerald-500/60 inline-block" title="Active" />;
}

export function TempMailHistoryPanel({ history, onReopen, onDelete }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const panelId = useId();

    useEffect(() => {
        if (!open) return;
        function onPointerDown(event: PointerEvent) {
            if (event.target instanceof Node && !ref.current?.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open]);

    const count = history.length;

    return (
        <div
            ref={ref}
            className="shrink-0"
            onKeyDown={(event) => {
                if (event.key === "Escape" && open) {
                    setOpen(false);
                    triggerRef.current?.focus();
                }
            }}
        >
            <HoverDiv
                ref={triggerRef}
                type="INFO"
                icon={<MdHistory aria-hidden="true" />}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => setOpen(current => !current)}
                className="min-h-7 select-none whitespace-nowrap px-2.5 py-1 text-xs aria-expanded:border-zinc-600"
                title="Temp mail session history"
            >
                History
                {count > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-800 px-1 text-[10px] font-bold leading-none text-zinc-200">
                        {count > 9 ? "9+" : count}
                    </span>
                )}
            </HoverDiv>

            {/* Dropdown panel */}
            {open && (
                <Surface
                    id={panelId}
                    role="region"
                    aria-label="Previous temp mail sessions"
                    className="absolute right-0 top-full z-20 mt-2 w-80 max-w-full overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 bg-primary2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 select-none">
                            Previous Sessions ({count})
                        </span>
                        <NativeButton
                            aria-label="Close history"
                            onClick={() => {
                                setOpen(false);
                                triggerRef.current?.focus();
                            }}
                            className="text-gray-500 hover:text-gray-200 transition-colors p-0.5 rounded"
                        >
                            <MdClose className="w-3.5 h-3.5" />
                        </NativeButton>
                    </div>

                    {/* List */}
                    <div className="max-h-[min(18rem,55dvh)] divide-y divide-zinc-800/60 overflow-y-auto">
                        {count === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500 select-none">
                                No previous sessions yet.
                            </div>
                        ) : (
                            history.map(entry => {
                                const deleted = entry.status === "DELETED";
                                const suspended = entry.status === "SUSPENDED";
                                const expired = isExpiredEntry(entry);
                                const inactive = deleted || suspended || expired;

                                return (
                                    <div
                                        key={entry.email}
                                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                                    >
                                        {/* Status dot/icon */}
                                        <EntryStatusIcon entry={entry} />

                                        {/* Email + timestamp */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-[11px] font-mono truncate ${
                                                    deleted
                                                        ? "text-red-500 line-through"
                                                        : inactive
                                                        ? "text-gray-500"
                                                        : "text-gray-300"
                                                }`}
                                                title={entry.email}
                                            >
                                                {entry.email}
                                            </p>
                                            <p className="text-[10px] text-gray-600 mt-0.5">
                                                {new Date(entry.savedAt).toLocaleString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                                {suspended && <span className="ml-1 text-orange-400">· suspended</span>}
                                                {deleted && <span className="ml-1 text-red-400">· deleted</span>}
                                                {expired && !deleted && !suspended && <span className="ml-1 text-gray-500">· expired</span>}
                                            </p>
                                        </div>

                                        {/* Actions — always visible (not hover-only, for mobile) */}
                                        <div className="flex gap-1 shrink-0">
                                            <NativeButton
                                                onClick={() => { onReopen(entry); setOpen(false); }}
                                                className="p-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-600 hover:in-shadow bg-primary1 text-gray-400 hover:text-gray-100 transition-all duration-150"
                                                title="Reopen session"
                                            >
                                                <MdRestoreFromTrash className="w-3.5 h-3.5" />
                                            </NativeButton>
                                            <NativeDeleteButton
                                                onClick={() => { onDelete(entry.email); }}
                                                className="p-1.5 rounded-lg border-2 border-red-500/30 hover:border-red-500 hover:in-shadow bg-red-600/10 text-red-400 hover:text-red-300 transition-all duration-150"
                                                title="Remove from history"
                                            >

                                            </NativeDeleteButton>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Surface>
            )}
        </div>
    );
}
