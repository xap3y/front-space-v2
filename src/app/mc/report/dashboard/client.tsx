"use client";
import { SelectControl } from "@/components/ui/SelectControl";


import ResourceList from "@/components/ui/ResourceList";

import Pagination from "@/components/ui/Pagination";

import {useCallback, useEffect, useState} from "react";
import ApiKeyAccess, {dashboardRequest, displayDate, RowsLoading} from "@/components/dashboard/ApiKeyAccess";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {FiRefreshCw, FiLogOut, FiSearch, FiX} from "react-icons/fi";

type Player = {uuid: string; name: string; server?: string};
type Report = {
    id: number;
    sourceServer: string;
    reporter: Player;
    target: Player;
    reason: string;
    state: string;
    reportTime: string;
    discordChannelId?: number;
    close?: {reason?: string; closedAt: string; from: string; closedBy: string};
};
type ReportPage = {content: Report[]; first: boolean; last: boolean};
type Status = {connected: boolean; lastDataSync?: string; lastMessageAt?: string};

function Dashboard({apiKey, logout}: {apiKey: string; logout: () => void}) {
    const [tab, setTab] = useState("open");
    const [page, setPage] = useState(0);
    const [data, setData] = useState<ReportPage | null>(null);
    const [status, setStatus] = useState<Status | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [player, setPlayer] = useState("");
    const [role, setRole] = useState("target");
    const [sourceServer, setSourceServer] = useState("");
    const [targetServer, setTargetServer] = useState("");
    const [closedFrom, setClosedFrom] = useState("");
    const [filter, setFilter] = useState({player: "", role: "target", sourceServer: "", targetServer: "", closedFrom: ""});
    const [selected, setSelected] = useState<Report | null>(null);
    const [revision, setRevision] = useState(0);

    const refresh = useCallback(async (signal: AbortSignal) => {
        setLoading(true);
        setError("");
        let path = `/v1/mc/reports/get/${tab}`;
        if (filter.player) {
            path = `/v1/mc/reports/get/${filter.role}/${encodeURIComponent(filter.player)}${tab === "open" ? "" : "/all"}`;
        } else if (tab === "closed" && filter.closedFrom) {
            path += `/${encodeURIComponent(filter.closedFrom)}`;
        }
        const query = new URLSearchParams({page: String(page), pageSize: "25"});
        if (filter.sourceServer) query.set("sourceServer", filter.sourceServer);
        if (filter.targetServer) query.set("targetServer", filter.targetServer);
        try {
            const [reports, sync] = await Promise.all([
                dashboardRequest<ReportPage>(apiKey, `${path}?${query}`, signal),
                dashboardRequest<Status>(apiKey, "/v1/mc/reports/status", signal),
            ]);
            if (!signal.aborted) {
                setData(reports);
                setStatus(sync);
            }
        } catch (failure) {
            if (!signal.aborted) {
                setData(null);
                setError(failure instanceof Error ? failure.message : "Could not load reports");
            }
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, [apiKey, tab, page, filter]);

    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh, revision]);

    useEffect(() => {
        const close = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, []);

    return (
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-8">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                    <p className="text-xs text-zinc-500">MINECRAFT / REPORTS</p>
                    <h1 className="mt-2 text-2xl font-semibold">Report dashboard</h1>
                </div>
                <div className="flex gap-2">
                    <a href="/mc/report/docs" className="px-3 py-2 text-xs text-zinc-500 hover:text-white">API docs</a>
                    <HoverDiv type="INFO" icon={<FiRefreshCw/>} onClick={() => setRevision(value => value + 1)} disabled={loading} className="px-3 py-2 text-xs">Refresh</HoverDiv>
                    <HoverDiv type="INFO" icon={<FiLogOut/>} onClick={logout} className="px-3 py-2 text-xs">Sign out</HoverDiv>
                </div>
            </header>
            <div className="flex flex-wrap gap-x-6 gap-y-2 py-4 text-xs text-zinc-500">
                <span className={status?.connected ? "text-emerald-400" : "text-amber-400"}>{status?.connected ? "Plugin connected" : "Plugin offline"}</span>
                <span>Last sync: {displayDate(status?.lastDataSync)}</span>
                <span>Stored reports remain available while offline.</span>
            </div>
            <div className="flex gap-2 border-b border-zinc-800 pb-3">
                {["open", "closed", "all"].map(value => (
                    <HoverDiv key={value} type="INFO" onClick={() => {setTab(value); setPage(0);}} className={`px-4 py-2 text-sm capitalize ${tab === value ? "border-zinc-500 text-white" : "text-zinc-500"}`}>{value}</HoverDiv>
                ))}
            </div>
            <div className="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MainStringInput value={player} onChange={setPlayer} placeholder="Player name or UUID" className="bg-zinc-950"/>
                <SelectControl aria-label="Player role" value={role} onChange={event => setRole(event.target.value)} className="rounded border-2 border-zinc-800 bg-zinc-950 px-3 text-sm">
                    <option value="target">Reported player</option><option value="reporter">Reporter</option>
                </SelectControl>
                <MainStringInput value={sourceServer} onChange={setSourceServer} placeholder="Source server" className="bg-zinc-950"/>
                <MainStringInput value={targetServer} onChange={setTargetServer} placeholder="Target server" className="bg-zinc-950"/>
                <HoverDiv type="INFO" icon={<FiSearch/>} onClick={() => {setPage(0); setFilter({player: player.trim(), role, sourceServer: sourceServer.trim(), targetServer: targetServer.trim(), closedFrom: closedFrom.trim()});}} className="px-4 py-2 text-sm">Apply filters</HoverDiv>
                {tab === "closed" && <MainStringInput value={closedFrom} onChange={setClosedFrom} placeholder="Closed by / source" className="bg-zinc-950"/>}
            </div>
            {filter.player && tab === "closed" && <p className="mb-3 text-xs text-zinc-500">Player searches show all states, as provided by the Reports API.</p>}
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
            <ResourceList className="overflow-hidden">
                {loading ? <RowsLoading/> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-zinc-800 text-xs text-zinc-500"><tr>{["Report", "Player", "Reporter", "Reason", "State", "Reported"].map(label => <th key={label} className="px-4 py-3 font-normal">{label}</th>)}</tr></thead>
                            <tbody className="divide-y divide-zinc-800/70">
                                {data?.content.map(report => (
                                    <tr key={`${report.sourceServer}:${report.id}`} className="align-top hover:bg-zinc-900/70">
                                        <td className="px-4 py-4"><HoverDiv type="INFO" onClick={() => setSelected(report)} className="px-2 py-1 text-xs">#{report.id}</HoverDiv></td>
                                        <td className="px-4 py-4">{report.target?.name}<p className="mt-1 text-xs text-zinc-600">{report.target?.server || report.sourceServer}</p></td>
                                        <td className="px-4 py-4 text-zinc-400">{report.reporter?.name}</td>
                                        <td className="max-w-sm break-words px-4 py-4 text-zinc-400">{report.reason}</td>
                                        <td className={`px-4 py-4 text-xs ${report.state === "OPEN" ? "text-amber-300" : "text-zinc-500"}`}>{report.state}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-500">{displayDate(report.reportTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!data?.content.length && <p className="p-10 text-center text-sm text-zinc-500">No reports for these filters.</p>}
                    </div>
                )}
            <Pagination
                page={page + 1}
                hasNext={Boolean(data && !data.last)}
                disabled={loading || !data}
                onChange={(nextPage) => setPage(nextPage - 1)}
            />
            </ResourceList>
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelected(null)}>
                    <section role="dialog" aria-modal="true" aria-label="Report details" onClick={event => event.stopPropagation()} className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded border border-zinc-700 bg-zinc-950 p-6">
                        <div className="flex justify-between"><h2 className="text-lg font-semibold">Report #{selected.id}</h2><HoverDiv type="INFO" icon={<FiX/>} aria-label="Close" onClick={() => setSelected(null)} className="p-2"/></div>
                        <p className="mt-4 text-sm">{selected.reporter?.name} reported {selected.target?.name}</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">{selected.reason}</p>
                        <dl className="mt-5 grid grid-cols-[100px_1fr] gap-3 border-t border-zinc-800 pt-4 text-xs">
                            <dt className="text-zinc-500">State</dt><dd>{selected.state}</dd>
                            <dt className="text-zinc-500">Target UUID</dt><dd className="break-all">{selected.target?.uuid}</dd>
                            <dt className="text-zinc-500">Reporter UUID</dt><dd className="break-all">{selected.reporter?.uuid}</dd>
                            <dt className="text-zinc-500">Source server</dt><dd>{selected.sourceServer}</dd>
                            <dt className="text-zinc-500">Reported</dt><dd>{displayDate(selected.reportTime)}</dd>
                            {selected.close && <><dt className="text-zinc-500">Closed</dt><dd>{displayDate(selected.close.closedAt)}</dd><dt className="text-zinc-500">Closed by</dt><dd>{selected.close.closedBy} · {selected.close.from}</dd><dt className="text-zinc-500">Resolution</dt><dd>{selected.close.reason || "—"}</dd></>}
                        </dl>
                    </section>
                </div>
            )}
        </main>
    );
}

export default function ReportsDashboardClient() {
    return <ApiKeyAccess title="Minecraft reports" description="Use your Reports API key to inspect synchronized reports." statusPath="/v1/mc/reports/status">
        {(key, logout) => <Dashboard apiKey={key} logout={logout}/>}
    </ApiKeyAccess>;
}
