"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MainStringInput from "@/components/MainStringInput";

function formatBytes(bytes?: number) {
    if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "—";
    if (bytes < 0) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatPercent01(v?: number) {
    if (v === undefined || v === null || Number.isNaN(v)) return "—";
    return `${(v * 100).toFixed(2)}%`;
}

function formatNumber(v?: number, digits = 2) {
    if (v === undefined || v === null || Number.isNaN(v)) return "—";
    return Number(v).toFixed(digits);
}

function formatDateFromEpochSecondsOrMs(v?: number) {
    if (v === undefined || v === null || Number.isNaN(v)) return "—";
    // your sample is 1.768e9 which is seconds
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function groupKey(k: string) {
    if (k.startsWith("system.")) return "System";
    if (k.startsWith("process.")) return "Process";
    if (k.startsWith("jvm.")) return "JVM";
    if (k.startsWith("disk.")) return "Disk";
    if (k.startsWith("executor.")) return "Executor";
    if (k.startsWith("hikaricp.")) return "HikariCP";
    return "Other";
}

function titleize(k: string) {
    return k
        .replace(/^system\./, "")
        .replace(/^process\./, "")
        .replace(/^jvm\./, "")
        .replace(/^disk\./, "")
        .replace(/^executor\./, "")
        .replace(/^hikaricp\./, "")
        .replace(/^Uploads\./, "")
        .replace(/\./g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
    initialMetrics: Record<string, number>;
    initialError?: string;
};

export default function SystemPageClient({ initialMetrics, initialError = "" }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [showRawKeys, setShowRawKeys] = useState(false);

    const metrics = initialMetrics ?? {};

    // Common values
    const systemCpuUsage = metrics["system.cpu.usage"];
    const systemCpuCount = metrics["system.cpu.count"];
    const processCpuUsage = metrics["process.cpu.usage"];

    const jvmMemUsed = metrics["jvm.memory.used"];
    const jvmMemCommitted = metrics["jvm.memory.committed"];
    const jvmMemMax = metrics["jvm.memory.max"];

    const diskTotal = metrics["disk.total"];
    const diskFree = metrics["disk.free"];

    const procOpenFiles = metrics["process.files.open"];
    const procMaxFiles = metrics["process.files.max"];

    const procStart = metrics["process.start.time"];
    const procUptime = metrics["process.uptime"];

    const filteredEntries = useMemo(() => {
        const q = search.trim().toLowerCase();
        const entries = Object.entries(metrics);

        if (!q) return entries;

        return entries.filter(([k, v]) => {
            const key = k.toLowerCase();
            const value = String(v).toLowerCase();
            return key.includes(q) || value.includes(q);
        });
    }, [metrics, search]);

    const grouped = useMemo(() => {
        const map = new Map<string, Array<[string, number]>>();
        for (const [k, v] of filteredEntries) {
            const g = groupKey(k);
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push([k, v]);
        }

        // sort keys inside groups
        for (const [g, arr] of map) {
            arr.sort((a, b) => a[0].localeCompare(b[0]));
            map.set(g, arr);
        }

        // order groups nicely
        const order = ["System", "Process", "JVM", "Disk", "Executor", "HikariCP", "Other"];
        return order
            .filter((g) => map.has(g))
            .map((g) => ({ group: g, items: map.get(g)! }));
    }, [filteredEntries]);

    return (
        <div className="flex flex-col gap-4">
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">System</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            Micrometer-style metrics snapshot (server-fetched). Use search to quickly find a metric.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.refresh()}
                            className="px-4 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                        >
                            Refresh
                        </button>

                        <label className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="mr-2 accent-white"
                                checked={showRawKeys}
                                onChange={(e) => setShowRawKeys(e.target.checked)}
                            />
                            Raw keys
                        </label>
                    </div>
                </div>

                {initialError ? (
                    <div className="mt-3 text-sm text-red-300 border border-red-500/20 bg-red-600/10 rounded-lg p-3">
                        {initialError}
                    </div>
                ) : null}

                {/* Quick summary cards */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div className="box-primary p-4">
                        <div className="text-xs text-gray-400">System CPU</div>
                        <div className="text-lg font-semibold mt-1">{formatPercent01(systemCpuUsage)}</div>
                        <div className="text-xs text-gray-400 mt-1">Cores: {formatNumber(systemCpuCount, 0)}</div>
                    </div>

                    <div className="box-primary p-4">
                        <div className="text-xs text-gray-400">Process CPU</div>
                        <div className="text-lg font-semibold mt-1">{formatPercent01(processCpuUsage)}</div>
                        <div className="text-xs text-gray-400 mt-1">Uptime: {formatNumber(procUptime, 1)}s</div>
                    </div>

                    <div className="box-primary p-4">
                        <div className="text-xs text-gray-400">JVM Memory</div>
                        <div className="text-lg font-semibold mt-1">{formatBytes(jvmMemUsed)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            Committed: {formatBytes(jvmMemCommitted)} · Max: {formatBytes(jvmMemMax)}
                        </div>
                    </div>

                    <div className="box-primary p-4">
                        <div className="text-xs text-gray-400">Disk</div>
                        <div className="text-lg font-semibold mt-1">{formatBytes(diskFree)} free</div>
                        <div className="text-xs text-gray-400 mt-1">Total: {formatBytes(diskTotal)}</div>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4 box-primary p-4">
                    <div className="font-semibold">Search metrics</div>
                    <div className="mt-3 flex gap-2">
                        <MainStringInput
                            className="w-full"
                            type="text"
                            placeholder="Search e.g. cpu, jvm.threads, hikaricp..."
                            value={search}
                            onChange={(e) => setSearch(e)}
                        />
                        <button
                            className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                            onClick={() => setSearch("")}
                            disabled={!search.trim()}
                        >
                            Clear
                        </button>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                        Showing <span className="text-white">{filteredEntries.length}</span> metric(s).
                    </div>
                </div>
            </div>

            {/* Metrics table */}
            <div className="box-primary p-4">
                <div className="font-semibold">All metrics</div>

                <div className="mt-3 space-y-4">
                    {grouped.map(({ group, items }) => (
                        <div key={group} className="box-primary p-4">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold">{group}</div>
                                <div className="text-xs text-gray-400">{items.length} items</div>
                            </div>

                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-400">
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-2 pr-3">Metric</th>
                                        <th className="text-left py-2 pr-3">Value</th>
                                        <th className="text-left py-2 pr-3">Formatted</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                    {items.map(([k, v]) => {
                                        const formatted =
                                            k.includes("memory") || k.startsWith("disk.")
                                                ? formatBytes(v)
                                                : k.endsWith(".usage")
                                                    ? formatPercent01(v)
                                                    : k.endsWith("start.time")
                                                        ? formatDateFromEpochSecondsOrMs(v)
                                                        : formatNumber(v, 3);

                                        return (
                                            <tr key={k} className="align-top">
                                                <td className="py-2 pr-3">
                                                    <div className="text-white font-medium">
                                                        {showRawKeys ? k : titleize(k)}
                                                    </div>
                                                    {showRawKeys ? null : (
                                                        <div className="text-xs text-gray-500 mt-0.5">{k}</div>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-3 font-mono text-gray-200">{String(v)}</td>
                                                <td className="py-2 pr-3 text-gray-200">{formatted}</td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-6 text-center text-gray-400">
                                                No metrics.
                                            </td>
                                        </tr>
                                    ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* Extra: process file limits card if present */}
                    {procOpenFiles !== undefined || procMaxFiles !== undefined ? (
                        <div className="box-primary p-4">
                            <div className="font-semibold">Files</div>
                            <div className="mt-2 text-sm text-gray-300">
                                Open: <span className="text-white">{formatNumber(procOpenFiles, 0)}</span> · Max:{" "}
                                <span className="text-white">{formatNumber(procMaxFiles, 0)}</span>
                            </div>
                        </div>
                    ) : null}

                    {/* Extra: process start time */}
                    {procStart !== undefined ? (
                        <div className="box-primary p-4">
                            <div className="font-semibold">Process</div>
                            <div className="mt-2 text-sm text-gray-300">
                                Started: <span className="text-white">{formatDateFromEpochSecondsOrMs(procStart)}</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}