"use client";

import { useCallback, useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { getAdminPastes } from "@/lib/apiGetters";
import { PasteDto } from "@/types/paste";
import { UserObj } from "@/types/user";
import { errorToast, infoToast, okToast } from "@/lib/client";
import { useUser } from "@/hooks/useUser";
import { createPaste } from "@/lib/apiPoster";
import {
    FaLock,
    FaRotateRight,
    FaChevronLeft,
    FaChevronRight,
    FaTrash
} from "react-icons/fa6";
import {
    FaExternalLinkAlt,
    FaRegCopy,
    FaTimes
} from "react-icons/fa";

interface PastesClientProps {
    users: UserObj[];
}

export default function PastesClient({ users }: PastesClientProps) {
    const { setPage } = usePage();
    const { user } = useUser();

    const [pastes, setPastes] = useState<PasteDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPageIdx] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    // Paste Modal states
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteTitle, setPasteTitle] = useState("");
    const [pasteContent, setPasteContent] = useState("");
    const [creatingPaste, setCreatingPaste] = useState(false);

    // Filters state
    const [uniqueId, setUniqueId] = useState("");
    const [timeFilterMode, setTimeFilterMode] = useState<"range" | "exact" | "time-day">("range");
    const [fromDate, setFromDate] = useState("");
    const [fromTime, setFromTime] = useState("");
    const [toDate, setToDate] = useState("");
    const [toTime, setToTime] = useState("");
    const [exactDate, setExactDate] = useState("");
    const [dayDate, setDayDate] = useState("");
    const [dayStartTime, setDayStartTime] = useState("");
    const [dayEndTime, setDayEndTime] = useState("");

    const [includedUsers, setIncludedUsers] = useState<UserObj[]>([]);
    const [excludedUsers, setExcludedUsers] = useState<UserObj[]>([]);

    // Dropdown open states
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

    const fetchPastes = useCallback(async (targetPage = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", String(targetPage - 1));
            params.append("size", String(pageSize));

            if (uniqueId.trim()) {
                params.append("uniqueId", uniqueId.trim());
            }

            let fromStr: string | undefined;
            let toStr: string | undefined;

            if (timeFilterMode === "range") {
                if (fromDate) {
                    fromStr = `${fromDate}T${fromTime ? fromTime + ":00" : "00:00:00"}`;
                }
                if (toDate) {
                    toStr = `${toDate}T${toTime ? toTime + ":00" : "23:59:59"}`;
                }
            } else if (timeFilterMode === "exact") {
                if (exactDate) {
                    fromStr = `${exactDate}T00:00:00`;
                    toStr = `${exactDate}T23:59:59`;
                }
            } else if (timeFilterMode === "time-day") {
                if (dayDate) {
                    fromStr = `${dayDate}T${dayStartTime ? dayStartTime + ":00" : "00:00:00"}`;
                    toStr = `${dayDate}T${dayEndTime ? dayEndTime + ":00" : "23:59:59"}`;
                }
            }

            if (fromStr) params.append("from", fromStr);
            if (toStr) params.append("to", toStr);

            if (includedUsers.length > 0) {
                params.append("includeUsers", includedUsers.map(u => u.uid).join(","));
            }
            if (excludedUsers.length > 0) {
                params.append("excludeUsers", excludedUsers.map(u => u.uid).join(","));
            }

            const res = await getAdminPastes(params.toString());
            if (res && !res.error && res.data) {
                const paged = res.data;
                setPastes(paged.content || []);
                setTotalElements(paged.totalElements || 0);
                setTotalPages(paged.totalPages || 1);
            } else {
                setPastes([]);
                setTotalElements(0);
                setTotalPages(1);
                if (res && res.error && res.message !== "Resource not found") {
                    errorToast(res.message || "Failed to load pastes");
                }
            }
        } catch (e: any) {
            errorToast(e?.message || "Failed to load pastes");
            setPastes([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, timeFilterMode, fromDate, fromTime, toDate, toTime, exactDate, dayDate, dayStartTime, dayEndTime, includedUsers, excludedUsers, uniqueId]);

    const handlePasteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pasteContent.trim()) {
            errorToast("Paste content is required!");
            return;
        }
        if (!user?.apiKey) {
            errorToast("Missing API Key!");
            return;
        }

        setCreatingPaste(true);
        try {
            const data = await createPaste(pasteTitle.trim() || "Untitled Paste", pasteContent, user.apiKey);
            if (!data) {
                errorToast("Failed to create paste");
                return;
            }
            okToast("Paste created successfully!");
            setIsPasteModalOpen(false);
            setPasteTitle("");
            setPasteContent("");
            fetchPastes(1);
        } catch (err: any) {
            errorToast(err?.message || "Paste creation failed");
        } finally {
            setCreatingPaste(false);
        }
    };

    useEffect(() => {
        setPage("pastes");
    }, [setPage]);

    useEffect(() => {
        fetchPastes();
    }, [page, pageSize]);

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isPasteModalOpen && !creatingPaste) {
                    setIsPasteModalOpen(false);
                    setPasteTitle("");
                    setPasteContent("");
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPasteModalOpen, creatingPaste]);

    const handleAddUserFilter = (u: UserObj, mode: "include" | "exclude") => {
        if (mode === "include") {
            const isInc = includedUsers.some(x => x.uid === u.uid);
            if (isInc) {
                setIncludedUsers(includedUsers.filter(x => x.uid !== u.uid));
            } else {
                setIncludedUsers([...includedUsers, u]);
                setExcludedUsers(excludedUsers.filter(x => x.uid !== u.uid));
            }
        } else {
            const isExc = excludedUsers.some(x => x.uid === u.uid);
            if (isExc) {
                setExcludedUsers(excludedUsers.filter(x => x.uid !== u.uid));
            } else {
                setExcludedUsers([...excludedUsers, u]);
                setIncludedUsers(includedUsers.filter(x => x.uid !== u.uid));
            }
        }
    };

    const removeUserFilter = (uid: number, mode: "include" | "exclude") => {
        if (mode === "include") {
            setIncludedUsers(includedUsers.filter(u => u.uid !== uid));
        } else {
            setExcludedUsers(excludedUsers.filter(u => u.uid !== uid));
        }
    };

    const resetFilters = () => {
        setUniqueId("");
        setFromDate("");
        setFromTime("");
        setToDate("");
        setToTime("");
        setExactDate("");
        setDayDate("");
        setDayStartTime("");
        setDayEndTime("");
        setIncludedUsers([]);
        setExcludedUsers([]);
    };

    const copy = async (text: string | null | undefined) => {
        if (!text) {
            errorToast("No URL to copy");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            infoToast("Copied");
        } catch {
            errorToast("Copy failed");
        }
    };

    const deletePaste = async (p: PasteDto) => {
        const ok = window.confirm(`Delete paste "${p.title || p.uniqueId}"?`);
        if (!ok) return;
        try {
            const deleteTarget = p.urlSet.deleteUrl || `/v1/paste/get/${p.uniqueId}`;
            const resp = await fetch(deleteTarget, {
                method: "DELETE",
                headers: user?.apiKey ? { "X-API-Key": user.apiKey } : {}
            });
            if (!resp.ok) throw new Error("Delete failed");
            infoToast("Paste deleted");
            fetchPastes();
        } catch (e: any) {
            errorToast(e?.message ?? "Delete failed");
        }
    };

    const formatDate = (iso?: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString();
    };

    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
            <div className="max-w-[90rem] mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pt-5 pb-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Admin Pastes</h1>
                        <p className="text-sm text-gray-400">Total Found: {totalElements}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPasteModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-emerald-600/40 hover:border-emerald-500 hover:in-shadow bg-primary1 text-emerald-300 transition-all duration-200 text-xs font-semibold"
                        >
                            New Paste
                        </button>
                        <button
                            onClick={() => fetchPastes()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                            disabled={loading}
                            title="Refresh List"
                        >
                            <FaRotateRight className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Compact Filters Panel */}
                <div className="flex flex-col gap-1.5">
                    <div className="box-primary p-3 flex flex-wrap items-center gap-3 text-xs">
                        {/* Search uniqueId */}
                        <input
                            type="text"
                            placeholder="Search ID..."
                            value={uniqueId}
                            onChange={e => setUniqueId(e.target.value)}
                            className="w-36 rounded border-2 border-zinc-800 bg-primary1 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 placeholder-gray-500"
                        />

                        {/* Users Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 flex items-center gap-1.5 focus:outline-none transition-all duration-200"
                            >
                                <span>Users ({includedUsers.length + excludedUsers.length})</span>
                                <span className="text-[10px] text-gray-400">▼</span>
                            </button>
                            {userDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-1 w-56 rounded-lg border-2 border-zinc-800 bg-primary1 shadow-xl z-40 max-h-60 overflow-y-auto p-1 divide-y divide-white/5">
                                        {users.length === 0 ? (
                                            <div className="p-2 text-xs text-gray-500 text-center">No users available</div>
                                        ) : (
                                            users.map(u => {
                                                const isInc = includedUsers.some(x => x.uid === u.uid);
                                                const isExc = excludedUsers.some(x => x.uid === u.uid);
                                                return (
                                                    <div key={u.uid} className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white/5 text-xs gap-2">
                                                        <span className="text-gray-300 truncate">{u.username}</span>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddUserFilter(u, "include")}
                                                                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${isInc ? "bg-emerald-600 text-white" : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/35"}`}
                                                                title="Include User"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddUserFilter(u, "exclude")}
                                                                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${isExc ? "bg-rose-600 text-white" : "bg-rose-600/20 text-rose-300 hover:bg-rose-600/35"}`}
                                                                title="Exclude User"
                                                            >
                                                                -
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Time Filter Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 flex items-center gap-1.5 focus:outline-none transition-all duration-200"
                            >
                                <span>Time: {timeFilterMode === "range" ? "Range" : timeFilterMode === "exact" ? "Exact" : "One Day"}</span>
                                <span className="text-[10px] text-gray-400">▼</span>
                            </button>
                            {timeDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setTimeDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-1 w-72 rounded-lg border border-white/10 bg-primary1 shadow-xl z-40 p-3 space-y-3">
                                        <div className="flex gap-1 border-b border-white/5 pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setTimeFilterMode("range")}
                                                className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition-colors ${timeFilterMode === "range" ? "bg-primary_light/20 text-white" : "text-gray-400"}`}
                                            >
                                                Range
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTimeFilterMode("exact")}
                                                className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition-colors ${timeFilterMode === "exact" ? "bg-primary_light/20 text-white" : "text-gray-400"}`}
                                            >
                                                Exact Date
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTimeFilterMode("time-day")}
                                                className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition-colors ${timeFilterMode === "time-day" ? "bg-primary_light/20 text-white" : "text-gray-400"}`}
                                            >
                                                One Day
                                            </button>
                                        </div>

                                        {timeFilterMode === "range" && (
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">From Date</span>
                                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">From Time</span>
                                                    <input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">To Date</span>
                                                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">To Time</span>
                                                    <input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                            </div>
                                        )}

                                        {timeFilterMode === "exact" && (
                                            <div className="text-[10px]">
                                                <span className="text-gray-400 block mb-0.5">Date</span>
                                                <input type="date" value={exactDate} onChange={e => setExactDate(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                            </div>
                                        )}

                                        {timeFilterMode === "time-day" && (
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div className="col-span-2">
                                                    <span className="text-gray-400 block mb-0.5">Date</span>
                                                    <input type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">Start Time</span>
                                                    <input type="time" value={dayStartTime} onChange={e => setDayStartTime(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">End Time</span>
                                                    <input type="time" value={dayEndTime} onChange={e => setDayEndTime(e.target.value)} className="w-full rounded border border-white/10 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-1.5 pt-1.5 border-t border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFromDate(""); setFromTime(""); setToDate(""); setToTime("");
                                                    setExactDate(""); setDayDate(""); setDayStartTime(""); setDayEndTime("");
                                                }}
                                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-medium transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search and Reset button */}
                        <div className="flex gap-1.5 ml-auto">
                            <button
                                onClick={resetFilters}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => { setPageIdx(1); fetchPastes(1); }}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Filter Badges */}
                    {(includedUsers.length > 0 || excludedUsers.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 text-[10px] px-1">
                            {includedUsers.map(u => (
                                <span key={`inc-${u.uid}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    <span>+ {u.username}</span>
                                    <button onClick={() => removeUserFilter(u.uid, "include")} className="hover:text-white">×</button>
                                </span>
                            ))}
                            {excludedUsers.map(u => (
                                <span key={`exc-${u.uid}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                    <span>- {u.username}</span>
                                    <button onClick={() => removeUserFilter(u.uid, "exclude")} className="hover:text-white">×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="flex flex-col box-primary p-3 md:p-4 gap-3">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border-2 border-zinc-800 bg-primary1 p-3 animate-pulse">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div className="min-w-0 flex flex-col gap-1 w-full">
                                            <div className="h-4 w-1/3 bg-white/10 rounded" />
                                            <div className="h-3 w-1/2 bg-white/5 rounded mt-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : pastes.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-gray-400">
                            No pastes found matching the filters.
                        </div>
                    ) : (
                        pastes.map((p) => {
                            const portalUrl = p.urlSet.portalUrl || p.urlSet.webUrl || p.urlSet.shortUrl || "";
                            return (
                                <div key={p.uniqueId} className="rounded-xl border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 p-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="min-w-0 flex flex-col gap-1">
                                                <div className="text-white font-semibold truncate flex gap-2 items-center">
                                                    {p.title || p.uniqueId}
                                                    {!p.isPublic && (
                                                        <span className="text-xs text-amber-400" title="Private">
                                                            <FaLock />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                                                    <span>ID: {p.uniqueId}</span>
                                                    <span className="text-gray-500">•</span>
                                                    <span>Created: {formatDate(p.createdAt)}</span>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="flex items-center gap-1">
                                                        uploader:
                                                        {p.uploader ? (
                                                            <span className="text-white font-medium">
                                                                {p.uploader.username}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500">System</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => (portalUrl ? window.open(portalUrl, "_blank") : null)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-gray-200 disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                    title="Open Link"
                                                >
                                                    <FaExternalLinkAlt className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => copy(portalUrl)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-gray-200 disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                    title="Copy Link"
                                                >
                                                    <FaRegCopy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deletePaste(p)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-600/10 transition-all duration-200 text-red-300"
                                                    title="Delete Paste"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="w-full border-t border-white/10 pt-4 mt-2 flex items-center justify-between text-sm text-gray-300">
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-gray-400">
                                    Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Page size</span>
                                    <select
                                        className="rounded border-2 border-zinc-800 bg-primary1 px-2 py-0.5 text-xs focus:outline-none text-gray-300"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPageIdx(1);
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPageIdx((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200 text-xs flex items-center gap-1.5 text-gray-200"
                                >
                                    <FaChevronLeft className="h-3 w-3" />
                                    <span>Prev</span>
                                </button>
                                <button
                                    onClick={() => setPageIdx((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200 text-xs flex items-center gap-1.5 text-gray-200"
                                >
                                    <span>Next</span>
                                    <FaChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Paste Modal */}
            {isPasteModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in cursor-pointer"
                    onClick={() => { if (!creatingPaste) { setIsPasteModalOpen(false); setPasteTitle(""); setPasteContent(""); } }}
                >
                    <div 
                        className="w-full max-w-lg bg-primary1 border-2 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                            <div>
                                <h2 className="text-base font-semibold text-white">Create Paste</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Create a new text paste</p>
                            </div>
                            <button
                                onClick={() => { if (!creatingPaste) { setIsPasteModalOpen(false); setPasteTitle(""); setPasteContent(""); } }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                                disabled={creatingPaste}
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <form onSubmit={handlePasteSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Title</label>
                                <input
                                    type="text"
                                    placeholder="Optional title..."
                                    value={pasteTitle}
                                    onChange={(e) => setPasteTitle(e.target.value)}
                                    className="w-full rounded-lg border-2 border-zinc-800 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-gray-600 transition-colors"
                                    disabled={creatingPaste}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Content <span className="text-red-500">*</span></label>
                                <textarea
                                    placeholder="Type or paste your content here..."
                                    value={pasteContent}
                                    onChange={(e) => setPasteContent(e.target.value)}
                                    rows={9}
                                    className="w-full rounded-lg border-2 border-zinc-800 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-gray-600 font-mono resize-y transition-colors leading-relaxed"
                                    required
                                    disabled={creatingPaste}
                                />
                                <p className="text-[11px] text-gray-600 mt-1">{pasteContent.length} chars</p>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setIsPasteModalOpen(false); setPasteTitle(""); setPasteContent(""); }}
                                    className="px-4 py-2 rounded-lg text-sm border-2 border-zinc-800 hover:border-zinc-700 bg-primary1 hover:bg-secondary text-gray-400 hover:text-white transition-all duration-200"
                                    disabled={creatingPaste}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-500/40 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-medium transition-all duration-200"
                                    disabled={creatingPaste || !pasteContent.trim()}
                                >
                                    {creatingPaste ? "Creating…" : "Create Paste"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
