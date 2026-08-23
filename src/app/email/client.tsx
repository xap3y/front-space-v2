"use client";

// History is kept in sync via both direct refreshHistory() calls and
// the window 'storage' event (cross-tab & same-tab after patching localStorage).

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    useTempMail,
    TempMail,
    TempMailHistoryEntry,
    readHistory,
    archiveToHistory,
    removeFromHistory,
} from "@/hooks/useTempMail";
import { EmailStream } from "@/components/EmailStream";
import { infoToast, okToast } from "@/lib/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/hooks/useUser";
import { LoadingDot } from "@/components/GlobalComponents";
import "./scroll.css";
import { useIsMobile } from "@/hooks/utils";
import { MdContentCopy, MdRefresh, MdAdd } from "react-icons/md";
import { FaTriangleExclamation } from "react-icons/fa6";
import { TempMailHistoryPanel } from "@/components/TempMailHistoryPanel";

interface Props {
    maxWidth?: number;
    /**
     * isPublic=true  → guest user (no api key, Turnstile flow upstream)
     * isPublic=false → logged-in user (api key from useUser)
     */
    isPublic?: boolean;
    /**
     * When provided (e.g. guest just created via Turnstile), use this as the
     * starting mail. The user can still switch via history.
     * When null/undefined EmailPage reads from the hook (shared localStorage).
     */
    initialTempMail?: TempMail | null;
    /** Called when a guest user requests a new session (only relevant when isPublic=true) */
    onRequestNewSession?: () => void;
}

/** Returns ms until expiry, or null if no expiry. */
function msUntilExpiry(expireAt: string | null): number | null {
    if (!expireAt) return null;
    return new Date(expireAt).getTime() - Date.now();
}

