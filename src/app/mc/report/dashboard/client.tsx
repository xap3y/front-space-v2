"use client";

// @ts-ignore embed-visualizer does not ship complete React type declarations.
import { EmbedVisualizer } from "embed-visualizer";
import "embed-visualizer/dist/index.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MainStringInput from "@/components/MainStringInput";
import {
    FiActivity,
    FiArchive,
    FiCheckCircle,
    FiClock,
    FiCode,
    FiExternalLink,
    FiFile,
    FiFileText,
    FiLogOut,
    FiMessageSquare,
    FiRefreshCw,
    FiSave,
    FiSearch,
    FiSend,
    FiServer,
    FiSettings,
    FiShield,
    FiTrash2,
    FiUser,
    FiX,
    FiZap,
} from "react-icons/fi";
import LoadingPage from "@/components/LoadingPage";
import { useTrUser } from "@/hooks/useTrUser";
import { errorToast, getDiscordTranscriptsClient, okToast } from "@/lib/client";
import { getApiUrl } from "@/lib/core";
import { hexToInt } from "@/lib/clientFuncs";
import type { DiscordEmbed } from "@/types/discord";

type PortalTab = "reports" | "transcripts" | "configuration";
type ReportState = "OPEN" | "CLOSED" | "DELETED";

type ReportItem = {
    id: number;
    createdBy: number;
    createdByName: string | null;
    target: number;
    targetName: string | null;
    reason: string;
    state: ReportState;
    closeReason: string | null;
    closedBy: number | null;
    closedByDiscord: number | null;
    closedByName: string | null;
    discordChannelId: number | null;
    createdAt: string | null;
    closedAt: string | null;
};

type PortalAttachment = {
    id: string;
    filename: string;
    size: number;
    url: string;
    contentType: string | null;
};

type PortalMessage = {
    id: string;
    content: string;
    timestamp: string;
    author: { username: string; avatarUrl: string | null; bot: boolean };
    attachments: PortalAttachment[];
    embeds: DiscordEmbed[];
};

type TranscriptItem = {
    uniqueId: string;
    channelName: string;
    createdAt: string;
    createdBy: string | null;
    target: string | null;
    closeComment: string | null;
};

type PendingRequest = {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
};

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const value = new Date(iso);
    if (Number.isNaN(value.getTime())) return iso;
    return value.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function dateMs(iso?: string | null) {
    if (!iso) return -Infinity;
    const value = new Date(iso).getTime();
    return Number.isNaN(value) ? -Infinity : value;
}

