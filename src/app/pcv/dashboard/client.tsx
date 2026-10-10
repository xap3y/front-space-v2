"use client";
import {DeleteButton} from "@/components/HoverDiv";


import ResourceList from "@/components/ui/ResourceList";

import Pagination from "@/components/ui/Pagination";
import { SelectionInput } from "@/components/ui/SelectionInput";


import {useEffect, useState} from "react";
import ApiKeyAccess, {dashboardRequest, displayDate, RowsLoading} from "@/components/dashboard/ApiKeyAccess";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {FiLogOut, FiRefreshCw, FiPlus, FiX, FiSearch} from "react-icons/fi";
import {parseDurationToSeconds} from "@/lib/pcv";

type Vip = {
    id: number;
    player?: {uuid: string; name: string};
    playerUuid?: string;
    playerName?: string;
    vipName: string;
    durationSeconds: number;
    activeFrom?: string;
    activatedAt?: string;
    pausedAt?: string;
    expiresAt?: string;
    serverName?: string;
    sourceServer?: string;
    state?: string;
    activationReason?: string;
    hasQueue?: boolean;
};
type PageData = {content: Vip[]; totalElements: number; totalPages: number; last: boolean};
type SyncStatus = {connected: boolean; connections: number; lastDataSync: string; pendingMutations: number};
type PlayerData = {player: {uuid: string; name: string}; active: Vip[]; queue: Vip[]; history: Vip[]};
type Mutation = {mode: "add" | "update" | "remove"; uuid: string; vip: string; duration: string; silent: boolean};

