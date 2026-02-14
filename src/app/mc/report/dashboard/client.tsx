"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import { useTrUser } from "@/hooks/useTrUser";
import { errorToast, getDiscordTranscriptsClient, infoToast } from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import HoverDiv from "@/components/HoverDiv";

type TranscriptItem = {
    uniqueId: string;
    channelName: string;
    createdAt: string;
    createdBy: string | null;
    target: string | null;
    closeComment: string | null;
};

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function dateMs(iso?: string | null) {
    if (!iso) return -Infinity;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? -Infinity : t;
}

export default function TranscriptsDashboardClient() {
    const { user, loadingUser } = useTrUser();
    const router = useRouter();

    const [loading, setLoading] = useState(true);

    // API key reveal state
    const [showKey, setShowKey] = useState(false);

    // transcripts
    const [transcriptsLoading, setTranscriptsLoading] = useState(false);
    const [transcriptsError, setTranscriptsError] = useState<string>("");
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

    // small list controls
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user && !loadingUser) {
            router.push("/mc/report/login");
        } else if (!loadingUser && user) {
            setLoading(false);
        }
    }, [user, loadingUser, router]);

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        async function load() {
            // Important: always end loading state, even if apiKey missing
            setTranscriptsLoading(true);
            setTranscriptsError("");

            try {
                if (!user?.apiKey) {
                    if (!cancelled) setTranscripts([]);
                    return;
                }

                const res = await getDiscordTranscriptsClient(user.apiKey);

                if (res == null || res.error) {
                    errorToast(res?.message ?? "Failed to load transcripts");
                    return;
                }
                if (!Array.isArray(res.message)) {
                    errorToast(res?.message ?? "Failed to load transcripts");
                    return;
                }

                if (!cancelled) setTranscripts(res.message as TranscriptItem[]);
            } catch (e: any) {
                if (!cancelled) setTranscriptsError(e?.message ?? "Failed to load transcripts");
            } finally {
                if (!cancelled) setTranscriptsLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [user]);

    // Sort newest -> oldest first, then apply search filter
    const filteredTranscripts = useMemo(() => {
        const sorted = [...transcripts].sort((a, b) => dateMs(b.createdAt) - dateMs(a.createdAt));

        const q = search.trim().toLowerCase();
        if (!q) return sorted;

        return sorted.filter((t) => {
            const hay = [
                t.uniqueId,
                t.channelName,
                t.createdBy ?? "",
                t.target ?? "",
                t.closeComment ?? "",
            ]
                .join(" ")
                .toLowerCase();
            return hay.includes(q);
        });
    }, [transcripts, search]);

    if (loadingUser || !user || loading) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col gap-4 sm:p-5 p-0">
            {/* Server/user card */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            You can see your closed reports transcripts here.
                        </p>
                    </div>

                    <div className={"flex gap-3"}>
                        <HoverDiv
                            onClick={() => {
                                const func = async () => {
                                    await fetch("/api/auth/logout-tr", { method: "POST", credentials: "include" });
                                };
                                func().then(() => {
                                    router.push("/mc/report/login");
                                });
                            }}
                            className="px-4 py-2 text-sm"
                        >
                            Log out
                        </HoverDiv>

                        <HoverDiv onClick={() => router.refresh()} className="px-4 py-2 text-sm">
                            Refresh
                        </HoverDiv>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-xs text-gray-400">Username / Server name</div>
                        <div className="text-base text-white font-semibold mt-1 break-words">
                            {user.serverName ?? "—"}
                        </div>

                        <div className="text-xs text-gray-400 mt-3">Email</div>
                        <div className="text-sm text-gray-100 break-words">{user.ownerEmail ?? "—"}</div>

                        <div className="text-xs text-gray-400 mt-3">Created</div>
                        <div className="text-sm text-gray-100">{formatDate(user.createdAt)}</div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-xs text-gray-400">API Key</div>

                        <div className="mt-2 flex items-center gap-2">
                            <code
                                className={`flex-1 break-all rounded-md bg-black/30 px-3 py-2 text-xs text-white ${
                                    showKey ? "" : "blur-sm select-none"
                                }`}
                            >
                                {user.apiKey ?? "—"}
                            </code>

                            <HoverDiv
                                className="px-3 py-2 transition"
                                onClick={() => setShowKey((v) => !v)}
                                title={showKey ? "Hide key" : "Show key"}
                            >
                                {showKey ? <FaEyeSlash /> : <FaEye />}
                            </HoverDiv>

                            <HoverDiv
                                className="px-3 py-2 rounded-md text-xs font-bold transition disabled:opacity-50"
                                disabled={!user.apiKey}
                                onClick={async () => {
                                    try {
                                        if (!user.apiKey) return;
                                        await navigator.clipboard.writeText(user.apiKey);
                                        infoToast("Copied");
                                    } catch {
                                        errorToast("Failed to copy");
                                    }
                                }}
                            >
                                Copy
                            </HoverDiv>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transcripts */}
            <div className="box-primary p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className={"flex gap-5 items-center"}>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Closed transcripts</h2>
                            <p className="text-sm text-gray-300 mt-1">
                                {transcriptsLoading
                                    ? "Loading..."
                                    : `Showing ${filteredTranscripts.length} transcript(s)`}
                            </p>
                        </div>

                        <MainStringInput
                            className="min-w-80 !p-2.5"
                            inputClassName={"!p-0"}
                            type="text"
                            placeholder="Search uniqueId / channel / comment..."
                            value={search}
                            onChange={(v) => setSearch(v)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <HoverDiv
                            onClick={() => {
                                router.refresh();
                            }}
                            className="px-4 py-2 text-sm h-full"
                        >
                            Refresh list
                        </HoverDiv>
                    </div>
                </div>

                {transcriptsError ? (
                    <div className="mt-4 text-sm text-red-300 border border-red-500/20 bg-red-600/10 rounded-lg p-3">
                        {transcriptsError}
                    </div>
                ) : null}

                {/* Make only this inner area scrollable */}
                <div className="mt-4">
                    <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
                        {filteredTranscripts.map((t) => (
                            <div
                                key={t.uniqueId}
                                className="rounded-xl box-primary p-3 shadow-sm shadow-black/30"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-white font-semibold break-words">
                                            {t.channelName}{" "}
                                            <span className="text-gray-400 font-normal">({t.uniqueId})</span>
                                        </div>

                                        <div className="mt-1 text-xs text-gray-400 flex flex-wrap gap-2">
                                            <span>Created: {formatDate(t.createdAt)}</span>
                                            <span className="text-gray-500">•</span>
                                            <span>
                        Created by: <span className="text-gray-200">{t.createdBy ?? "—"}</span>
                      </span>
                                            <span className="text-gray-500">•</span>
                                            <span>
                        Target: <span className="text-gray-200">{t.target ?? "—"}</span>
                      </span>
                                        </div>

                                        {t.closeComment ? (
                                            <div className="mt-2 text-sm text-gray-200 break-words">
                                                <span className="text-gray-400">Close comment:</span> {t.closeComment}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <HoverDiv
                                            className="px-4 py-2 text-sm flex items-center gap-2"
                                            onClick={() => {
                                                window.open(`/mc/report/${t.uniqueId}`, "_blank");
                                            }}
                                            title="View transcript"
                                        >
                                            <FaEye className={"text-xl"} />
                                            View
                                        </HoverDiv>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!transcriptsLoading && filteredTranscripts.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">No transcripts found.</div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}