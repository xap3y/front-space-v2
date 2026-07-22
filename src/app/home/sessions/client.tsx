"use client";

import { usePage } from "@/context/PageContext";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { getUserSessions } from "@/lib/apiGetters";
import { SessionDto } from "@/types/session";
import { errorToast, okToast, infoToast } from "@/lib/client";
import { getApiUrl } from "@/lib/core";
import { 
    FaWindows, 
    FaApple, 
    FaLinux, 
    FaAndroid, 
    FaMobileAlt,
    FaChrome, 
    FaFirefox, 
    FaSafari, 
    FaEdge, 
    FaOpera, 
    FaGlobe, 
    FaLaptop,
    FaTrash,
    FaTimes,
    FaHistory
} from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";

function parseUserAgent(ua: string) {
    const uaLower = ua.toLowerCase();
    
    // Detect OS
    let osName = "Unknown OS";
    let osIcon = null;
    if (uaLower.includes("windows")) {
        osName = "Windows";
        osIcon = "windows";
    } else if (uaLower.includes("macintosh") || uaLower.includes("mac os") || uaLower.includes("mac_powerpc")) {
        osName = "macOS";
        osIcon = "apple";
    } else if (uaLower.includes("android")) {
        osName = "Android";
        osIcon = "android";
    } else if (uaLower.includes("iphone") || uaLower.includes("ipad") || uaLower.includes("ipod")) {
        osName = "iOS Device";
        osIcon = "ios";
    } else if (uaLower.includes("linux")) {
        osName = "Linux";
        osIcon = "linux";
    }
    
    // Detect Browser
    let browserName = "Unknown Browser";
    let browserIcon = "globe";
    
    if (uaLower.includes("opr/") || uaLower.includes("opera")) {
        browserName = "Opera";
        browserIcon = "opera";
    } else if (uaLower.includes("edg/")) {
        browserName = "Edge";
        browserIcon = "edge";
    } else if (uaLower.includes("chrome") || uaLower.includes("crios")) {
        browserName = "Chrome";
        browserIcon = "chrome";
    } else if (uaLower.includes("firefox") || uaLower.includes("fxios")) {
        browserName = "Firefox";
        browserIcon = "firefox";
    } else if (uaLower.includes("safari")) {
        browserName = "Safari";
        browserIcon = "safari";
    }
    
    return { osName, osIcon, browserName, browserIcon };
}

function getOsIcon(iconStr: string | null) {
    switch (iconStr) {
        case "windows": return <FaWindows className="w-5 h-5 text-sky-400" title="Windows" />;
        case "apple": return <FaApple className="w-5 h-5 text-gray-300" title="macOS" />;
        case "android": return <FaAndroid className="w-5 h-5 text-green-400" title="Android" />;
        case "ios": return <FaMobileAlt className="w-5 h-5 text-gray-200" title="iOS Device" />;
        case "linux": return <FaLinux className="w-5 h-5 text-orange-400" title="Linux" />;
        default: return <FaLaptop className="w-5 h-5 text-gray-400" title="Unknown OS" />;
    }
}

function getBrowserIcon(iconStr: string) {
    switch (iconStr) {
        case "chrome": return <FaChrome className="w-5 h-5 text-amber-500" title="Chrome" />;
        case "firefox": return <FaFirefox className="w-5 h-5 text-orange-500" title="Firefox" />;
        case "safari": return <FaSafari className="w-5 h-5 text-blue-400" title="Safari" />;
        case "edge": return <FaEdge className="w-5 h-5 text-blue-500" title="Edge" />;
        case "opera": return <FaOpera className="w-5 h-5 text-red-500" title="Opera" />;
        default: return <FaGlobe className="w-5 h-5 text-teal-400" title="Unknown Browser" />;
    }
}