function timeOnly(iso?: string | null) {
    if (!iso) return "";
    const value = new Date(iso);
    return Number.isNaN(value.getTime()) ? "" : value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function humanSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function makeSocketUrl() {
    const url = new URL(getApiUrl());
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/mc-reports";
    url.search = "";
    url.searchParams.set("role", "client");
    return url.toString();
}

function upsertReport(items: ReportItem[], report: ReportItem) {
    const exists = items.some((item) => item.id === report.id);
    const next = exists ? items.map((item) => (item.id === report.id ? report : item)) : [report, ...items];
    return next.sort((a, b) => dateMs(b.createdAt) - dateMs(a.createdAt));
}

const actionButton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export default function ReportsDashboardClient() {
    const { user, loadingUser } = useTrUser();
    const router = useRouter();
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef(new Map<string, PendingRequest>());
    const selectedReportIdRef = useRef<number | null>(null);
    const messageEndRef = useRef<HTMLDivElement | null>(null);

    const [tab, setTab] = useState<PortalTab>("reports");
    const [webConnected, setWebConnected] = useState(false);
    const [pluginOnline, setPluginOnline] = useState(false);
    const [serverName, setServerName] = useState("");
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reportSearch, setReportSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
    const [messages, setMessages] = useState<PortalMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [comment, setComment] = useState("");
    const [commentSending, setCommentSending] = useState(false);
    const [decision, setDecision] = useState<"close" | "delete" | null>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [decisionLoading, setDecisionLoading] = useState(false);

    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const [transcriptsLoading, setTranscriptsLoading] = useState(true);
    const [transcriptSearch, setTranscriptSearch] = useState("");

    const [configYaml, setConfigYaml] = useState("");
    const [savedConfigYaml, setSavedConfigYaml] = useState("");
    const [configLoading, setConfigLoading] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);
    const [configReloading, setConfigReloading] = useState(false);

    const requestWithSocket = useCallback((socket: WebSocket, action: string, data: Record<string, unknown> = {}) => {
        return new Promise<any>((resolve, reject) => {
            if (socket.readyState !== WebSocket.OPEN) {
                reject(new Error("Live report server is not connected"));
                return;
            }
            const requestId = crypto.randomUUID();
            const timeout = setTimeout(() => {
                pendingRef.current.delete(requestId);
                reject(new Error("The report server did not respond in time"));
            }, 20_000);
            pendingRef.current.set(requestId, { resolve, reject, timeout });
            socket.send(JSON.stringify({ type: "command", requestId, action, data }));
        });
    }, []);

    const sendCommand = useCallback((action: string, data: Record<string, unknown> = {}) => {
        const socket = socketRef.current;
        if (!socket) return Promise.reject(new Error("Live report server is offline"));
        return requestWithSocket(socket, action, data);
    }, [requestWithSocket]);

    const refreshReports = useCallback(async () => {
        setReportsLoading(true);
        try {
            const data = await sendCommand("list_reports");
            setReports(Array.isArray(data?.reports) ? data.reports : []);
        } catch (error: any) {
            errorToast(error?.message ?? "Could not load reports", 2500);
        } finally {
            setReportsLoading(false);
        }
    }, [sendCommand]);

    const loadConfig = useCallback(async () => {
        setConfigLoading(true);
        try {
            const data = await sendCommand("get_config");
            const yaml = typeof data?.yaml === "string" ? data.yaml : "";
            setConfigYaml(yaml);
            setSavedConfigYaml(yaml);
        } catch (error: any) {
            errorToast(error?.message ?? "Could not load configuration", 2500);
        } finally {
            setConfigLoading(false);
        }
    }, [sendCommand]);

    const loadTranscripts = useCallback(async () => {
        if (!user?.apiKey) return;
        setTranscriptsLoading(true);
        try {
            const response = await getDiscordTranscriptsClient(user.apiKey);
            if (response == null || response.error || !Array.isArray(response.message)) {
                throw new Error(response?.message ?? "Could not load transcripts");
            }
            setTranscripts(response.message as TranscriptItem[]);
        } catch (error: any) {
            errorToast(error?.message ?? "Could not load transcripts", 2500);
        } finally {
            setTranscriptsLoading(false);
        }
    }, [user?.apiKey]);

    useEffect(() => {
        if (!loadingUser && !user) router.replace("/mc/report/login");
    }, [loadingUser, router, user]);

    useEffect(() => {
        if (!user?.apiKey) return;
        let disposed = false;

        const rejectPending = (message: string) => {
            pendingRef.current.forEach((pending) => {
                clearTimeout(pending.timeout);
                pending.reject(new Error(message));
            });
            pendingRef.current.clear();
        };

        const connect = () => {
            if (disposed) return;
            const socket = new WebSocket(makeSocketUrl());
            socketRef.current = socket;

            socket.onopen = () => {
                if (disposed) return;
                setWebConnected(true);
                requestWithSocket(socket, "list_reports")
                    .then((data) => setReports(Array.isArray(data?.reports) ? data.reports : []))
                    .catch(() => undefined)
                    .finally(() => setReportsLoading(false));
            };

            socket.onmessage = (event) => {
                let payload: any;
                try {
                    payload = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (payload.type === "response" && payload.requestId) {
                    const pending = pendingRef.current.get(payload.requestId);
                    if (!pending) return;
                    clearTimeout(pending.timeout);
                    pendingRef.current.delete(payload.requestId);
                    if (payload.success) pending.resolve(payload.data);
                    else pending.reject(new Error(payload.error || "Report command failed"));
                    return;
                }

                if (payload.type === "connection_status") {
                    const isOnline = Boolean(payload.pluginOnline);
                    setPluginOnline(isOnline);
                    if (payload.serverName) setServerName(payload.serverName);
                    if (isOnline) {
                        setReportsLoading(true);
                        requestWithSocket(socket, "list_reports")
                            .then((data) => setReports(Array.isArray(data?.reports) ? data.reports : []))
                            .catch((error) => errorToast(error?.message ?? "Could not synchronize reports", 2500))
                            .finally(() => setReportsLoading(false));
                    }
                    return;
                }

                if (payload.type === "event" && payload.event === "report_updated" && payload.data?.report) {
                    const updated = payload.data.report as ReportItem;
                    setReports((current) => upsertReport(current, updated));
                    if (selectedReportIdRef.current === updated.id) setSelectedReport(updated);
                    return;
                }

                if (payload.type === "event" && payload.event === "discord_message" && payload.data?.message) {
                    if (selectedReportIdRef.current !== Number(payload.data.reportId)) return;
                    const incoming = payload.data.message as PortalMessage;
                    setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
                }
            };

            socket.onclose = () => {
                if (socketRef.current === socket) socketRef.current = null;
                setWebConnected(false);
                setPluginOnline(false);
                rejectPending("Live report connection was interrupted");
                if (!disposed) reconnectRef.current = setTimeout(connect, 3000);
            };

            socket.onerror = () => socket.close();
        };

        connect();
        loadTranscripts();
        return () => {
            disposed = true;
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            reconnectRef.current = null;
            rejectPending("Live report page was closed");
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [loadTranscripts, requestWithSocket, user?.apiKey]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    const openReports = useMemo(() => reports.filter((report) => report.state === "OPEN"), [reports]);
    const filteredReports = useMemo(() => {
        const query = reportSearch.trim().toLowerCase();
        if (!query) return openReports;
        return openReports.filter((report) => [report.id, report.createdByName, report.targetName, report.reason]
            .join(" ").toLowerCase().includes(query));
    }, [openReports, reportSearch]);

    const filteredTranscripts = useMemo(() => {
        const sorted = [...transcripts].sort((a, b) => dateMs(b.createdAt) - dateMs(a.createdAt));
        const query = transcriptSearch.trim().toLowerCase();
        if (!query) return sorted;
        return sorted.filter((transcript) => [transcript.uniqueId, transcript.channelName, transcript.createdBy,
            transcript.target, transcript.closeComment].join(" ").toLowerCase().includes(query));
    }, [transcriptSearch, transcripts]);

    const selectReport = async (report: ReportItem) => {
        selectedReportIdRef.current = report.id;
        setSelectedReport(report);
        setMessages([]);
        setMessagesLoading(true);
        try {
            const data = await sendCommand("get_report", { reportId: report.id });
            if (selectedReportIdRef.current !== report.id) return;
            setSelectedReport(data.report as ReportItem);
            setMessages(Array.isArray(data.messages) ? data.messages : []);
        } catch (error: any) {
            errorToast(error?.message ?? "Could not load Discord messages", 2500);
        } finally {
            if (selectedReportIdRef.current === report.id) setMessagesLoading(false);
        }
    };

    const submitComment = async () => {
        if (!selectedReport || !comment.trim()) return;
        setCommentSending(true);
        try {
            await sendCommand("comment", { reportId: selectedReport.id, content: comment.trim() });
            setComment("");
            okToast("Comment sent to Discord");
        } catch (error: any) {
            errorToast(error?.message ?? "Could not send comment", 2500);
        } finally {
            setCommentSending(false);
        }
    };

    const submitDecision = async () => {
        if (!selectedReport || !decision || !decisionReason.trim()) return;
        setDecisionLoading(true);
        try {
            const data = await sendCommand(decision === "delete" ? "delete_report" : "close_report", {
                reportId: selectedReport.id,
                reason: decisionReason.trim(),
            });
            if (data?.report) {
                const updated = data.report as ReportItem;
                setReports((current) => upsertReport(current, updated));
                setSelectedReport(updated);
            }
            okToast(decision === "delete" ? "Report deleted" : "Report closed");
            setDecision(null);
            setDecisionReason("");
        } catch (error: any) {
            errorToast(error?.message ?? "Could not update report", 3000);
        } finally {
            setDecisionLoading(false);
        }
    };

    const saveConfig = async () => {
        setConfigSaving(true);
        try {
            const data = await sendCommand("save_config", { yaml: configYaml });
            const yaml = typeof data?.yaml === "string" ? data.yaml : configYaml;
            setConfigYaml(yaml);
            setSavedConfigYaml(yaml);
            okToast("Configuration saved");
        } catch (error: any) {
            errorToast(error?.message ?? "Configuration could not be saved", 3500);
        } finally {
            setConfigSaving(false);
        }
    };

    const reloadConfig = async () => {
        setConfigReloading(true);
        try {
            const data = await sendCommand("reload_config");
            if (typeof data?.yaml === "string") {
                setConfigYaml(data.yaml);
                setSavedConfigYaml(data.yaml);
            }
            okToast("Plugin configuration reloaded");
        } catch (error: any) {
            errorToast(error?.message ?? "Plugin could not reload configuration", 3500);
        } finally {
            setConfigReloading(false);
        }
    };

    const logout = async () => {
        await fetch("/api/auth/logout-tr", { method: "POST", credentials: "include" });
        router.replace("/mc/report/login");
    };

    if (loadingUser || !user) return <LoadingPage />;

    const configDirty = configYaml !== savedConfigYaml;
    const displayServerName = serverName || user.serverName || "Report server";

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.08),transparent_25%)] px-3 py-4 text-zinc-100 sm:px-5 lg:px-7">
            <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-5">
                <header className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
                    <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300 shadow-inner shadow-indigo-500/10">
                                <FiShield className="text-2xl" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">{displayServerName}</h1>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${pluginOnline ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-amber-400/25 bg-amber-400/10 text-amber-300"}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${pluginOnline ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.9)]" : "bg-amber-300"}`} />
                                        {pluginOnline ? "Plugin live" : webConnected ? "Plugin offline" : "Connecting"}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-zinc-400">Live report operations, Discord activity and server configuration.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button className={actionButton} onClick={refreshReports} disabled={!pluginOnline || reportsLoading}>
                                <FiRefreshCw className={reportsLoading ? "animate-spin" : ""} /> Refresh
                            </button>
                            <button className={actionButton} onClick={logout}><FiLogOut /> Log out</button>
                        </div>
                    </div>

                    <div className="grid border-t border-white/[0.07] sm:grid-cols-3">
                        <Stat icon={<FiActivity />} label="Open reports" value={openReports.length} accent="text-emerald-300" />
                        <Stat icon={<FiArchive />} label="Resolved records" value={reports.filter((report) => report.state !== "OPEN").length} accent="text-indigo-300" />
                        <Stat icon={<FiFileText />} label="Saved transcripts" value={transcripts.length} accent="text-sky-300" />
                    </div>
                </header>

                <nav className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/65 p-1.5 backdrop-blur-xl sm:w-fit">
                    <TabButton active={tab === "reports"} icon={<FiZap />} onClick={() => setTab("reports")}>Live reports</TabButton>
                    <TabButton active={tab === "transcripts"} icon={<FiArchive />} onClick={() => setTab("transcripts")}>Transcripts</TabButton>
                    <TabButton active={tab === "configuration"} icon={<FiSettings />} onClick={() => {
                        setTab("configuration");
                        if (!configYaml && pluginOnline) loadConfig();
                    }}>Configuration</TabButton>
                </nav>

                {tab === "reports" && (
                    <section className="grid min-h-[680px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/20 backdrop-blur-xl lg:grid-cols-[390px_minmax(0,1fr)]">
                        <aside className="flex min-h-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
                            <div className="border-b border-white/[0.07] p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-white">Open queue</h2>
                                        <p className="text-xs text-zinc-500">Updates appear without refreshing</p>
                                    </div>
                                    <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-300">{filteredReports.length}</span>
                                </div>
                                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-zinc-500 focus-within:border-indigo-400/40 focus-within:text-indigo-300">
                                    <FiSearch />
                                    <MainStringInput type="search" className="min-w-0 flex-1 border-0 bg-transparent" inputClassName="p-0 text-sm placeholder:text-zinc-600" value={reportSearch} onChange={setReportSearch} placeholder="Player, reason or ID" />
                                </label>
                            </div>
                            <div className="max-h-[680px] flex-1 space-y-2 overflow-y-auto p-2.5">
                                {reportsLoading && <QueueSkeleton />}
                                {!reportsLoading && filteredReports.map((report) => (
                                    <button key={report.id} onClick={() => selectReport(report)} className={`group w-full rounded-xl border p-3.5 text-left transition ${selectedReport?.id === report.id ? "border-indigo-400/35 bg-indigo-500/10 shadow-lg shadow-indigo-950/20" : "border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.055]"}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                                    <span className="text-zinc-500">#{report.id}</span>
                                                    <span className="truncate">{report.targetName || `Player ${report.target}`}</span>
                                                </div>
                                                <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-zinc-400">{report.reason}</p>
                                            </div>
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.65)]" />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                                            <span className="flex min-w-0 items-center gap-1.5"><FiUser /><span className="truncate">{report.createdByName || "Unknown"}</span></span>
                                            <span className="flex shrink-0 items-center gap-1.5"><FiClock /> {formatDate(report.createdAt)}</span>
                                        </div>
                                    </button>
                                ))}
                                {!reportsLoading && filteredReports.length === 0 && (
                                    <div className="grid min-h-64 place-items-center px-5 text-center">
                                        <div><FiCheckCircle className="mx-auto text-3xl text-emerald-400/70" /><p className="mt-3 font-medium text-zinc-300">Queue is clear</p><p className="mt-1 text-sm text-zinc-500">New reports will appear here live.</p></div>
                                    </div>
                                )}
                            </div>
                        </aside>

                        <div className="min-w-0">
                            {!selectedReport ? (
                                <div className="grid h-full min-h-[620px] place-items-center p-8 text-center">
                                    <div className="max-w-sm">
                                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-2xl text-zinc-500"><FiMessageSquare /></div>
                                        <h2 className="mt-5 text-lg font-semibold text-white">Choose a report</h2>
                                        <p className="mt-2 text-sm leading-6 text-zinc-500">Open a report to inspect its Discord conversation, reply to staff, or resolve it from the portal.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[680px] flex-col">
                                    <div className="border-b border-white/[0.07] px-4 py-4 sm:px-6">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-medium text-indigo-300">Report #{selectedReport.id}</span>
                                                    <StatePill state={selectedReport.state} />
                                                </div>
                                                <h2 className="mt-1 truncate text-xl font-semibold text-white">{selectedReport.createdByName || "Unknown"} <span className="font-normal text-zinc-600">reported</span> {selectedReport.targetName || "Unknown"}</h2>
                                                <p className="mt-1 text-sm text-zinc-400">{selectedReport.reason}</p>
                                            </div>
                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <button className={actionButton} disabled={selectedReport.state !== "OPEN" || !pluginOnline} onClick={() => setDecision("close")}><FiCheckCircle /> Close</button>
                                                <button className={`${actionButton} !border-red-400/20 !bg-red-500/[0.07] !text-red-300 hover:!bg-red-500/[0.13]`} disabled={selectedReport.state !== "OPEN" || !pluginOnline} onClick={() => setDecision("delete")}><FiTrash2 /> Delete</button>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedReport.state !== "OPEN" && (
                                        <div className="flex items-start gap-3 border-b border-amber-400/15 bg-amber-400/[0.06] px-5 py-3 text-sm text-amber-100">
                                            <FiActivity className="mt-0.5 shrink-0 text-amber-300" />
                                            <div><span className="font-semibold">This report was {selectedReport.state.toLowerCase()} live.</span>{selectedReport.closeReason ? ` Reason: ${selectedReport.closeReason}` : ""}</div>
                                        </div>
                                    )}

                                    <div className="min-h-0 flex-1 overflow-y-auto bg-black/10 px-3 py-5 sm:px-6">
                                        {messagesLoading ? <MessageSkeleton /> : messages.length ? messages.map((message) => <DiscordMessage key={message.id} message={message} />) : (
                                            <div className="grid min-h-72 place-items-center text-center text-sm text-zinc-500"><div><FiMessageSquare className="mx-auto mb-3 text-3xl text-zinc-700" />No Discord messages in this channel yet.</div></div>
                                        )}
                                        <div ref={messageEndRef} />
                                    </div>

                                    <div className="border-t border-white/[0.07] bg-zinc-950/80 p-3 sm:p-4">
                                        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 focus-within:border-indigo-400/35">
                                            <textarea value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => {
                                                if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitComment(); }
                                            }} disabled={selectedReport.state !== "OPEN" || !pluginOnline} maxLength={1800} rows={2} placeholder={selectedReport.state === "OPEN" ? "Write to the Discord report channel…" : "This report is closed"} className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed" />
                                            <button onClick={submitComment} disabled={!comment.trim() || commentSending || selectedReport.state !== "OPEN" || !pluginOnline} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600">
                                                {commentSending ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                                            </button>
                                        </div>
                                        <div className="mt-2 flex justify-between px-1 text-[11px] text-zinc-600"><span>Enter to send · Shift + Enter for a new line</span><span>{comment.length}/1800</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {tab === "transcripts" && (
                    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                        <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 md:flex-row md:items-end md:justify-between">
                            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Archive</p><h2 className="mt-1 text-xl font-semibold text-white">Closed transcripts</h2><p className="mt-1 text-sm text-zinc-500">Permanent Discord records with saved attachments.</p></div>
                            <div className="flex gap-2">
                                <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-zinc-500 focus-within:border-indigo-400/40 sm:min-w-72"><FiSearch /><MainStringInput type="search" value={transcriptSearch} onChange={setTranscriptSearch} className="min-w-0 flex-1 border-0 bg-transparent" inputClassName="p-0 text-sm" placeholder="Search transcripts" /></label>
                                <button className={actionButton} onClick={loadTranscripts} disabled={transcriptsLoading}><FiRefreshCw className={transcriptsLoading ? "animate-spin" : ""} /></button>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                            {transcriptsLoading && Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.035]" />)}
                            {!transcriptsLoading && filteredTranscripts.map((transcript) => (
                                <article key={transcript.uniqueId} className="group flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-indigo-400/25 hover:bg-white/[0.045]">
                                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-indigo-300"><FiFileText /><span className="truncate text-xs font-semibold uppercase tracking-wider">{transcript.channelName}</span></div><h3 className="mt-2 truncate font-medium text-white">{transcript.createdBy || "Unknown"} → {transcript.target || "Unknown"}</h3></div><span className="shrink-0 text-xs text-zinc-600">{formatDate(transcript.createdAt)}</span></div>
                                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">{transcript.closeComment || "No closing comment was recorded."}</p>
                                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3"><code className="max-w-[65%] truncate text-[11px] text-zinc-600">{transcript.uniqueId}</code><button onClick={() => window.open(`/mc/report/${transcript.uniqueId}`, "_blank")} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 transition hover:text-indigo-300">Open <FiExternalLink /></button></div>
                                </article>
                            ))}
                        </div>
                        {!transcriptsLoading && !filteredTranscripts.length && <div className="py-20 text-center text-zinc-500"><FiArchive className="mx-auto mb-3 text-3xl text-zinc-700" />No transcripts found.</div>}
                    </section>
                )}

                {tab === "configuration" && (
                    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
                        <div className="flex flex-col gap-4 border-b border-white/[0.07] px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                            <div><div className="flex items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">config.yml</p>{configDirty && <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">Unsaved</span>}</div><h2 className="mt-1 text-xl font-semibold text-white">Plugin configuration</h2><p className="mt-1 text-sm text-zinc-500">Edit language, Discord, database and report behaviour. Secret values stay masked.</p></div>
                            <div className="flex flex-wrap gap-2">
                                <button className={actionButton} onClick={loadConfig} disabled={!pluginOnline || configLoading}><FiRefreshCw className={configLoading ? "animate-spin" : ""} /> Fetch</button>
                                <button className={`${actionButton} !border-indigo-400/20 !bg-indigo-500/10 !text-indigo-200`} onClick={saveConfig} disabled={!pluginOnline || !configDirty || configSaving}><FiSave /> {configSaving ? "Saving…" : "Save file"}</button>
                                <button className={`${actionButton} !border-emerald-400/20 !bg-emerald-500/10 !text-emerald-200`} onClick={reloadConfig} disabled={!pluginOnline || configDirty || configReloading}><FiZap /> {configReloading ? "Reloading…" : "Reload plugin"}</button>
                            </div>
                        </div>
                        <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
                            <div className="relative min-h-[680px] border-b border-white/[0.07] bg-[#0a0a0c] lg:border-b-0 lg:border-r">
                                {configLoading && !configYaml ? <div className="absolute inset-0 z-10 grid place-items-center bg-black/40"><FiRefreshCw className="animate-spin text-2xl text-indigo-300" /></div> : null}
                                <textarea value={configYaml} onChange={(event) => setConfigYaml(event.target.value)} spellCheck={false} disabled={!pluginOnline} className="h-[680px] w-full resize-none bg-transparent p-5 font-mono text-[13px] leading-6 text-zinc-300 outline-none selection:bg-indigo-500/30 disabled:opacity-50 sm:p-6" placeholder="Connect the plugin to load config.yml" />
                            </div>
                            <aside className="space-y-5 p-5 sm:p-6">
                                <InfoBlock icon={<FiShield />} title="Secrets are protected">Discord tokens, database passwords and API keys are replaced by placeholders. Leave them unchanged to preserve the stored value.</InfoBlock>
                                <InfoBlock icon={<FiCode />} title="Validated before write">The plugin parses your YAML in a temporary file. Invalid syntax never replaces the live configuration.</InfoBlock>
                                <InfoBlock icon={<FiZap />} title="Two-step apply">Save writes config.yml. Reload applies language, page-size and database settings to the running server.</InfoBlock>
                                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-xs leading-5 text-zinc-500"><div className="mb-2 flex items-center gap-2 font-semibold text-zinc-300"><FiServer /> Connection</div><div className="flex justify-between"><span>API socket</span><span className={webConnected ? "text-emerald-300" : "text-amber-300"}>{webConnected ? "Connected" : "Offline"}</span></div><div className="mt-1 flex justify-between"><span>Plugin bridge</span><span className={pluginOnline ? "text-emerald-300" : "text-amber-300"}>{pluginOnline ? "Connected" : "Offline"}</span></div></div>
                            </aside>
                        </div>
                    </section>
                )}
            </div>

            {decision && selectedReport && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !decisionLoading) setDecision(null); }}>
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/70 sm:p-6">
                        <div className="flex items-start justify-between gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${decision === "delete" ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}>{decision === "delete" ? <FiTrash2 /> : <FiCheckCircle />}</div><button className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white" onClick={() => setDecision(null)} disabled={decisionLoading}><FiX /></button></div>
                        <h2 className="mt-4 text-xl font-semibold text-white">{decision === "delete" ? "Delete" : "Close"} report #{selectedReport.id}?</h2>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">This updates Minecraft immediately, notifies the reporter if online, saves the transcript and closes the Discord ticket channel.</p>
                        <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Reason</label>
                        <textarea autoFocus rows={4} maxLength={255} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder="Explain why this report is being resolved…" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-indigo-400/40" />
                        <div className="mt-2 text-right text-[11px] text-zinc-600">{decisionReason.length}/255</div>
                        <div className="mt-5 flex justify-end gap-2"><button className={actionButton} onClick={() => setDecision(null)} disabled={decisionLoading}>Cancel</button><button onClick={submitDecision} disabled={!decisionReason.trim() || decisionLoading} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${decision === "delete" ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"}`}>{decisionLoading ? <FiRefreshCw className="animate-spin" /> : decision === "delete" ? <FiTrash2 /> : <FiCheckCircle />}{decisionLoading ? "Working…" : decision === "delete" ? "Delete report" : "Close report"}</button></div>
                    </div>
                </div>
            )}
        </main>
    );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
    return <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-7"><span className={accent}>{icon}</span><div><div className="text-lg font-semibold leading-none text-white">{value}</div><div className="mt-1 text-[11px] uppercase tracking-wider text-zinc-600">{label}</div></div></div>;
}

function TabButton({ active, icon, children, onClick }: { active: boolean; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
    return <button onClick={onClick} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? "bg-white/[0.1] text-white shadow-md shadow-black/20" : "text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-200"}`}>{icon}{children}</button>;
}

function StatePill({ state }: { state: ReportState }) {
    const style = state === "OPEN" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : state === "DELETED" ? "border-red-400/20 bg-red-400/10 text-red-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300";
    return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}>{state}</span>;
}

function DiscordMessage({ message }: { message: PortalMessage }) {
    return (
        <article className="group mb-1 flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/[0.025]">
            {message.author?.avatarUrl ? <img src={message.author.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 object-cover" /> : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-500/15 font-semibold text-indigo-300">{message.author?.username?.slice(0, 1).toUpperCase() || "D"}</div>}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2"><span className="font-medium text-zinc-100">{message.author?.username || "Discord"}</span>{message.author?.bot && <span className="rounded bg-indigo-500 px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-white">Bot</span>}<span className="text-[11px] text-zinc-600">{timeOnly(message.timestamp)}</span></div>
                {message.content && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-300">{message.content}</p>}
                {!!message.embeds?.length && (
                    <div className="space-embed-visualizer-scope mt-2 grid max-w-[520px] gap-2">
                        {message.embeds.map((embed, index) => (
                            <EmbedVisualizer
                                key={`${message.id}-embed-${index}`}
                                embed={{
                                    embed: {
                                        title: embed.title || undefined,
                                        description: embed.description || undefined,
                                        url: embed.url || undefined,
                                        timestamp: embed.timestamp || undefined,
                                        color: typeof embed.color === "number"
                                            ? embed.color
                                            : hexToInt(embed.color || "#5865F2"),
                                        image: embed.image?.url ? { url: embed.image.url } : undefined,
                                        thumbnail: embed.thumbnail?.url ? { url: embed.thumbnail.url } : undefined,
                                        author: embed.author ? {
                                            name: embed.author.name,
                                            url: embed.author.url,
                                            icon_url: embed.author.icon_url,
                                        } : undefined,
                                        footer: embed.footer ? {
                                            text: embed.footer.text,
                                            icon_url: embed.footer.icon_url,
                                        } : undefined,
                                        fields: embed.fields?.map((field) => ({
                                            name: field.name,
                                            value: field.value,
                                            inline: Boolean(field.inline),
                                        })),
                                    },
                                }}
                            />
                        ))}
                    </div>
                )}
                {!!message.attachments?.length && <div className="mt-2 flex flex-wrap gap-2">{message.attachments.map((attachment) => <LiveAttachment key={attachment.id} attachment={attachment} />)}</div>}
            </div>
        </article>
    );
}

function LiveAttachment({ attachment }: { attachment: PortalAttachment }) {
    const image = attachment.contentType?.startsWith("image/");
    if (image) return <a href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/10 bg-black/20"><img src={attachment.url} alt={attachment.filename} className="max-h-72 max-w-full object-contain sm:max-w-md" /><div className="flex items-center justify-between gap-4 px-3 py-2 text-xs text-zinc-400"><span className="truncate">{attachment.filename}</span><span className="shrink-0 text-zinc-600">{humanSize(attachment.size)}</span></div></a>;
    return <a href={attachment.url} target="_blank" rel="noreferrer" className="flex min-w-56 max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-indigo-400/30"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300"><FiFile /></span><span className="min-w-0"><span className="block truncate text-sm text-indigo-300">{attachment.filename}</span><span className="text-[11px] text-zinc-600">{humanSize(attachment.size)}</span></span></a>;
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return <div className="flex gap-3"><span className="mt-0.5 text-indigo-300">{icon}</span><div><h3 className="text-sm font-semibold text-zinc-200">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{children}</p></div></div>;
}

function QueueSkeleton() {
    return <>{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.025]" />)}</>;
}

function MessageSkeleton() {
    return <div className="space-y-5">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex animate-pulse gap-3"><div className="h-10 w-10 rounded-full bg-white/[0.05]" /><div className="flex-1 space-y-2"><div className="h-3 w-36 rounded bg-white/[0.05]" /><div className="h-3 w-3/4 rounded bg-white/[0.035]" /></div></div>)}</div>;
}
