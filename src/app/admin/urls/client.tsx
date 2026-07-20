"use client";

import { useCallback, useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { getAdminUrls, getUserShortUrlLogs } from "@/lib/apiGetters";
import { ShortUrlDto, ShortUrlLog } from "@/types/url";
import { UserObj } from "@/types/user";
import { errorToast, infoToast, okToast } from "@/lib/client";
import { useUser } from "@/hooks/useUser";
import { createShortUrl } from "@/lib/apiPoster";
import {
    FaRotateRight,
    FaChevronLeft,
    FaChevronRight,
    FaTrash
} from "react-icons/fa6";
import {
    FaExternalLinkAlt,
    FaRegCopy,
    FaTimes,
    FaHistory
} from "react-icons/fa";

interface UrlsClientProps {
    users: UserObj[];
}

export default function UrlsClient({ users }: UrlsClientProps) {
    const { setPage } = usePage();
    const { user } = useUser();

    const [urls, setUrls] = useState<ShortUrlDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPageIdx] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    // URL Modal states
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [originalUrl, setOriginalUrl] = useState("");
    const [customUid, setCustomUid] = useState("");
    const [creatingUrl, setCreatingUrl] = useState(false);

    // Logs Modal states
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [selectedUrl, setSelectedUrl] = useState<ShortUrlDto | null>(null);
    const [urlLogs, setUrlLogs] = useState<ShortUrlLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logsSearch, setLogsSearch] = useState("");

    // Filters state
    const [uniqueId, setUniqueId] = useState("");
    const [minVisits, setMinVisits] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiredFilter, setExpiredFilter] = useState("");

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

    const fetchUrls = useCallback(async (targetPage = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", String(targetPage - 1));
            params.append("size", String(pageSize));

            if (uniqueId.trim()) {
                params.append("uniqueId", uniqueId.trim());
            }
            if (minVisits.trim()) {
                params.append("minVisits", minVisits.trim());
            }
            if (maxUses.trim()) {
                params.append("maxUses", maxUses.trim());
            }
            if (expiredFilter) {
                params.append("expired", expiredFilter);
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

            const res = await getAdminUrls(params.toString());
            if (res && !res.error && res.data) {
                const paged = res.data;
                setUrls(paged.content || []);
                setTotalElements(paged.totalElements || 0);
                setTotalPages(paged.totalPages || 1);
            } else {
                setUrls([]);
                setTotalElements(0);
                setTotalPages(1);
                if (res && res.error && res.message !== "Resource not found") {
                    errorToast(res.message || "Failed to load URLs");
                }
            }
        } catch (e: any) {
            errorToast(e?.message || "Failed to load URLs");
            setUrls([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, timeFilterMode, fromDate, fromTime, toDate, toTime, exactDate, dayDate, dayStartTime, dayEndTime, includedUsers, excludedUsers, uniqueId, minVisits, maxUses, expiredFilter]);

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalUrl.trim()) {
            errorToast("Original URL is required!");
            return;
        }
        if (!originalUrl.trim().startsWith("http://") && !originalUrl.trim().startsWith("https://")) {
            errorToast("URL must start with http:// or https://");
            return;
        }
        if (!user?.apiKey) {
            errorToast("Missing API Key!");
            return;
        }

        setCreatingUrl(true);
        try {
            const data = await createShortUrl(originalUrl.trim(), user.apiKey, customUid.trim() ? customUid.trim() : null);
            if (!data) {
                errorToast("Failed to shorten URL");
                return;
            }
            okToast("URL shortened successfully!");
            setIsUrlModalOpen(false);
            setOriginalUrl("");
            setCustomUid("");
            fetchUrls(1);
        } catch (err: any) {
            errorToast(err?.message || "URL shortening failed");
        } finally {
            setCreatingUrl(false);
        }
    };

    const handleViewLogs = async (urlObj: ShortUrlDto) => {
        setSelectedUrl(urlObj);
        setIsLogsModalOpen(true);
        setLoadingLogs(true);
        setUrlLogs([]);
        setLogsSearch("");
        try {
            const data = await getUserShortUrlLogs(urlObj.uniqueId);
            if (Array.isArray(data)) {
                setUrlLogs(data);
            } else {
                setUrlLogs([]);
            }
        } catch (err: any) {
            console.error("Failed to fetch logs:", err);
            setUrlLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const filteredLogs = urlLogs.filter(log => {
        const query = logsSearch.toLowerCase();
        return (
            (log.ipAddress && log.ipAddress.toLowerCase().includes(query)) ||
            (log.userAgent && log.userAgent.toLowerCase().includes(query)) ||
            (log.time && log.time.toLowerCase().includes(query))
        );
    });

    useEffect(() => {
        setPage("urls");
    }, [setPage]);

    useEffect(() => {
        fetchUrls();
    }, [page, pageSize, expiredFilter]);

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
        setMinVisits("");
        setMaxUses("");
        setExpiredFilter("");
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

    const deleteUrl = async (u: ShortUrlDto) => {
        const ok = window.confirm(`Delete short URL code "${u.uniqueId}"?`);
        if (!ok) return;
        try {
            const deleteTarget = u.urlSet.deleteUrl || `/v1/url/get/${u.uniqueId}`;
            const resp = await fetch(deleteTarget, {
                method: "DELETE",
                headers: user?.apiKey ? { "X-API-Key": user.apiKey } : {}
            });
            if (!resp.ok) throw new Error("Delete failed");
            infoToast("Short URL deleted");
            fetchUrls();
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
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Admin URLs</h1>
                        <p className="text-sm text-gray-400">Total Found: {totalElements}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsUrlModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/30 transition-colors text-xs font-semibold"
                        >
                            Shorten URL
                        </button>
                        <button
                            onClick={() => fetchUrls()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-primary hover:bg-secondary transition-colors text-sm font-medium"
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
                            className="w-32 rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-gray-500"
                        />

                        {/* Users Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary text-xs font-medium text-gray-200 flex items-center gap-1.5 focus:outline-none"
                            >
                                <span>Users ({includedUsers.length + excludedUsers.length})</span>
                                <span className="text-[10px] text-gray-400">▼</span>
                            </button>
                            {userDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-1 w-56 rounded-lg border border-white/10 bg-primary1 shadow-xl z-40 max-h-60 overflow-y-auto p-1 divide-y divide-white/5">
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
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary text-xs font-medium text-gray-200 flex items-center gap-1.5 focus:outline-none"
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

                        {/* Min Visits */}
                        <input
                            type="number"
                            placeholder="Min Visits..."
                            value={minVisits}
                            onChange={e => setMinVisits(e.target.value)}
                            className="w-24 rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-gray-500"
                        />

                        {/* Max Uses */}
                        <input
                            type="number"
                            placeholder="Max Uses..."
                            value={maxUses}
                            onChange={e => setMaxUses(e.target.value)}
                            className="w-24 rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-gray-500"
                        />

                        {/* Expiration status */}
                        <select
                            value={expiredFilter}
                            onChange={e => setExpiredFilter(e.target.value)}
                            className="rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        >
                            <option value="">Expiration...</option>
                            <option value="false">Active</option>
                            <option value="true">Expired</option>
                        </select>

                        {/* Search and Reset button */}
                        <div className="flex gap-1.5 ml-auto">
                            <button
                                onClick={resetFilters}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary text-xs font-medium transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => { setPageIdx(1); fetchUrls(1); }}
                                className="px-3 py-1.5 rounded-lg bg-primary_light/25 hover:bg-primary_light/35 border border-primary_light/40 text-xs font-medium transition-colors"
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
                            <div key={i} className="box-primary p-2 animate-pulse">
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
                    ) : urls.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-gray-400">
                            No URLs found matching the filters.
                        </div>
                    ) : (
                        urls.map((u) => {
                            const portalUrl = u.urlSet.portalUrl || u.urlSet.webUrl || u.urlSet.shortUrl || "";
                            return (
                                <div key={u.uniqueId} className="box-primary p-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="min-w-0 flex flex-col gap-1">
                                                <div className="text-white font-semibold truncate flex gap-2 items-center">
                                                    <span>/{u.uniqueId}</span>
                                                    <span className="text-xs text-gray-400 font-normal truncate max-w-[200px] md:max-w-md" title={u.originalUrl}>
                                                        → {u.originalUrl}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                                                    <span>Visits: <strong className="text-white">{u.visits}</strong></span>
                                                    <span className="text-gray-500">•</span>
                                                    <span>Max Uses: <strong className="text-white">{u.maxUses === -1 ? "Unlimited" : u.maxUses}</strong></span>
                                                    <span className="text-gray-500">•</span>
                                                    <span>Expires: <strong className="text-white">{u.expiresAt ? formatDate(u.expiresAt) : "Never"}</strong></span>
                                                    <span className="text-gray-500">•</span>
                                                    <span>Created: {formatDate(u.createdAt)}</span>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="flex items-center gap-1">
                                                        uploader:
                                                        {u.uploader ? (
                                                            <span className="text-white font-medium">
                                                                {u.uploader.username}
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
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-white/10 bg-primary1 hover:bg-primary0 transition-colors disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                    title="Open Link"
                                                >
                                                    <FaExternalLinkAlt className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => copy(portalUrl)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-white/10 bg-primary1 hover:bg-primary0 transition-colors disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                    title="Copy Link"
                                                >
                                                    <FaRegCopy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewLogs(u)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-white/10 bg-primary1 hover:bg-primary0 text-gray-300 hover:text-white transition-colors"
                                                    title="View Access History"
                                                >
                                                    <FaHistory className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteUrl(u)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-red-500/30 bg-red-600/10 hover:bg-red-600/15 text-red-300 transition-colors"
                                                    title="Delete URL"
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
                                        className="rounded border border-white/10 bg-primary px-2 py-0.5 text-xs focus:outline-none text-gray-300"
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
                                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary disabled:opacity-40 disabled:hover:bg-primary transition-colors text-xs flex items-center gap-1.5"
                                >
                                    <FaChevronLeft className="h-3 w-3" />
                                    <span>Prev</span>
                                </button>
                                <button
                                    onClick={() => setPageIdx((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary disabled:opacity-40 disabled:hover:bg-primary transition-colors text-xs flex items-center gap-1.5"
                                >
                                    <span>Next</span>
                                    <FaChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* URL Modal */}
            {isUrlModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-md bg-primary2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                            <div>
                                <h2 className="text-base font-semibold text-white">Shorten URL</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Create a shortened redirect link</p>
                            </div>
                            <button
                                onClick={() => { if (!creatingUrl) { setIsUrlModalOpen(false); setOriginalUrl(""); setCustomUid(""); } }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                                disabled={creatingUrl}
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <form onSubmit={handleUrlSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Original URL <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/some/long/path"
                                    value={originalUrl}
                                    onChange={(e) => setOriginalUrl(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 placeholder-gray-600 transition-colors"
                                    required
                                    disabled={creatingUrl}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Custom UID</label>
                                <input
                                    type="text"
                                    placeholder="Optional custom alias..."
                                    value={customUid}
                                    onChange={(e) => setCustomUid(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 placeholder-gray-600 transition-colors"
                                    disabled={creatingUrl}
                                />
                            </div>

                            {originalUrl.trim() && !originalUrl.trim().startsWith("http") && (
                                <p className="text-[11px] text-amber-500 flex items-center gap-1">
                                    <span>⚠</span> URL should start with https:// or http://
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setIsUrlModalOpen(false); setOriginalUrl(""); setCustomUid(""); }}
                                    className="px-4 py-2 rounded-lg text-sm border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    disabled={creatingUrl}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-medium transition-colors"
                                    disabled={creatingUrl || !originalUrl.trim()}
                                >
                                    {creatingUrl ? "Shortening…" : "Shorten URL"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logs / History Modal */}
            {isLogsModalOpen && selectedUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-2xl bg-primary2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                            <div>
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <FaHistory className="text-telegram text-sm" />
                                    <span>Access Logs: /{selectedUrl.uniqueId}</span>
                                </h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Showing redirect usage history for this short link
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsLogsModalOpen(false);
                                    setSelectedUrl(null);
                                    setUrlLogs([]);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Search / Filter Bar */}
                        <div className="p-4 bg-primary3/40 border-b border-white/[0.05]">
                            <input
                                type="text"
                                placeholder="Filter logs by IP, User Agent or Date..."
                                value={logsSearch}
                                onChange={(e) => setLogsSearch(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-primary3 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/25 placeholder-gray-600 transition-colors"
                            />
                        </div>

                        {/* Logs List Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {loadingLogs ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] animate-pulse space-y-2">
                                            <div className="h-3 w-1/4 bg-white/10 rounded" />
                                            <div className="h-3 w-3/4 bg-white/5 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="text-center py-12 text-sm text-gray-500">
                                    {urlLogs.length === 0 ? "No redirect access logged yet." : "No logs match the filter."}
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {filteredLogs.map((log, index) => (
                                        <div key={index} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
                                            <div className="space-y-1 min-w-0 w-full">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                                        {log.ipAddress || "Unknown IP"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {log.time ? formatDate(log.time) : "Unknown Date"}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 font-mono text-[10.5px] break-all leading-normal pt-1.5" title={log.userAgent}>
                                                    {log.userAgent || "No User Agent"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-white/[0.07] bg-primary3/20 flex justify-between items-center text-[10px] text-gray-500">
                            <span>Total logged redirects: <strong>{urlLogs.length}</strong></span>
                            {filteredLogs.length !== urlLogs.length && (
                                <span>Showing <strong>{filteredLogs.length}</strong> matches</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
