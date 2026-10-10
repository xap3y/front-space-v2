"use client";

import { useCallback, useEffect, useState } from "react";
import { FaRotateRight, FaXmark } from "react-icons/fa6";
import { useUser } from "@/hooks/useUser";
import { getApiUrl } from "@/lib/core";
import MainStringInput from "@/components/MainStringInput";
import { Button, Pagination, ResourceList, Toggle } from "@/components/ui";
import Surface from "@/components/ui/Surface";
import { SelectControl } from "@/components/ui/SelectControl";

type Attempt = {
    id: string;
    rootId: string;
    previousId: string | null;
    type: string;
    resourceId: string;
    ownerId: number;
    kind: string;
    status: string;
    progress: number;
    codec: string | null;
    error: string | null;
    createdAt: string;
    updatedAt: string;
    finishedAt: string | null;
};

type TaskEvent = { id: number; level: string; message: string; createdAt: string };
type Page<T> = { content: T[]; totalPages: number; totalElements: number };
const activeStatuses = ["QUEUED", "PROBING", "CONVERTING"];
const emptyPage = { content: [], totalPages: 1, totalElements: 0 };
const date = (value: string) => new Date(value).toLocaleString();

export default function MonitoringClient() {
    const { user } = useUser();
    const [data, setData] = useState<Page<Attempt>>(emptyPage);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(25);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [auto, setAuto] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Attempt | null>(null);
    const [logs, setLogs] = useState<Page<TaskEvent>>(emptyPage);
    const [logPage, setLogPage] = useState(1);
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const key = user?.apiKey;

    const request = useCallback(async <T,>(path: string, method = "GET", signal?: AbortSignal): Promise<T> => {
        const response = await fetch(getApiUrl() + "/v1/admin/monitoring" + path, {
            method,
            headers: key ? { "X-API-Key": key } : undefined,
            credentials: "include",
            cache: "no-store",
            signal,
        });
        const body = await response.json();
        if (!response.ok || body.error) {
            throw new Error(typeof body.message === "string" ? body.message : "Monitoring is unavailable");
        }
        return body.message as T;
    }, [key]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!key) return;
        const controller = new AbortController();
        const params = new URLSearchParams({ page: String(page - 1), size: String(size), status, query });
        setLoading(true);
        request<Page<Attempt>>(`?${params}`, "GET", controller.signal).then((value) => {
            setData(value);
            setError("");
            if (value.totalPages > 0 && page > value.totalPages) setPage(value.totalPages);
        }).catch((reason) => {
            if (!controller.signal.aborted) setError(reason.message);
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => controller.abort();
    }, [key, page, size, status, query, revision, request]);

    useEffect(() => {
        if (!auto) return;
        const refresh = () => {
            if (!document.hidden) setRevision((value) => value + 1);
        };
        const timer = setInterval(refresh, 5000);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [auto]);

    const open = useCallback(async (id: string) => {
        try {
            const value = await request<Attempt>(`/${encodeURIComponent(id)}`);
            setLogPage(1);
            setLogs(emptyPage);
            setSelected(value);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not load task");
        }
    }, [request]);

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get("attempt");
        if (key && id) void open(id);
    }, [key, open]);

    const selectedId = selected?.id;
    useEffect(() => {
        if (!selectedId) return;
        const controller = new AbortController();
        Promise.all([
            request<Attempt>(`/${encodeURIComponent(selectedId)}`, "GET", controller.signal),
            request<Page<TaskEvent>>(`/${encodeURIComponent(selectedId)}/logs?page=${logPage - 1}`, "GET", controller.signal),
        ]).then(([attempt, events]) => {
            setSelected(attempt);
            setLogs(events);
        }).catch((reason) => {
            if (!controller.signal.aborted) setError(reason.message);
        });
        return () => controller.abort();
    }, [selectedId, logPage, revision, request]);

    useEffect(() => {
        if (!selectedId) return;
        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) setSelected(null);
        };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [selectedId, busy]);

    const mutate = async (task: Attempt, action: "cancel" | "retry") => {
        if (!window.confirm(action === "cancel"
            ? "Cancel this task? The original media will be kept."
            : "Retry this failed task? A separate attempt will be recorded.")) return;
        setBusy(true);
        try {
            await request(`/${encodeURIComponent(task.id)}/${action}`, "POST");
            setRevision((value) => value + 1);
            setError("");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Task action failed");
        } finally {
            setBusy(false);
        }
    };

    const actions = (task: Attempt) => (
        <div className="flex shrink-0 items-center gap-2">
            {activeStatuses.includes(task.status) && (
                <Button size="small" variant="warning" disabled={busy} onClick={() => void mutate(task, "cancel")}>
                    Cancel
                </Button>
            )}
            {task.status === "FAILED" && (
                <Button size="small" icon={<FaRotateRight />} disabled={busy} onClick={() => void mutate(task, "retry")}>
                    Retry
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl">Event monitoring</h1>
                    <p className="mt-1 text-xs text-zinc-500">Video conversions and codec inspections · persistent attempt history</p>
                </div>
                <div className="flex items-center gap-3">
                    <Toggle label="Refresh every 5s" checked={auto} onChange={setAuto} />
                    <Button size="small" icon={<FaRotateRight />} onClick={() => setRevision((value) => value + 1)}>Refresh</Button>
                </div>
            </div>
            <Surface className="flex flex-wrap items-center gap-2 p-2">
                <MainStringInput className="w-full sm:w-80" placeholder="Exact task ID or resource ID" value={search} onChange={setSearch} />
                <SelectControl compact aria-label="Task status" value={status} onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                }}>
                    <option value="">All tasks</option>
                    <option value="ACTIVE">Running / queued</option>
                    {["FAILED", "COMPLETED", "CANCELLED"].map((value) => <option key={value} value={value}>{value}</option>)}
                </SelectControl>
                <span className="text-xs text-zinc-500">{data.totalElements} attempts</span>
            </Surface>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            <ResourceList aria-busy={loading}>
                <div className="divide-y divide-zinc-800">
                    {loading && data.content.length === 0 ? Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="h-16 animate-pulse bg-zinc-900/40" />
                    )) : data.content.map((task) => (
                        <div key={task.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs">
                            <div className="min-w-0 flex-1 basis-60">
                                <Button size="small" onClick={() => void open(task.id)}>{task.type.replaceAll("_", " ")}</Button>
                                <p className="mt-1 truncate text-zinc-500" title={task.resourceId}>{task.kind} · {task.resourceId} · user #{task.ownerId}</p>
                                {task.id !== task.rootId && <a className="text-zinc-400 underline" href={`?attempt=${encodeURIComponent(task.rootId)}`} onClick={(event) => {
                                    event.preventDefault();
                                    void open(task.rootId);
                                }}>Original attempt</a>}
                            </div>
                            <div className="w-32">
                                <span className={task.status === "FAILED" ? "text-red-400" : "text-zinc-400"}>{task.status} {task.progress}%</span>
                                {activeStatuses.includes(task.status) && <progress aria-label="Task progress" value={task.progress} max={100} className="mt-1 block h-1 w-full accent-blue-500" />}
                            </div>
                            <time className="text-zinc-500">{date(task.createdAt)}</time>
                            {actions(task)}
                        </div>
                    ))}
                    {!loading && data.content.length === 0 && <p className="p-6 text-center text-xs text-zinc-500">No recorded tasks match these filters.</p>}
                </div>
                <Pagination page={page} pages={data.totalPages} onChange={setPage} disabled={loading} pageSize={size} onPageSizeChange={(value) => {
                    setSize(value);
                    setPage(1);
                }} />
            </ResourceList>
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" onClick={() => !busy && setSelected(null)}>
                    <Surface role="dialog" aria-modal="true" aria-label="Task details" className="max-h-[85dvh] w-full max-w-3xl space-y-3 overflow-y-auto p-4" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between gap-2">
                            <h2>Task details</h2>
                            <Button size="small" icon={<FaXmark />} aria-label="Close details" disabled={busy} onClick={() => setSelected(null)} />
                        </div>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 break-all text-xs">
                            <dt className="text-zinc-500">Attempt</dt><dd>{selected.id}</dd>
                            <dt className="text-zinc-500">Original</dt><dd><a className="underline" href={`?attempt=${selected.rootId}`} onClick={(event) => { event.preventDefault(); void open(selected.rootId); }}>{selected.rootId}</a></dd>
                            {selected.previousId && <><dt className="text-zinc-500">Previous</dt><dd><a className="underline" href={`?attempt=${selected.previousId}`} onClick={(event) => { event.preventDefault(); void open(selected.previousId!); }}>{selected.previousId}</a></dd></>}
                            <dt className="text-zinc-500">Resource</dt><dd>{selected.kind} / {selected.resourceId}</dd>
                            <dt className="text-zinc-500">Owner</dt><dd>#{selected.ownerId}</dd>
                            <dt className="text-zinc-500">State</dt><dd>{selected.status} · {selected.progress}% · {selected.codec ?? "Unknown codec"}</dd>
                            <dt className="text-zinc-500">Created</dt><dd>{date(selected.createdAt)}</dd>
                            <dt className="text-zinc-500">Updated</dt><dd>{date(selected.updatedAt)}</dd>
                            <dt className="text-zinc-500">Finished</dt><dd>{selected.finishedAt ? date(selected.finishedAt) : "—"}</dd>
                        </dl>
                        {selected.error && <p className="text-xs text-red-400">{selected.error}</p>}
                        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
                        {actions(selected)}
                        <h3 className="border-t border-zinc-800 pt-3 text-sm">Event log <span className="text-zinc-500">· newest first</span></h3>
                        <div className="divide-y divide-zinc-800 text-xs">
                            {logs.content.map((event) => <div key={event.id} className="space-y-1 py-2">
                                <p className="text-zinc-500">{date(event.createdAt)} · {event.level}</p>
                                <p className="whitespace-pre-wrap break-words">{event.message}</p>
                            </div>)}
                            {logs.content.length === 0 && <p className="py-3 text-zinc-500">No log entries.</p>}
                        </div>
                        <Pagination page={logPage} pages={logs.totalPages} onChange={setLogPage} />
                    </Surface>
                </div>
            )}
        </div>
    );
}