function durationText(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days ? `${days}d ` : ""}${hours ? `${hours}h ` : ""}${minutes}m`;
}

function Dashboard({apiKey, logout}: {apiKey: string; logout: () => void}) {
    const [tab, setTab] = useState("active");
    const [page, setPage] = useState(0);
    const [data, setData] = useState<PageData | null>(null);
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [revision, setRevision] = useState(0);
    const [vipFilter, setVipFilter] = useState("");
    const [from, setFrom] = useState("");
    const [filter, setFilter] = useState({vip: "", from: ""});
    const [playerUuid, setPlayerUuid] = useState("");
    const [player, setPlayer] = useState<PlayerData | null>(null);
    const [playerBusy, setPlayerBusy] = useState(false);
    const [mutation, setMutation] = useState<Mutation | null>(null);
    const [mutationBusy, setMutationBusy] = useState(false);
    const [mutationError, setMutationError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError("");
            const query = new URLSearchParams({page: String(page), pageSize: "25"});
            if (filter.vip) query.set("vip", filter.vip);
            if (filter.from) query.set("activeFrom", filter.from);
            try {
                const [rows, sync] = await Promise.all([
                    dashboardRequest<PageData>(apiKey, `/v1/pcv/admin/${tab}?${query}`, controller.signal),
                    dashboardRequest<SyncStatus>(apiKey, "/v1/pcv/admin/status", controller.signal),
                ]);
                if (!controller.signal.aborted) {setData(rows); setStatus(sync);}
            } catch (failure) {
                if (!controller.signal.aborted) {
                    setData(null);
                    setError(failure instanceof Error ? failure.message : "Could not load VIPs");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
    }, [apiKey, tab, page, filter, revision]);

    useEffect(() => {
        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !mutationBusy) {setMutation(null); setPlayer(null);}
        };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [mutationBusy]);

    const lookupPlayer = async () => {
        if (!playerUuid.trim()) return;
        setPlayerBusy(true);
        setError("");
        try {
            const result = await dashboardRequest<PlayerData>(apiKey, `/v1/pcv/player/${encodeURIComponent(playerUuid.trim())}/all`);
            setPlayer(result);
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Player lookup failed");
        } finally {
            setPlayerBusy(false);
        }
    };

    const openMutation = (mode: Mutation["mode"], row?: Vip) => {
        setMutationError("");
        setMutation({mode, uuid: row?.player?.uuid || row?.playerUuid || "", vip: row?.vipName || "", duration: "", silent: false});
    };

    const submitMutation = async () => {
        if (!mutation || mutationBusy) return;
        setMutationError("");
        try {
            if (!/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(mutation.uuid.trim())) throw new Error("Enter a valid Minecraft UUID");
            if (!mutation.vip.trim()) throw new Error("Enter a VIP package name");
            let seconds: number | undefined;
            if (mutation.duration.trim()) {
                seconds = /^\d+$/.test(mutation.duration.trim()) ? Number(mutation.duration) : parseDurationToSeconds(mutation.duration);
                if (!Number.isSafeInteger(seconds) || seconds <= 0) throw new Error("Duration must be greater than zero");
            } else if (mutation.mode === "update") throw new Error("Enter the new remaining duration");
            setMutationBusy(true);
            const path = `/v1/pcv/admin/player/${encodeURIComponent(mutation.uuid.trim())}`
                + (mutation.mode === "remove" ? `/${encodeURIComponent(mutation.vip.trim())}` : "");
            const result = await dashboardRequest<{success: boolean; message: string}>(apiKey, path, undefined,
                mutation.mode === "add" ? "POST" : mutation.mode === "update" ? "PUT" : "DELETE",
                mutation.mode === "remove" ? undefined : {vip_name: mutation.vip.trim(), duration: seconds, silent: mutation.mode === "add" ? mutation.silent : undefined});
            if (!result.success) throw new Error(result.message);
            setNotice(result.message);
            setMutation(null);
            setRevision(value => value + 1);
        } catch (failure) {
            setMutationError(failure instanceof Error ? failure.message : "Operation failed");
        } finally {
            setMutationBusy(false);
        }
    };

    return (
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-8">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div><p className="text-xs text-zinc-500">MINECRAFT / PLAYCOREVIP</p><h1 className="mt-2 text-2xl font-semibold">VIP dashboard</h1></div>
                <div className="flex flex-wrap gap-2">
                    <a href="/pcv/docs" className="px-3 py-2 text-xs text-zinc-500 hover:text-white">API docs</a>
                    <HoverDiv type="SAVE" icon={<FiPlus/>} onClick={() => openMutation("add")} disabled={!status?.connected} className="px-3 py-2 text-xs">Add VIP</HoverDiv>
                    <HoverDiv type="INFO" icon={<FiRefreshCw/>} onClick={() => setRevision(value => value + 1)} disabled={loading} className="px-3 py-2 text-xs">Refresh</HoverDiv>
                    <HoverDiv type="INFO" icon={<FiLogOut/>} onClick={logout} className="px-3 py-2 text-xs">Sign out</HoverDiv>
                </div>
            </header>
            <div className="flex flex-wrap gap-x-6 gap-y-2 py-4 text-xs text-zinc-500">
                <span className={status?.connected ? "text-emerald-400" : "text-amber-400"}>{status?.connected ? "Plugin connected" : "Plugin offline · changes unavailable"}</span>
                <span>Last sync: {displayDate(status?.lastDataSync)}</span>
                <span>{status?.pendingMutations || 0} pending operations</span>
            </div>
            <nav className="flex gap-2 border-b border-zinc-800 pb-3">
                {["active", "queue", "history"].map(value => <HoverDiv key={value} type="INFO" onClick={() => {setTab(value); setPage(0);}} className={`px-4 py-2 text-sm capitalize ${tab === value ? "border-zinc-500 text-white" : "text-zinc-500"}`}>{value}</HoverDiv>)}
            </nav>
            <div className="my-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <MainStringInput value={vipFilter} onChange={setVipFilter} placeholder="VIP package filter" className="bg-zinc-950"/>
                <MainStringInput type="datetime-local" value={from} onChange={setFrom} aria-label="Active from" className="bg-zinc-950"/>
                <HoverDiv type="INFO" icon={<FiSearch/>} onClick={() => {setPage(0); setFilter({vip: vipFilter.trim(), from: from ? new Date(from).toISOString() : ""});}} className="px-4 py-2 text-sm">Apply filters</HoverDiv>
            </div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <MainStringInput value={playerUuid} onChange={setPlayerUuid} placeholder="Look up player UUID" className="flex-1 bg-zinc-950"/>
                <HoverDiv type="INFO" disabled={playerBusy || !playerUuid.trim()} onClick={() => void lookupPlayer()} className="px-4 py-2 text-sm">{playerBusy ? "Looking up…" : "Player details"}</HoverDiv>
            </div>
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
            {notice && <p role="status" className="mb-4 text-sm text-emerald-400">{notice}</p>}
            <ResourceList className="overflow-hidden">
                {loading ? <RowsLoading/> : <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-zinc-800 text-xs text-zinc-500"><tr>{["Player", "Package", "Duration at sync", "Server", tab === "history" ? "Event" : "Expires", "Actions"].map(label => <th key={label} className="px-4 py-3 font-normal">{label}</th>)}</tr></thead>
                        <tbody className="divide-y divide-zinc-800/70">
                            {data?.content.map(row => <tr key={row.id} className="align-top hover:bg-zinc-900/70">
                                <td className="px-4 py-4"><p>{row.player?.name || row.playerName}</p><p className="mt-1 text-[10px] text-zinc-600">{row.player?.uuid || row.playerUuid}</p></td>
                                <td className="px-4 py-4">{row.vipName}{row.hasQueue && <p className="mt-1 text-xs text-amber-400">Has queued VIP</p>}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-zinc-400">{durationText(row.durationSeconds)}</td>
                                <td className="px-4 py-4 text-zinc-500">{row.serverName || row.sourceServer}</td>
                                <td className="px-4 py-4 text-xs text-zinc-500">{tab === "history" ? `${row.state} · ${row.activationReason}` : displayDate(row.expiresAt)}<p className="mt-1">{displayDate(row.activeFrom || row.activatedAt)}</p></td>
                                <td className="px-4 py-4">{tab !== "history" && <div className="flex gap-2"><HoverDiv type="INFO" disabled={!status?.connected} onClick={() => openMutation("update", row)} className="px-2 py-1 text-xs">Edit</HoverDiv><DeleteButton  disabled={!status?.connected} onClick={() => openMutation("remove", row)} className="px-2 py-1 text-xs">Remove</DeleteButton></div>}</td>
                            </tr>)}
                        </tbody>
                    </table>
                    {!data?.content.length && <p className="p-10 text-center text-sm text-zinc-500">No VIP records for these filters.</p>}
                </div>}
            <Pagination
                page={page + 1}
                pages={data?.totalPages ?? 1}
                disabled={loading || !data}
                onChange={(nextPage) => setPage(nextPage - 1)}
            />
            </ResourceList>

            {mutation && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                <section role="dialog" aria-modal="true" aria-label="Change VIP" className="w-full max-w-md rounded border border-zinc-700 bg-zinc-950 p-6">
                    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold capitalize">{mutation.mode} VIP</h2><HoverDiv type="INFO" icon={<FiX/>} disabled={mutationBusy} onClick={() => setMutation(null)} aria-label="Close" className="p-2"/></div>
                    <div className="mt-5 space-y-3">
                        <MainStringInput value={mutation.uuid} onChange={uuid => setMutation({...mutation, uuid})} placeholder="Player UUID" disabled={mutationBusy || mutation.mode !== "add"} className="bg-zinc-900"/>
                        <MainStringInput value={mutation.vip} onChange={vip => setMutation({...mutation, vip})} placeholder="VIP package name" disabled={mutationBusy || mutation.mode !== "add"} className="bg-zinc-900"/>
                        {mutation.mode !== "remove" && <><MainStringInput value={mutation.duration} onChange={duration => setMutation({...mutation, duration})} placeholder={mutation.mode === "add" ? "Duration: 30d, 2h, or seconds (optional)" : "New remaining duration: 30d or seconds"} disabled={mutationBusy} className="bg-zinc-900"/><p className="text-xs text-zinc-500">{mutation.mode === "add" ? "Leave duration blank to use the package default." : "This sets the remaining time; it does not add time."}</p></>}
                        {mutation.mode === "add" && <label className="flex items-center gap-2 text-xs text-zinc-400"><SelectionInput type="checkbox" checked={mutation.silent} onChange={event => setMutation({...mutation, silent: event.target.checked})} disabled={mutationBusy}/>Silent activation</label>}
                        {mutation.mode === "remove" && <p className="text-sm text-zinc-400">Remove this VIP from the player? The plugin must confirm the removal.</p>}
                        {mutationError && <p role="alert" className="text-sm text-red-400">{mutationError}</p>}
                        <HoverDiv type={mutation.mode === "remove" ? "DELETE" : "SAVE"} disabled={mutationBusy} onClick={() => void submitMutation()} className="w-full px-4 py-3 text-sm">{mutationBusy ? "Waiting for plugin…" : `Confirm ${mutation.mode}`}</HoverDiv>
                    </div>
                </section>
            </div>}
            {player && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPlayer(null)}>
                <section role="dialog" aria-modal="true" aria-label="Player VIP details" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded border border-zinc-700 bg-zinc-950 p-6" onClick={event => event.stopPropagation()}>
                    <div className="flex justify-between"><div><h2 className="text-lg font-semibold">{player.player.name}</h2><p className="mt-1 break-all text-xs text-zinc-500">{player.player.uuid}</p></div><HoverDiv type="INFO" icon={<FiX/>} onClick={() => setPlayer(null)} aria-label="Close" className="p-2"/></div>
                    {(["active", "queue", "history"] as const).map(group => <section key={group} className="mt-5 border-t border-zinc-800 pt-4"><h3 className="text-xs uppercase text-zinc-500">{group} · {player[group].length}</h3>{player[group].map(row => <div key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-zinc-900 py-3 text-sm"><span>{row.vipName}</span><span className="text-zinc-500">{durationText(row.durationSeconds)} · {row.state || displayDate(row.expiresAt)}</span></div>)}{!player[group].length && <p className="mt-3 text-xs text-zinc-600">No records.</p>}</section>)}
                </section>
            </div>}
        </main>
    );
}

export default function PcvDashboard() {
    return <ApiKeyAccess title="PlaycoreVIP" description="Use your PCV API key to manage active VIPs, queued packages, and activation history." statusPath="/v1/pcv/admin/status">
        {(key, logout) => <Dashboard apiKey={key} logout={logout}/>}
    </ApiKeyAccess>;
}
