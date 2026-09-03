"use client";

import { useCallback, useEffect, useState } from "react";
import { FaChevronDown, FaChevronLeft, FaChevronRight, FaFile, FaLock, FaRotateRight, FaTrash } from "react-icons/fa6";
import { usePage } from "@/context/PageContext";
import { useUser } from "@/hooks/useUser";
import { errorToast, okToast } from "@/lib/client";
import { getApiUrl } from "@/lib/core";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import type { UserObj } from "@/types/user";
import type { AdminFilePack } from "@/types/filePack";

type Props = { users: UserObj[] };

export default function FilesClient({ users }: Props) {
    const { setPage } = usePage();
    const { user } = useUser();
    const [packs, setPacks] = useState<AdminFilePack[]>([]);
    const [page, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [packId, setPackId] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [fromTime, setFromTime] = useState("");
    const [toDate, setToDate] = useState("");
    const [toTime, setToTime] = useState("");
    const [includedUsers, setIncludedUsers] = useState<UserObj[]>([]);
    const [excludedUsers, setExcludedUsers] = useState<UserObj[]>([]);
    const [usersOpen, setUsersOpen] = useState(false);

    const getPackUrl = (packId: string) => {
        if (window.location.origin.includes("space.xap3y.eu")) {
            return `https://files.xap3y.eu/${packId}`;
        }
        return `${window.location.origin}/files/pack/${packId}`;
    };

    const fetchPacks = useCallback(async (targetPage = page, filters?: { packId: string; fromDate: string; fromTime: string; toDate: string; toTime: string; includedUsers: UserObj[]; excludedUsers: UserObj[] }) => {
        setLoading(true);
        try {
            const activeFilters = filters ?? { packId, fromDate, fromTime, toDate, toTime, includedUsers, excludedUsers };
            const params = new URLSearchParams({ page: String(targetPage - 1), size: String(pageSize) });
            if (activeFilters.packId.trim()) params.set("packId", activeFilters.packId.trim());
            if (activeFilters.fromDate) params.set("from", `${activeFilters.fromDate}T${activeFilters.fromTime ? `${activeFilters.fromTime}:00` : "00:00:00"}`);
            if (activeFilters.toDate) params.set("to", `${activeFilters.toDate}T${activeFilters.toTime ? `${activeFilters.toTime}:00` : "23:59:59"}`);
            if (activeFilters.includedUsers.length) params.set("includeUsers", activeFilters.includedUsers.map(item => item.uid).join(","));
            if (activeFilters.excludedUsers.length) params.set("excludeUsers", activeFilters.excludedUsers.map(item => item.uid).join(","));
            const response = await fetch(`${getApiUrl()}/v1/admin/file-packs?${params}`, {
                credentials: "include", headers: user?.apiKey ? { "X-API-Key": user.apiKey } : {}
            });
            const body = await response.json();
            if (!response.ok || body.error) throw new Error(body.message || "Failed to load file packs");
            setPacks(body.message?.content ?? body.data?.content ?? []);
            setTotalElements(body.message?.totalElements ?? body.data?.totalElements ?? 0);
            setTotalPages(Math.max(1, body.message?.totalPages ?? body.data?.totalPages ?? 1));
        } catch (error: any) {
            errorToast(error.message || "Failed to load file packs");
            setPacks([]);
        } finally { setLoading(false); }
    }, [page, pageSize, packId, fromDate, fromTime, toDate, toTime, includedUsers, excludedUsers, user?.apiKey]);

    useEffect(() => { setPage("files"); }, [setPage]);
    useEffect(() => { fetchPacks(); }, [page, pageSize]);

    const toggleUser = (selected: UserObj, mode: "include" | "exclude") => {
        const own = mode === "include" ? includedUsers : excludedUsers;
        const other = mode === "include" ? excludedUsers : includedUsers;
        const next = own.some(item => item.uid === selected.uid) ? own.filter(item => item.uid !== selected.uid) : [...own, selected];
        if (mode === "include") { setIncludedUsers(next); setExcludedUsers(other.filter(item => item.uid !== selected.uid)); }
        else { setExcludedUsers(next); setIncludedUsers(other.filter(item => item.uid !== selected.uid)); }
    };

    const remove = async (url: string, label: string) => {
        if (!window.confirm(`Permanently delete ${label} from the database and S3 storage?`)) return;
        setBusy(url);
        try {
            const response = await fetch(`${getApiUrl()}${url}`, { method: "DELETE", credentials: "include", headers: user?.apiKey ? { "X-API-Key": user.apiKey } : {} });
            const body = await response.json().catch(() => null);
            if (!response.ok || body?.error) throw new Error(body?.message || "Delete failed");
            okToast(`${label} deleted from S3 and the database`);
            await fetchPacks();
        } catch (error: any) { errorToast(error.message || "Delete failed"); }
        finally { setBusy(null); }
    };

    const reset = () => {
        const emptyFilters = { packId: "", fromDate: "", fromTime: "", toDate: "", toTime: "", includedUsers: [], excludedUsers: [] };
        setPackId(""); setFromDate(""); setFromTime(""); setToDate(""); setToTime(""); setIncludedUsers([]); setExcludedUsers([]); setUsersOpen(false); setPageIndex(1);
        fetchPacks(1, emptyFilters);
    };
    const bytes = (value: number) => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : value < 1073741824 ? `${(value / 1048576).toFixed(1)} MB` : `${(value / 1073741824).toFixed(1)} GB`;

    return <section className="flex-1 min-w-0 px-3 md:px-6">
        <div className="mx-auto w-full max-w-[90rem] space-y-2.5">
            <div className="flex items-center justify-between pt-4 pb-0.5">
                <div className="flex items-center gap-2.5"><h1 className="text-xl font-semibold tracking-tight md:text-2xl">File Packs</h1><span className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{totalElements}</span></div>
                <HoverDiv type="INFO" className="h-8 px-2.5 text-[11px]" title="Refresh file packs" onClick={() => fetchPacks()} disabled={loading} icon={<FaRotateRight className={loading ? "animate-spin" : ""}/>}>Refresh</HoverDiv>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/75 p-1.5 text-xs shadow-[0_8px_30px_rgba(0,0,0,.16)]">
                <MainStringInput type="text" placeholder="Search pack ID" value={packId} onChange={setPackId} className="w-44 !border-zinc-800" inputClassName="px-2.5 py-1 text-[11px]" />
                <div className="relative">
                <HoverDiv type="INFO" className="h-7 px-2.5 text-[11px]" onClick={() => setUsersOpen(!usersOpen)} icon={<FaChevronDown className="text-[9px]"/>}>Users{includedUsers.length + excludedUsers.length ? ` · ${includedUsers.length + excludedUsers.length}` : ""}</HoverDiv>
                    {usersOpen && <><div className="fixed inset-0 z-30" onClick={() => setUsersOpen(false)}/><div className="absolute left-0 z-40 mt-1 w-64 rounded-lg border-2 border-zinc-800 bg-primary1 p-2 shadow-xl">
                        <p className="mb-1.5 px-1 text-[10px] text-zinc-500">+ include · − exclude</p><div className="max-h-56 overflow-y-auto">{users.map(item => <div key={item.uid} className="flex items-center justify-between px-1 py-1.5 hover:bg-white/5"><span className="truncate">{item.username}</span><div className="flex gap-1"><HoverDiv className="h-6 w-6 text-sm" type={includedUsers.some(u => u.uid === item.uid) ? "SAVE" : "INFO"} onClick={() => toggleUser(item, "include")}>+</HoverDiv><HoverDiv className="h-6 w-6 text-sm" type={excludedUsers.some(u => u.uid === item.uid) ? "DELETE" : "INFO"} onClick={() => toggleUser(item, "exclude")}>−</HoverDiv></div></div>)}</div>
                    </div></>}
                </div>
                <span className="ml-1 text-[10px] uppercase tracking-wider text-zinc-600">From</span><MainStringInput type="date" aria-label="From date" value={fromDate} onChange={setFromDate} className="w-[8.25rem] !border-zinc-800" inputClassName="px-2 py-1 text-[11px]" /><MainStringInput type="time" aria-label="From time" value={fromTime} onChange={setFromTime} className="w-[5.5rem] !border-zinc-800" inputClassName="px-2 py-1 text-[11px]" />
                <span className="ml-1 text-[10px] uppercase tracking-wider text-zinc-600">To</span><MainStringInput type="date" aria-label="To date" value={toDate} onChange={setToDate} className="w-[8.25rem] !border-zinc-800" inputClassName="px-2 py-1 text-[11px]" /><MainStringInput type="time" aria-label="To time" value={toTime} onChange={setToTime} className="w-[5.5rem] !border-zinc-800" inputClassName="px-2 py-1 text-[11px]" />
                <div className="ml-auto flex gap-1.5"><HoverDiv type="INFO" className="h-7 px-2.5 text-[11px] text-zinc-400" onClick={reset}>Clear</HoverDiv><HoverDiv type="SAVE" className="h-7 px-3 text-[11px] font-medium" onClick={() => { setPageIndex(1); fetchPacks(1); }}>Apply</HoverDiv></div>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/70 shadow-[0_12px_40px_rgba(0,0,0,.2)]">
                {packs.map((pack, index) => <article key={pack.packId} className={index ? "border-t border-zinc-800/70" : ""}>
                    <div className="flex items-center gap-1.5 px-1.5 py-1">
                        <HoverDiv type="INFO" className="grid min-w-0 flex-1 grid-cols-[minmax(15rem,1fr)_8rem_5rem_6rem_11rem] items-center justify-start gap-3 !border-0 !bg-transparent !shadow-none px-2 py-1 text-left hover:bg-white/[.035] max-lg:grid-cols-[minmax(12rem,1fr)_7rem_5rem]" onClick={() => setExpanded(expanded === pack.packId ? null : pack.packId)}>
                            <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-500/15 bg-sky-500/[.07]"><FaFile className="text-[11px] text-sky-300"/></span><div className="min-w-0"><div className="flex items-center gap-1.5"><span className="truncate font-mono text-[12px] text-zinc-200">{pack.packId}</span>{pack.isPasswordProtected && <FaLock className="shrink-0 text-[10px] text-amber-400"/>}</div><p className="truncate text-[10px] text-zinc-600">{pack.source}</p></div></div>
                            <span className="truncate text-[11px] text-zinc-400">{pack.uploader?.username ?? "Anonymous"}</span><span className="text-[11px] tabular-nums text-zinc-500">{pack.totalFiles} {pack.totalFiles === 1 ? "file" : "files"}</span><span className="text-[11px] tabular-nums text-zinc-500 max-lg:hidden">{bytes(pack.totalSize)}</span><span className="text-right text-[10px] tabular-nums text-zinc-600 max-lg:hidden">{new Date(pack.uploadTime).toLocaleString()}</span>
                        </HoverDiv>
                        <HoverDiv type="DELETE" className="h-7 w-7 shrink-0 !shadow-none text-[10px]" title={`Delete pack ${pack.packId}`} aria-label={`Delete pack ${pack.packId}`} disabled={busy !== null} onClick={() => remove(`/v1/admin/file-packs/${pack.packId}`, `pack ${pack.packId}`)} icon={<FaTrash/>}/>
                    </div>
                    {expanded === pack.packId && <div className="border-t border-zinc-800/60 bg-black/20 px-11 py-2"><p className="mb-2 text-[10px] text-zinc-500">{pack.description || "No description"}</p><div className="space-y-1">
                        {pack.files.map(file => <div key={file.uniqueId} className="flex items-center gap-3 rounded-md border border-zinc-800/70 bg-zinc-950/60 px-2.5 py-1.5"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-zinc-300">{file.fileName}</p><p className="truncate text-[10px] text-zinc-600">{file.uniqueId} · {file.fileType} · {bytes(file.size)}</p></div><HoverDiv type="DELETE" className="h-6 w-6 !shadow-none text-[9px]" title={`Delete ${file.fileName}`} disabled={busy !== null} onClick={() => remove(`/v1/admin/file-packs/${pack.packId}/files/${file.uniqueId}`, `file ${file.fileName}`)} icon={<FaTrash/>}/></div>)}
                    </div></div>}
                </article>)}
                {!loading && packs.length === 0 && <div className="p-10 text-center text-sm text-zinc-500">No file packs match these filters.</div>}
            </div>
            <div className="flex items-center justify-between pb-4 pt-0.5"><select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPageIndex(1); }} className="h-7 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-[10px] text-zinc-400 outline-none"><option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option></select><div className="flex items-center gap-1.5"><HoverDiv type="INFO" className="h-7 w-7 text-[9px]" disabled={page <= 1 || loading} onClick={() => setPageIndex(page - 1)} icon={<FaChevronLeft/>}/><span className="min-w-20 text-center text-[10px] text-zinc-500">{page} / {totalPages}</span><HoverDiv type="INFO" className="h-7 w-7 text-[9px]" disabled={page >= totalPages || loading} onClick={() => setPageIndex(page + 1)} icon={<FaChevronRight/>}/></div></div>
        </div>
    </section>;
}
