"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { getApiUrl } from "@/lib/core";
import { errorToast, infoToast, okToast } from "@/lib/client";
import {
    FaWifi,
    FaUser,
    FaUserSlash,
    FaBan,
    FaArrowRight,
    FaRotateRight,
    FaChevronRight,
    FaTrash,
} from "react-icons/fa6";
import { FaBell, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { MdOutlineComputer } from "react-icons/md";
import MainStringInput from "@/components/MainStringInput";

interface ActiveClientDto {
    wsSessionId: string;
    userAgent: string;
    ip: string;
    connectedAtMs: number;
    currentPage: string;
    userId: number | null;
    username: string | null;
    connected: boolean;
}

function formatDuration(ms: number): string {
    const secs = Math.floor((Date.now() - ms) / 1000);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
}

function formatDate(ms: number): string {
    return new Date(ms).toLocaleString();
}

function shortUA(ua: string): string {
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Opera")) return "Opera";
    return ua.slice(0, 24) + "…";
}

export default function AdminSessionsClient() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<ActiveClientDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [toastModal, setToastModal] = useState<{ wsId: string; username: string | null } | null>(null);
    const [redirectModal, setRedirectModal] = useState<{ wsId: string; username: string | null } | null>(null);
    const [toastMsg, setToastMsg] = useState("");
    const [redirectRoute, setRedirectRoute] = useState("/");
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [toastType, setToastType] = useState<"success" | "info" | "warning" | "error">("info");
    const [toastPos, setToastPos] = useState("top-right");

    const apiKey = user?.apiKey ?? "";
    const apiUrl = getApiUrl();

    const fetchSessions = useCallback(async () => {
        if (!apiKey) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/v1/admin/active-sessions`, {
                headers: { "X-API-Key": apiKey },
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSessions((data.message ?? []) as ActiveClientDto[]);
        } catch {
            errorToast("Failed to load active sessions");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, apiKey]);

    // Auto-refresh every 5 seconds + tick every second to update duration
    useEffect(() => {
        if (!apiKey) return;
        fetchSessions();
        const refresh = setInterval(fetchSessions, 5000);
        // force re-render every second so duration updates
        tickRef.current = setInterval(() => setSessions((s) => [...s]), 1000);
        return () => {
            clearInterval(refresh);
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [fetchSessions, apiKey]);

    // ESC closes modals
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setToastModal(null);
                setRedirectModal(null);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    async function doClose(wsId: string) {
        try {
            const res = await fetch(`${apiUrl}/v1/admin/active-sessions/${encodeURIComponent(wsId)}`, {
                method: "DELETE",
                headers: { "X-API-Key": apiKey },
            });
            if (!res.ok) throw new Error();
            okToast("Session closed");
            fetchSessions();
        } catch {
            errorToast("Failed to close session");
        }
    }

    async function doLogout(wsId: string) {
        try {
            const res = await fetch(`${apiUrl}/v1/admin/active-sessions/${encodeURIComponent(wsId)}/logout`, {
                method: "POST",
                headers: { "X-API-Key": apiKey },
            });
            if (!res.ok) throw new Error();
            okToast("User logged out");
            fetchSessions();
        } catch {
            errorToast("Failed to logout user");
        }
    }

    async function doSendToast() {
        if (!toastModal) return;
        try {
            const res = await fetch(`${apiUrl}/v1/admin/active-sessions/${encodeURIComponent(toastModal.wsId)}/toast`, {
                method: "POST",
                headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ message: toastMsg, type: toastType, position: toastPos }),
            });
            if (!res.ok) throw new Error();
            okToast("Toast sent!");
            setToastModal(null);
            setToastMsg("");
        } catch {
            errorToast("Failed to send toast");
        }
    }

    async function doRedirect() {
        if (!redirectModal) return;
        try {
            const res = await fetch(`${apiUrl}/v1/admin/active-sessions/${encodeURIComponent(redirectModal.wsId)}/redirect`, {
                method: "POST",
                headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ route: redirectRoute }),
            });
            if (!res.ok) throw new Error();
            okToast("Redirect sent!");
            setRedirectModal(null);
            setRedirectRoute("/");
        } catch {
            errorToast("Failed to send redirect");
        }
    }

    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
            <div className="max-w-[90rem] mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pt-5 pb-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2">
                            <FaWifi className="text-emerald-400" />
                            Active Sessions
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Live browser connections — {sessions.length} online
                        </p>
                    </div>
                    <button
                        onClick={() => fetchSessions()}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                        disabled={loading}
                    >
                        <FaRotateRight className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Sessions list */}
                <div className="flex flex-col box-primary p-3 md:p-4 gap-3">
                    {sessions.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            {loading ? "Loading…" : "No active browser sessions right now."}
                        </div>
                    ) : (
                        sessions.map((s) => (
                            <div
                                key={s.wsSessionId}
                                className="rounded-xl border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 p-3"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    {/* Left: info */}
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* User/Anon icon */}
                                        <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 ${s.userId ? "border-emerald-500/40 bg-emerald-600/10 text-emerald-300" : "border-zinc-700 bg-zinc-800 text-gray-400"}`}>
                                            {s.userId ? <FaUser className="h-4 w-4" /> : <FaUserSlash className="h-4 w-4" />}
                                        </div>

                                        <div className="min-w-0 flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-white text-sm">
                                                    {s.username ?? "Anonymous"}
                                                </span>
                                                {s.userId && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 font-semibold">
                                                        LOGGED IN
                                                    </span>
                                                )}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${s.connected ? "bg-green-600/20 text-green-300 border border-green-500/20" : "bg-red-600/20 text-red-300 border border-red-500/20"}`}>
                                                    {s.connected ? "● CONNECTED" : "● DISCONNECTED"}
                                                </span>
                                            </div>

                                            <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                <span>
                                                    <span className="text-gray-500">IP:</span>{" "}
                                                    <span className="text-gray-200">{s.ip}</span>
                                                </span>
                                                <span>
                                                    <span className="text-gray-500">Browser:</span>{" "}
                                                    <span className="text-gray-200">{shortUA(s.userAgent)}</span>
                                                </span>
                                                <span>
                                                    <span className="text-gray-500">Page:</span>{" "}
                                                    <span className="text-white font-medium">{s.currentPage}</span>
                                                </span>
                                                <span>
                                                    <span className="text-gray-500">Duration:</span>{" "}
                                                    <span className="text-white font-medium">{formatDuration(s.connectedAtMs)}</span>
                                                </span>
                                                <span>
                                                    <span className="text-gray-500">Since:</span>{" "}
                                                    <span className="text-gray-200">{formatDate(s.connectedAtMs)}</span>
                                                </span>
                                            </div>

                                            {/* Full UA on second line */}
                                            <div className="text-[10px] text-gray-600 truncate max-w-md mt-0.5" title={s.userAgent}>
                                                {s.userAgent}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                        {/* Send Toast */}
                                        <button
                                            onClick={() => setToastModal({ wsId: s.wsSessionId, username: s.username })}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-gray-200"
                                            title="Send Toast Notification"
                                        >
                                            <FaBell className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Toast</span>
                                        </button>

                                        {/* Redirect */}
                                        <button
                                            onClick={() => setRedirectModal({ wsId: s.wsSessionId, username: s.username })}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-gray-200"
                                            title="Redirect to Route"
                                        >
                                            <FaArrowRight className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Redirect</span>
                                        </button>

                                        {/* Logout */}
                                        {s.userId && (
                                            <button
                                                onClick={() => doLogout(s.wsSessionId)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-yellow-500/40 hover:border-yellow-500 hover:in-shadow bg-yellow-600/10 transition-all duration-200 text-yellow-300"
                                                title="Force Logout"
                                            >
                                                <FaSignOutAlt className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Logout</span>
                                            </button>
                                        )}

                                        {/* Close WS */}
                                        <button
                                            onClick={() => doClose(s.wsSessionId)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-600/10 transition-all duration-200 text-red-300"
                                            title="Close WS Connection"
                                        >
                                            <FaBan className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Toast Modal */}
            {toastModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setToastModal(null)}
                >
                    <div
                        className="relative w-full max-w-md mx-4 rounded-2xl border-2 border-zinc-800 bg-primary1 p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setToastModal(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all text-gray-400 hover:text-white"
                        >
                            <FaTimes className="h-3.5 w-3.5" />
                        </button>
                        <h2 className="text-base font-semibold mb-1">Send Toast</h2>
                        <p className="text-xs text-gray-400 mb-4">
                            To: <span className="text-white">{toastModal.username ?? "Anonymous"}</span>
                        </p>

                        <div className="flex flex-col gap-3 mb-4">
                            <div className="flex gap-2">
                                <select
                                    value={toastType}
                                    onChange={(e) => setToastType(e.target.value as any)}
                                    className="flex-1 rounded-lg border-2 border-zinc-800 bg-primary1 text-sm text-white px-3 py-2 focus:outline-none focus:border-zinc-700"
                                >
                                    <option value="success">Success (okToast)</option>
                                    <option value="info">Info (infoToast)</option>
                                    <option value="warning">Warning</option>
                                    <option value="error">Error (errorToast)</option>
                                </select>
                                <select
                                    value={toastPos}
                                    onChange={(e) => setToastPos(e.target.value)}
                                    className="flex-1 rounded-lg border-2 border-zinc-800 bg-primary1 text-sm text-white px-3 py-2 focus:outline-none focus:border-zinc-700"
                                >
                                    <option value="top-right">Top Right</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="bottom-center">Bottom Center</option>
                                </select>
                            </div>
                            <textarea
                                autoFocus
                                value={toastMsg}
                                onChange={(e) => setToastMsg(e.target.value)}
                                rows={3}
                                placeholder="Type your message…"
                                className="w-full rounded-lg border-2 border-zinc-800 focus:border-zinc-700 bg-primary1 text-sm text-white px-3 py-2 focus:outline-none resize-none placeholder-gray-500"
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setToastModal(null)}
                                className="px-4 py-2 text-sm rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={doSendToast}
                                disabled={!toastMsg.trim()}
                                className="px-4 py-2 text-sm rounded-lg border-2 border-emerald-600/40 hover:border-emerald-500 hover:in-shadow bg-primary1 text-emerald-300 transition-all disabled:opacity-50"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Redirect Modal */}
            {redirectModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setRedirectModal(null)}
                >
                    <div
                        className="relative w-full max-w-md mx-4 rounded-2xl border-2 border-zinc-800 bg-primary1 p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setRedirectModal(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all text-gray-400 hover:text-white"
                        >
                            <FaTimes className="h-3.5 w-3.5" />
                        </button>
                        <h2 className="text-base font-semibold mb-1">Redirect Client</h2>
                        <p className="text-xs text-gray-400 mb-4">
                            Target: <span className="text-white">{redirectModal.username ?? "Anonymous"}</span>
                        </p>
                        <MainStringInput
                            autoFocus
                            type="text"
                            value={redirectRoute}
                            onChange={setRedirectRoute}
                            placeholder="/home/gallery"
                            className="w-full rounded-lg border-zinc-800 bg-primary1"
                            inputClassName="text-sm px-3 py-2"
                        />
                        <div className="flex gap-2 justify-end mt-4">
                            <button
                                onClick={() => setRedirectModal(null)}
                                className="px-4 py-2 text-sm rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={doRedirect}
                                disabled={!redirectRoute.trim()}
                                className="px-4 py-2 text-sm rounded-lg border-2 border-blue-600/40 hover:border-blue-500 hover:in-shadow bg-primary1 text-blue-300 transition-all disabled:opacity-50"
                            >
                                Redirect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