export default function HomeSessionsPage() {
    const { setPage } = usePage();
    const { user, loadingUser } = useUser();
    const router = useRouter();

    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedSession, setSelectedSession] = useState<SessionDto | null>(null);
    const [revoking, setRevoking] = useState(false);

    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError("");
        try {
            const res = await getUserSessions(user.apiKey);
            if (res.error) {
                setError(res.message || "Failed to load sessions");
                setSessions([]);
            } else {
                setSessions(res.message || []);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to fetch sessions");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user, fetchSessions]);

    useEffect(() => {
        if (!loadingUser && !user) {
            router.push("/login?after=/home/sessions");
        }
    }, [user, loadingUser, router]);

    useEffect(() => {
        setPage("sessions");
    }, [setPage]);

    const handleRevoke = async () => {
        if (!selectedSession || !user) return;
        setRevoking(true);
        try {
            const response = await fetch(`${getApiUrl()}/v1/auth/me/sessions/${selectedSession.id}`, {
                method: "DELETE",
                headers: {
                    "X-API-Key": user.apiKey,
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                credentials: "include"
            });
            const resData = await response.json();
            if (resData.error) {
                errorToast(resData.message || "Failed to revoke session");
            } else {
                okToast("Session revoked successfully!");
                if (selectedSession.isCurrent) {
                    // Logging out
                    router.push("/logout");
                } else {
                    setSelectedSession(null);
                    fetchSessions();
                }
            }
        } catch (err: any) {
            errorToast(err?.message || "Revocation failed");
        } finally {
            setRevoking(false);
        }
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return "Never";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString();
    };

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selectedSession) {
                setSelectedSession(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedSession]);

    if (loadingUser) return null;

    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
            <div className="max-w-[80rem] mx-auto w-full space-y-4 pt-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Active Sessions</h1>
                        <p className="text-sm text-gray-400">View and manage devices currently logged into your account</p>
                    </div>
                    <button
                        onClick={() => fetchSessions()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-xs font-semibold text-gray-200"
                        disabled={loading}
                    >
                        <FaRotateRight className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>

                {error && (
                    <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
                        {error}
                    </div>
                )}

                {/* Session list */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {loading && sessions.length === 0 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-xl border-2 border-zinc-800 bg-primary1 p-4 animate-pulse space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-white/5" />
                                    <div className="space-y-1.5 flex-1">
                                        <div className="h-3.5 bg-white/10 rounded w-1/3" />
                                        <div className="h-3 bg-white/5 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-10 bg-white/5 rounded" />
                            </div>
                        ))
                    ) : sessions.length === 0 ? (
                        <div className="col-span-full box-primary p-8 text-center text-sm text-gray-400">
                            No active sessions found.
                        </div>
                    ) : (
                        sessions.map((s) => {
                            const { osName, osIcon, browserName, browserIcon } = parseUserAgent(s.userAgent);
                            return (
                                <div 
                                    key={s.id} 
                                    className={`rounded-xl p-4 relative flex flex-col justify-between gap-4 border-2 transition-all duration-200 bg-primary1 ${
                                        s.isCurrent 
                                            ? "border-emerald-500/40 bg-emerald-500/[0.02]" 
                                            : "border-zinc-800 hover:border-zinc-700 hover:in-shadow"
                                    }`}
                                >
                                    {/* OS & Browser Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Combined OS/Browser Badge */}
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1">
                                                {getOsIcon(osIcon)}
                                                <span className="text-[10px] text-gray-600">|</span>
                                                {getBrowserIcon(browserIcon)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                                                    <span>{osName}</span>
                                                    <span className="text-gray-600 font-normal">·</span>
                                                    <span className="text-gray-300 font-normal text-xs">{browserName}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">{s.ipAddress}</p>
                                            </div>
                                        </div>

                                        {s.isCurrent && (
                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                                                Current
                                            </span>
                                        )}
                                    </div>

                                    {/* Session Details */}
                                    <div className="text-[11px] space-y-1.5 border-t border-white/5 pt-3 flex-1 flex flex-col justify-end">
                                        <div className="flex justify-between text-gray-500">
                                            <span>First Sign In:</span>
                                            <span className="text-gray-300">{formatDate(s.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Last Request:</span>
                                            <span className="text-gray-300">{formatDate(s.lastUsedAt || s.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Expires:</span>
                                            <span className="text-gray-300">{formatDate(s.expiresAt)}</span>
                                        </div>
                                        <div className="pt-2 text-[10px] text-gray-600 font-mono truncate hover:text-gray-400 cursor-help" title={s.userAgent}>
                                            UA: {s.userAgent}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="pt-1">
                                        <button
                                            onClick={() => setSelectedSession(s)}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 border-2 ${
                                                s.isCurrent
                                                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/40 hover:border-red-500 hover:in-shadow"
                                                    : "border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300"
                                            }`}
                                        >
                                            <FaTrash className="h-3 w-3" />
                                            <span>{s.isCurrent ? "Revoke & Log Out" : "Revoke Session"}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Revoke Confirmation Modal */}
            {selectedSession && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in cursor-pointer"
                    onClick={() => setSelectedSession(null)}
                >
                    <div 
                        className="w-full max-w-md bg-primary1 border-2 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                            <div>
                                <h2 className="text-base font-semibold text-white">Revoke Session?</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Please confirm this action</p>
                            </div>
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
                                disabled={revoking}
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <p className="text-xs text-gray-300 leading-relaxed">
                                {selectedSession.isCurrent ? (
                                    <strong className="text-red-400">Warning: This is your current session. Revoking it will log you out from this browser immediately.</strong>
                                ) : (
                                    "Revoking this session will force the user/device to log in again on their next request."
                                )}
                            </p>

                            <div className="p-3 rounded-lg bg-primary3/40 border border-white/5 text-[11px] space-y-1 text-gray-400">
                                <div>IP Address: <span className="text-white font-mono">{selectedSession.ipAddress}</span></div>
                                <div className="truncate">User Agent: <span className="text-white font-mono">{selectedSession.userAgent}</span></div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setSelectedSession(null)}
                                    className="px-4 py-2 rounded-lg text-sm border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-400 hover:text-white transition-all duration-200"
                                    disabled={revoking}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevoke}
                                    className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 border-2 border-red-500/40 disabled:opacity-50 text-white font-medium transition-all duration-200"
                                    disabled={revoking}
                                >
                                    {revoking ? "Revoking…" : "Yes, Revoke"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