export function EmailPage({ maxWidth, isPublic = false, initialTempMail = null, onRequestNewSession }: Props) {
    const { user, loadingUser } = useUser();
    const [apiKey, setApiKey] = useState("");
    const [creating, setCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyEntries, setHistoryEntries] = useState<TempMailHistoryEntry[]>([]);
    const [wsForceRefreshId, setWsForceRefreshId] = useState(0);

    // When guest reopens a history entry we switch to that mail (overrides initialTempMail)
    const [overrideMail, setOverrideMail] = useState<TempMail | null>(null);

    const {
        tempMail: hookTempMail,
        createTempMail,
        refetchTempMailInfo,
        loadFromLocalStorage,
        setExistingTempMail,
        reopenTempMail,
    } = useTempMail();

    const isMobile = useIsMobile();
    const lang = useTranslation();

    // ── effective mail ────────────────────────────────────────────────────────
    // Priority: override (from reopen) > hook state (from localStorage load / create) > initialTempMail prop
    const tempMail: TempMail | null = overrideMail || hookTempMail || initialTempMail;

    // A counter we bump to force a history re-read even when localStorage content
    // was changed in the same tab (storage event only fires cross-tab).
    const [historyTick, setHistoryTick] = useState(0);

    // ── refresh history ───────────────────────────────────────────────────────
    const refreshHistory = useCallback(() => {
        const h = readHistory();
        // Always exclude whichever mail is currently active
        const activeMail = overrideMail || hookTempMail || initialTempMail;
        setHistoryEntries(activeMail ? h.filter(e => e.email !== activeMail.email) : h);
        setHistoryTick(t => t + 1);
    }, [overrideMail, hookTempMail, initialTempMail]);

    // ── init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPublic && user) {
            setApiKey(user.apiKey);
            loadFromLocalStorage().then(() => refreshHistory());
        }
        // For public users, just read history once on mount
        if (isPublic) {
            refreshHistory();
        }
    }, [user?.uid, isPublic]); // eslint-disable-line react-hooks/exhaustive-deps

    // Refresh history whenever the active mail changes
    useEffect(() => {
        refreshHistory();
    }, [overrideMail, hookTempMail, initialTempMail]); // eslint-disable-line react-hooks/exhaustive-deps

    // Also refresh when another tab/context writes to localStorage (e.g., admin page suspends)
    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key === 'tempMailHistory_v2' || e.key === 'lastTempMail') {
                refreshHistory();
            }
        }
        // Custom event for same-tab updates (writeHistory dispatches this)
        function onHistoryChanged() {
            refreshHistory();
        }
        window.addEventListener('storage', onStorage);
        window.addEventListener('tempmail-history-changed', onHistoryChanged);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('tempmail-history-changed', onHistoryChanged);
        };
    }, [refreshHistory]);

    // ── actions ───────────────────────────────────────────────────────────────

    async function handleCreate() {
        setError(null);
        setCreating(true);
        try {
            const data = await createTempMail(apiKey);
            if (data) {
                setOverrideMail(null); // let hookTempMail take over
                refreshHistory();
            }
        } catch (e: any) {
            setError(e?.message || "Failed to create.");
        } finally {
            setCreating(false);
        }
    }

    function handleReset() {
        setIsDeleting(true);
        setTimeout(() => {
            handleCreate().then(() => {
                setIsDeleting(false);
            });
        }, 200);
    }

    function handleRefresh() {
        if (!tempMail) return;
        if (isRefreshing) return;
        setIsRefreshing(true);
        refetchTempMailInfo(tempMail.email)
            .then((updated) => {
                infoToast("Refreshed");
                setIsRefreshing(false);
                setWsForceRefreshId((v) => v + 1);
                if (updated) {
                    // If status changed (e.g. SUSPENDED), update our local state too
                    if (overrideMail) setOverrideMail(updated);
                    refreshHistory();
                }
            })
            .catch(() => setIsRefreshing(false));
    }

    function handleCopy() {
        navigator.clipboard.writeText(tempMail?.email || "");
        okToast(lang.toasts.success.copied_to_clipboard);
    }

    async function handleReopen(entry: TempMailHistoryEntry) {
        const restored = await reopenTempMail(entry);
        if (restored) {
            setOverrideMail(restored);
            refreshHistory();
            setWsForceRefreshId((v) => v + 1);
            okToast("Session restored");
        }
    }

    function handleDeleteHistory(email: string) {
        removeFromHistory(email);
        refreshHistory();
    }

    // ── derived state ─────────────────────────────────────────────────────────
    if (loadingUser && !isPublic) return <></>;

    const MAX_WIDTH = maxWidth ?? 1920;
    const isExpired = tempMail?.expireAt ? new Date(tempMail.expireAt) < new Date() : false;
    const isSuspended = tempMail?.status === "SUSPENDED";
    const timeLeft = tempMail ? msUntilExpiry(tempMail.expireAt) : null;
    const warnExpiry = timeLeft !== null && timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000;

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div
            className="w-full xl:h-auto bg-card box-primary shadow-xl flex flex-col gap-6"
            style={{ maxWidth: MAX_WIDTH }}
        >
            <div className="p-4 sm:p-6">
                {/* Title row */}
                <div className="flex items-center justify-between mb-1">
                    <h1 className="text-3xl tracking-tight select-none font-bold">Temp Mail</h1>

                    {/* History button — always shown once there's any history */}
                    {historyEntries.length > 0 && (
                        <TempMailHistoryPanel
                            history={historyEntries}
                            activeMail={tempMail}
                            onReopen={handleReopen}
                            onDelete={handleDeleteHistory}
                        />
                    )}
                </div>

                {isMobile && (
                    <div className="flex items-center justify-center my-4 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <hr
                                key={i}
                                className="w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"
                            />
                        ))}
                    </div>
                )}

                {/* Active mail */}
                {tempMail && (
                    <div className="space-y-5 mt-3">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            {/* Address + expiry */}
                            <div className="space-y-2 w-full">
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className={`font-mono text-xl xl:text-2xl font-bold leading-tight ${
                                            isSuspended ? "text-red-600 line-through" : "text-white"
                                        } break-all select-all`}
                                    >
                                        {tempMail.email}
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        disabled={isRefreshing || isDeleting}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                                        title="Copy email address"
                                    >
                                        <MdContentCopy className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Expiry row */}
                                <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                    Expires:&nbsp;
                                    <span
                                        className={
                                            isExpired
                                                ? "text-red-500"
                                                : warnExpiry
                                                ? "text-yellow-400"
                                                : "text-gray-400"
                                        }
                                    >
                                        {tempMail.expireAt
                                            ? new Date(tempMail.expireAt).toLocaleString()
                                            : "never"}
                                    </span>
                                    {warnExpiry && !isExpired && (
                                        <span className="relative group cursor-default">
                                            <FaTriangleExclamation className="w-3 h-3 text-yellow-400" />
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-yellow-300 font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                Expires in 24 hours or less
                                            </span>
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 flex-wrap xl:justify-end">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isDeleting || isExpired}
                                    title={isExpired ? "Email is expired, create new one!" : "Reconnect to receive new emails"}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium transition-all duration-200 text-gray-200 ${
                                        isExpired ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                >
                                    <MdRefresh className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                                    Reconnect
                                </button>

                                {/* New address: logged-in users use handleReset; guests call parent to show Turnstile again */}
                                {!isPublic ? (
                                    <button
                                        disabled={isRefreshing || isDeleting}
                                        onClick={handleReset}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium transition-all duration-200 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MdAdd className={`w-4 h-4 ${isDeleting ? "animate-spin" : ""}`} />
                                        New Address
                                    </button>
                                ) : onRequestNewSession && (
                                    <button
                                        onClick={() => {
                                            // Archive current mail to history before going back to creation form
                                            if (tempMail) archiveToHistory(tempMail);
                                            onRequestNewSession();
                                        }}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium transition-all duration-200 text-gray-200"
                                    >
                                        <MdAdd className="w-4 h-4" />
                                        New Address
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Create button for logged-in user with no mail */}
                {!tempMail && !isPublic && (
                    <div className="mt-4 space-y-4">
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        <button
                            onClick={handleCreate}
                            disabled={!apiKey || creating}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-emerald-600/40 hover:border-emerald-500 hover:in-shadow bg-primary1 text-sm font-semibold text-emerald-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? (
                                <>
                                    <LoadingDot size="w-4" />
                                    Creating...
                                </>
                            ) : (
                                "Create Temp Email"
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Inbox */}
            {tempMail && (
                <EmailStream
                    email={tempMail}
                    apiKey={apiKey}
                    forceId={wsForceRefreshId}
                    disconnectBo={isRefreshing}
                    isExpired={isExpired}
                    refetchCallback={handleRefresh}
                />
            )}
        </div>
    );
}