"use client";
import { SelectionInput } from "@/components/ui/SelectionInput";


import {useEffect, useMemo, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {FaRotateRight} from "react-icons/fa6";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import type {SystemSnapshot} from "@/types/system";
import styles from "@/components/ui/ui.module.css";

type Row = {
    key: string;
    name: string;
    value: string | number | boolean;
    unit?: string | null;
    tags?: string;
};

function bytes(value: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(unit ? 2 : 0)} ${units[unit]}`;
}

function formatted(row: Row): string {
    const value = row.value;
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    if (typeof value !== "number") {
        return String(value);
    }
    if (!Number.isFinite(value) || value < 0) {
        return "Unavailable";
    }
    if (row.name.endsWith(".epoch") || row.name === "process.start.time") {
        return new Date(value * 1000).toLocaleString();
    }
    const isCount = /\.(count|collections|loaded|unloaded|live|daemon|peak|started)$/.test(row.name);
    if (!isCount && (row.unit === "bytes" || row.name.endsWith(".bytes"))) {
        return bytes(value);
    }
    if (row.name.endsWith(".usage")) {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (!isCount && (row.unit === "seconds" || row.name.endsWith(".seconds") || row.name === "process.uptime")) {
        if (value >= 3600) {
            return `${Math.floor(value / 3600)}h ${Math.floor(value % 3600 / 60)}m`;
        }
        return `${value.toLocaleString(undefined, {maximumFractionDigits: 3})} s`;
    }
    return value.toLocaleString(undefined, {maximumFractionDigits: 3}) + (row.unit && !isCount ? ` ${row.unit}` : "");
}

function category(name: string): string {
    if (name.startsWith("runtime.pool.")) {
        return `Memory pool · ${name.split(".")[2].replaceAll("_", " ")}`;
    }
    if (name.includes(".threads.")) {
        return "Threads";
    }
    if (name.startsWith("runtime.gc.") || name.startsWith("jvm.gc.")) {
        return "Garbage collection";
    }
    if (name.startsWith("runtime.memory.") || name.startsWith("jvm.memory.") || name.startsWith("jvm.buffer.")) {
        return "JVM memory & buffers";
    }
    if (name.startsWith("http.")) {
        return "HTTP traffic & latency";
    }
    if (name.startsWith("hikaricp.") || name.startsWith("jdbc.")) {
        return "Database & connection pools";
    }
    if (name.startsWith("executor.")) {
        return "Executors & task queues";
    }
    if (name.startsWith("runtime.os.") || name.startsWith("system.") || name.startsWith("disk.")) {
        return "Host & storage";
    }
    if (name.startsWith("runtime.process.") || name.startsWith("runtime.files.") || name.startsWith("process.")) {
        return "Process & file handles";
    }
    if (name.includes(".classes.") || name.includes(".compiler.") || name.startsWith("jvm.classes.")) {
        return "Classes & compilation";
    }
    if (name.startsWith("runtime.")) {
        return "Java runtime";
    }
    return "Application";
}

function label(name: string): string {
    return name.replace(/^runtime\.pool\.[^.]+\./, "")
        .replace(/^(runtime|jvm|system|process)\./, "")
        .replaceAll(".", " ")
        .replaceAll("_", " ");
}

export default function SystemPageClient({initialMetrics, initialError = ""}: {
    initialMetrics: SystemSnapshot;
    initialError?: string;
}) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [raw, setRaw] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshing, startTransition] = useTransition();

    useEffect(() => {
        if (!autoRefresh) {
            return;
        }
        const timer = window.setInterval(() => startTransition(() => router.refresh()), 15000);
        return () => window.clearInterval(timer);
    }, [autoRefresh, router]);

    const rows = useMemo(() => {
        const result: Row[] = Object.entries(initialMetrics.runtime ?? {}).map(([name, value]) => ({
            key: name, name, value,
        }));
        for (const [index, series] of (initialMetrics.series ?? []).entries()) {
            const tags = Object.entries(series.tags).map(([key, value]) => `${key}: ${value}`).join(" · ");
            for (const [stat, value] of Object.entries(series.measurements)) {
                result.push({
                    key: `${index}:${series.name}:${stat}`,
                    name: stat === "value" ? series.name : `${series.name}.${stat}`,
                    value,
                    unit: ["count", "active_tasks", "unknown"].includes(stat) ? undefined : series.unit,
                    tags,
                });
            }
        }
        // Accept older backend snapshots during a rolling deployment.
        if (!result.length) {
            for (const [name, value] of Object.entries(initialMetrics)) {
                if (typeof value === "number") {
                    result.push({key: name, name, value});
                }
            }
        }
        return result;
    }, [initialMetrics]);

    const groups = useMemo(() => {
        const query = search.trim().toLowerCase();
        const grouped = new Map<string, Row[]>();
        for (const row of rows) {
            if (query && !`${row.name} ${row.tags ?? ""} ${row.value}`.toLowerCase().includes(query)) {
                continue;
            }
            const group = category(row.name);
            const items = grouped.get(group) ?? [];
            items.push(row);
            grouped.set(group, items);
        }
        return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [rows, search]);

    const metric = (key: string): number | undefined => {
        const value = initialMetrics[key] ?? initialMetrics.runtime?.[key];
        return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
    };
    const summaries = [
        {name: "Host CPU", value: metric("system.cpu.usage") ?? metric("runtime.os.cpu.usage"), unit: "percent"},
        {name: "Process CPU", value: metric("process.cpu.usage") ?? metric("runtime.process.cpu.usage"), unit: "percent"},
        {name: "Heap used", value: metric("runtime.memory.heap.used.bytes"), unit: "bytes"},
        {name: "Heap max", value: metric("runtime.memory.heap.max.bytes"), unit: "bytes"},
        {name: "Disk free", value: metric("disk.free"), unit: "bytes"},
        {name: "Live threads", value: metric("runtime.threads.live"), unit: "count"},
        {name: "DB active / pending", text: `${metric("hikaricp.connections.active") ?? "—"} / ${metric("hikaricp.connections.pending") ?? "—"}`},
        {name: "Uptime", value: metric("runtime.uptime.seconds"), unit: "seconds"},
    ];

    return (
        <section className="space-y-3">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg font-semibold">System</h1>
                    <p className="text-[10px] text-zinc-500">
                        {rows.length} measurements · {initialMetrics.series?.length ?? 0} metric series
                        {initialMetrics.collectedAt && ` · Snapshot ${new Date(initialMetrics.collectedAt).toLocaleString()}`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                    <label className="flex items-center gap-1.5">
                        <SelectionInput type="checkbox" checked={autoRefresh} onChange={event => setAutoRefresh(event.target.checked)} className="accent-sky-500" />
                        Refresh every 15s
                    </label>
                    <label className="flex items-center gap-1.5">
                        <SelectionInput type="checkbox" checked={raw} onChange={event => setRaw(event.target.checked)} className="accent-sky-500" />
                        Raw keys
                    </label>
                    <HoverDiv
                        type="INFO"
                        icon={<FaRotateRight className={refreshing ? "animate-spin" : ""} />}
                        disabled={refreshing}
                        onClick={() => startTransition(() => router.refresh())}
                        className="px-2 py-1 text-[11px]"
                    >
                        Refresh
                    </HoverDiv>
                </div>
            </header>
            {initialError && <p role="alert" className="text-xs text-red-400">{initialError}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                {summaries.map(summary => (
                    <div key={summary.name} className={styles.metricTile}>
                        <p className="text-[9px] uppercase tracking-wide text-zinc-600">{summary.name}</p>
                        <p className="mt-1 truncate text-xs font-medium tabular-nums text-zinc-200">
                            {summary.text ?? (summary.value === undefined ? "—"
                                : summary.unit === "percent" ? `${(summary.value * 100).toFixed(1)}%`
                                    : formatted({key: summary.name, name: summary.name, value: summary.value, unit: summary.unit === "count" ? undefined : summary.unit}))}
                        </p>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <MainStringInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search metrics, pools, states or values…"
                    aria-label="Search system metrics"
                    className="w-full sm:max-w-md"
                    inputClassName="px-2.5 py-1.5 text-xs"
                />
                <span className="text-[10px] text-zinc-600">
                    {groups.reduce((total, [, items]) => total + items.length, 0)} / {rows.length}
                </span>
            </div>
            <div className={styles.metricGrid}>
                {groups.map(([group, items]) => (
                    <section key={group} className={styles.metricPanel}>
                        <h2 className="flex justify-between gap-2 border-b border-zinc-800 bg-white/[.02] px-2.5 py-2 text-xs font-medium text-zinc-300">
                            {group}<span className="text-[10px] text-zinc-600">{items.length}</span>
                        </h2>
                        <dl className="divide-y divide-zinc-800/60" tabIndex={0} aria-label={`${group} metrics`}>
                            {items.map(row => (
                                <div key={row.key} className="flex items-start justify-between gap-3 px-2.5 py-1.5 text-[10px]">
                                    <dt className="min-w-0 flex-1 text-zinc-500" title={row.name}>
                                        <span className="block break-words">{raw ? row.name : label(row.name)}</span>
                                        {row.tags && <span className="block break-words text-[9px] text-zinc-700">{row.tags}</span>}
                                    </dt>
                                    <dd className="max-w-[48%] break-words text-right font-mono tabular-nums text-zinc-300" title={String(row.value)}>
                                        {formatted(row)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
            {!groups.length && <p className="py-8 text-center text-xs text-zinc-600">No metrics match this search.</p>}
            <p className="text-[10px] text-zinc-600">
                Counters are totals since startup; timers show count, total time and max. Memory pools retain current, peak and post-GC values.
                Unsupported measurements are omitted, not reported as zero. Environment variables, startup arguments and credentials are not included.
            </p>
        </section>
    );
}
