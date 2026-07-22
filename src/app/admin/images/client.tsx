"use client";

import { useCallback, useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { getAdminImages, migrateAdminImage } from "@/lib/apiGetters";
import { UploadedImage } from "@/types/image";
import { UserObj } from "@/types/user";
import {
    FaExternalLinkAlt,
    FaRegCopy,
    FaTimes
} from "react-icons/fa";
import { CallServerEnum, callServers } from "@/config/global";
import { errorToast, infoToast, okToast, uploadImage, uploadImageBucket } from "@/lib/client";
import { useUser } from "@/hooks/useUser";
import {
    FaLock,
    FaRotateRight,
    FaChevronLeft,
    FaChevronRight,
    FaTrash
} from "react-icons/fa6";

interface ImagesClientProps {
    users: UserObj[];
}

export default function ImagesClient({ users }: ImagesClientProps) {
    const { setPage } = usePage();
    const { user } = useUser();

    const [images, setImages] = useState<UploadedImage[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPageIdx] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [migratingId, setMigratingId] = useState<string | null>(null);

    // Upload Modal states
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadDesc, setUploadDesc] = useState("");
    const [uploadPass, setUploadPass] = useState("");
    const [uploadCustomUid, setUploadCustomUid] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingState, setUploadingState] = useState(false);

    // Enlarge Lightbox modal state
    const [enlargedImage, setEnlargedImage] = useState<UploadedImage | null>(null);

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (enlargedImage) setEnlargedImage(null);
                if (isUploadModalOpen && !uploadingState) {
                    setIsUploadModalOpen(false);
                    setUploadFile(null);
                    setUploadDesc("");
                    setUploadPass("");
                    setUploadCustomUid("");
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [enlargedImage, isUploadModalOpen, uploadingState]);

    // Filters state
    const [uniqueId, setUniqueId] = useState("");
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [storageFilter, setStorageFilter] = useState("");

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
    const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

    const fetchImages = useCallback(async (targetPage = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", String(targetPage - 1));
            params.append("size", String(pageSize));

            if (uniqueId.trim()) {
                params.append("uniqueId", uniqueId.trim());
            }
            if (selectedFormats.length > 0) {
                params.append("formats", selectedFormats.join(","));
            }
            if (storageFilter) {
                params.append("location", storageFilter);
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

            const res = await getAdminImages(params.toString());
            if (res && !res.error && res.data) {
                const paged = res.data;
                setImages(paged.content || []);
                setTotalElements(paged.totalElements || 0);
                setTotalPages(paged.totalPages || 1);
            } else {
                setImages([]);
                setTotalElements(0);
                setTotalPages(1);
                if (res && res.error && res.message !== "Resource not found") {
                    errorToast(res.message || "Failed to load images");
                }
            }
        } catch (e: any) {
            errorToast(e?.message || "Failed to load images");
            setImages([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, timeFilterMode, fromDate, fromTime, toDate, toTime, exactDate, dayDate, dayStartTime, dayEndTime, includedUsers, excludedUsers, uniqueId, selectedFormats, storageFilter]);

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) {
            errorToast("Please select a file!");
            return;
        }
        if (!user?.apiKey) {
            errorToast("Missing API Key!");
            return;
        }
        if (uploadPass && uploadPass.length > 0 && uploadPass.length < 3) {
            errorToast("Password length must be at least 3 characters");
            return;
        }
        if (uploadCustomUid && (uploadCustomUid.length < 5 || uploadCustomUid.length > 8)) {
            errorToast("Custom UID must be between 5 and 8 characters");
            return;
        }

        setUploadingState(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("apiKey", user.apiKey);
            formData.append("source", "PORTAL");

            if (uploadPass) formData.append("password", uploadPass);
            if (uploadDesc) formData.append("desc", uploadDesc);
            if (uploadCustomUid) formData.append("uniqueId", uploadCustomUid);

            const fileExtension = uploadFile.name.split('.').pop()?.toLowerCase() || "";
            let selectedCallServer = callServers[1] || callServers[0];

            if (fileExtension === "dng" || fileExtension === "heic" || fileExtension === "heif") {
                selectedCallServer = callServers[callServers.length - 1] || selectedCallServer;
            }

            let uploadedImg;
            if (selectedCallServer.type === CallServerEnum.S3) {
                uploadedImg = await uploadImageBucket(formData, user.apiKey, selectedCallServer, (progress) => {
                    setUploadProgress(progress);
                }, () => {});
            } else {
                uploadedImg = await uploadImage(formData, user.apiKey, selectedCallServer, (progress) => {
                    setUploadProgress(progress);
                }, () => {});
            }

            if (!uploadedImg) {
                errorToast("Failed to upload image");
                return;
            }

            okToast("Image uploaded successfully!");
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadDesc("");
            setUploadPass("");
            setUploadCustomUid("");
            fetchImages(1);
        } catch (err: any) {
            errorToast(err?.message || "Upload failed");
        } finally {
            setUploadingState(false);
        }
    };

    useEffect(() => {
        setPage("images");
    }, [setPage]);

    useEffect(() => {
        fetchImages();
    }, [page, pageSize, selectedFormats, storageFilter]);

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

    const toggleFormat = (f: string) => {
        let newFormats;
        if (selectedFormats.includes(f)) {
            newFormats = selectedFormats.filter(x => x !== f);
        } else {
            newFormats = [...selectedFormats, f];
        }
        setSelectedFormats(newFormats);
        setPageIdx(1);
    };

    const resetFilters = () => {
        setUniqueId("");
        setSelectedFormats([]);
        setStorageFilter("");
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

    const deleteImage = async (img: UploadedImage) => {
        const ok = window.confirm(`Delete image "${img.uniqueId}"?`);
        if (!ok) return;
        try {
            const deleteTarget = img.urlSet.deleteUrl || `/v1/image/get/${img.uniqueId}`;
            const resp = await fetch(deleteTarget, {
                method: "DELETE",
                headers: user?.apiKey ? { "X-API-Key": user.apiKey } : {}
            });
            if (!resp.ok) throw new Error("Delete failed");
            infoToast("Image deleted");
            fetchImages();
        } catch (e: any) {
            errorToast(e?.message ?? "Delete failed");
        }
    };

    const migrateImageStorage = async (img: UploadedImage) => {
        const nextStorage = (img.location || "LOCAL") === "LOCAL" ? "R2" : "LOCAL";
        const ok = window.confirm(`Migrate image "${img.uniqueId}" storage from ${img.location || "LOCAL"} to ${nextStorage}?`);
        if (!ok) return;

        setMigratingId(img.uniqueId);
        try {
            const res = await migrateAdminImage(img.uniqueId, user?.apiKey || "");
            if (res.error) {
                throw new Error(res.message || "Migration failed");
            }
            okToast("Image storage migrated");
            fetchImages();
        } catch (e: any) {
            errorToast(e?.message ?? "Migration failed");
        } finally {
            setMigratingId(null);
        }
    };

    const formatDate = (iso?: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString();
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
            <div className="max-w-[90rem] mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pt-5 pb-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Admin Images</h1>
                        <p className="text-sm text-gray-400">Total Found: {totalElements}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-emerald-600/40 hover:border-emerald-500 hover:in-shadow bg-primary1 transition-all duration-200 text-xs font-semibold text-emerald-300"
                        >
                            New Image
                        </button>
                        <button
                            onClick={() => fetchImages()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                            disabled={loading}
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters Header Bar */}
                <div className="box-primary p-3 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Unique ID search */}
                        <input
                            type="text"
                            placeholder="Unique ID..."
                            value={uniqueId}
                            onChange={e => setUniqueId(e.target.value)}
                            className="w-40 rounded-lg border-2 border-zinc-800 bg-primary1 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 placeholder-gray-500 transition-colors"
                        />

                        {/* User Filter Dropdown */}
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

                        {/* Format selector */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 flex items-center gap-1.5 focus:outline-none transition-all duration-200"
                            >
                                <span>Format ({selectedFormats.length})</span>
                                <span className="text-[10px] text-gray-400">▼</span>
                            </button>
                            {formatDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setFormatDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-1 w-36 rounded-lg border-2 border-zinc-800 bg-primary1 shadow-xl z-40 p-1">
                                        {["png", "jpg", "webp", "gif", "mp4"].map(f => {
                                            const isSel = selectedFormats.includes(f);
                                            return (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => toggleFormat(f)}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 text-xs flex items-center justify-between transition-colors ${isSel ? "text-white bg-white/10 font-semibold" : "text-gray-300"}`}
                                                >
                                                    <span>{f.toUpperCase()}</span>
                                                    {isSel && <span className="text-[10px]">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Storage Filter */}
                        <select
                            value={storageFilter}
                            onChange={e => setStorageFilter(e.target.value)}
                            className="rounded-lg border-2 border-zinc-800 bg-primary1 px-2.5 py-1.5 text-xs text-white focus:outline-none transition-colors"
                        >
                            <option value="">Storage...</option>
                            <option value="LOCAL">Local</option>
                            <option value="R2">Cloud (R2)</option>
                        </select>

                        {/* Search and Reset button */}
                        <div className="flex gap-1.5 ml-auto">
                            <button
                                onClick={resetFilters}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => { setPageIdx(1); fetchImages(1); }}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Filter Badges */}
                    {(includedUsers.length > 0 || excludedUsers.length > 0 || selectedFormats.length > 0) && (
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
                            {selectedFormats.map(f => (
                                 <span key={`fmt-${f}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white border-2 border-zinc-800 uppercase font-semibold">
                                    <span>{f}</span>
                                    <button onClick={() => toggleFormat(f)} className="hover:text-white">×</button>
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
                    ) : images.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-gray-400">
                            No images found matching the filters.
                        </div>
                    ) : (
                        images.map((img) => {
                            const portalUrl = img.urlSet.portalUrl || img.urlSet.webUrl || img.urlSet.shortUrl || "";
                            const rawUrl = img.urlSet.rawUrl || "";
                            return (
                                <div key={img.uniqueId} className="rounded-xl border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 p-3">
                                    <div className="flex gap-3 items-center">
                                        {/* Thumbnail preview */}
                                        {rawUrl && (
                                            <div 
                                                className="h-12 w-12 rounded bg-black/40 border-2 border-zinc-800 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setEnlargedImage(img)}
                                                title="Click to enlarge"
                                            >
                                                <img
                                                    src={rawUrl}
                                                    alt={img.uniqueId}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                <div className="min-w-0 flex flex-col gap-1">
                                                    <div className="text-white font-semibold truncate flex gap-2 items-center">
                                                        <span className="cursor-pointer hover:underline" onClick={() => setEnlargedImage(img)} title="Click to enlarge">
                                                            {img.uniqueId}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 text-gray-300">
                                                            {img.type}
                                                        </span>
                                                        {!img.isPublic && (
                                                            <span className="text-xs text-amber-400" title="Private">
                                                                <FaLock />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                                                        <span>Size: <strong className="text-white">{formatBytes(img.size)}</strong></span>
                                                        <span className="text-gray-500">•</span>
                                                        <span>Storage: <strong className="text-white">{img.location || "LOCAL"}</strong></span>
                                                        <span className="text-gray-500">•</span>
                                                        <span>Uploaded: {formatDate(img.uploadedAt)}</span>
                                                        <span className="text-gray-500">•</span>
                                                        <span className="flex items-center gap-1">
                                                            uploader:
                                                            {img.uploader ? (
                                                                <span className="text-white font-medium">
                                                                    {img.uploader.username}
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
                                                        onClick={() => migrateImageStorage(img)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-yellow-500/40 hover:border-yellow-500 hover:in-shadow bg-yellow-600/10 text-yellow-300 transition-all duration-200 disabled:opacity-50"
                                                        title={`Migrate storage to ${(img.location || "LOCAL") === "LOCAL" ? "R2" : "LOCAL"}`}
                                                        disabled={migratingId === img.uniqueId}
                                                    >
                                                        <FaRotateRight className={`h-4 w-4 ${migratingId === img.uniqueId ? "animate-spin" : ""}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteImage(img)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-600/10 text-red-300 transition-all duration-200"
                                                        title="Delete Image"
                                                    >
                                                        <FaTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
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
                                    className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200 text-xs text-gray-200 flex items-center gap-1.5"
                                >
                                    <FaChevronLeft className="h-3 w-3" />
                                    <span>Prev</span>
                                </button>
                                <button
                                    onClick={() => setPageIdx((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200 text-xs text-gray-200 flex items-center gap-1.5"
                                >
                                    <span>Next</span>
                                    <FaChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in cursor-pointer"
                    onClick={() => {
                        if (!uploadingState) {
                            setIsUploadModalOpen(false);
                            setUploadFile(null);
                            setUploadDesc("");
                            setUploadPass("");
                            setUploadCustomUid("");
                        }
                    }}
                >
                    <div 
                        className="w-full max-w-lg bg-primary1 border-2 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                            <div>
                                <h2 className="text-base font-semibold text-white">Upload Image</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Upload an image or video to the server</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (!uploadingState) {
                                        setIsUploadModalOpen(false);
                                        setUploadFile(null);
                                        setUploadDesc("");
                                        setUploadPass("");
                                        setUploadCustomUid("");
                                    }
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                                disabled={uploadingState}
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
                            {/* Drag & Drop Zone */}
                            <div
                                onClick={() => { if (!uploadingState) { const el = document.getElementById("admin-img-input"); el?.click(); } }}
                                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-7 cursor-pointer transition-all duration-200 ${
                                    uploadFile
                                        ? "border-emerald-500/50 bg-emerald-500/5"
                                        : "border-zinc-800 bg-white/[0.02] hover:border-zinc-700 hover:bg-white/[0.04]"
                                } ${uploadingState ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                                <input
                                    id="admin-img-input"
                                    type="file"
                                    onChange={(e) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }}
                                    className="hidden"
                                    required
                                    disabled={uploadingState}
                                    accept="image/*,video/*"
                                />
                                {uploadFile ? (
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-emerald-300">{uploadFile.name}</span>
                                        <span className="text-xs text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB · {uploadFile.type || "unknown type"}</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="text-xs text-red-400 hover:text-red-300 mt-1 transition-colors">
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-300">Click to select a file</p>
                                            <p className="text-xs text-gray-600 mt-0.5">Image or video, any size</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional description..."
                                    value={uploadDesc}
                                    onChange={(e) => setUploadDesc(e.target.value)}
                                    className="w-full rounded-lg border-2 border-zinc-800 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-gray-600 transition-colors"
                                    disabled={uploadingState}
                                />
                            </div>

                            {/* Password & UID */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Min 3 chars"
                                        value={uploadPass}
                                        onChange={(e) => setUploadPass(e.target.value)}
                                        className="w-full rounded-lg border-2 border-zinc-800 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-gray-600 transition-colors"
                                        disabled={uploadingState}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Custom UID</label>
                                    <input
                                        type="text"
                                        placeholder="5–8 chars"
                                        value={uploadCustomUid}
                                        onChange={(e) => setUploadCustomUid(e.target.value)}
                                        className="w-full rounded-lg border-2 border-zinc-800 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 placeholder-gray-600 transition-colors"
                                        disabled={uploadingState}
                                    />
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {uploadingState && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between text-[11px] text-gray-500">
                                        <span>Uploading...</span>
                                        <span className="font-medium text-white">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 rounded-full"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setIsUploadModalOpen(false); setUploadFile(null); setUploadDesc(""); setUploadPass(""); setUploadCustomUid(""); }}
                                    className="px-4 py-2 rounded-lg text-sm border-2 border-zinc-800 hover:border-zinc-700 bg-primary1 hover:bg-secondary text-gray-400 hover:text-white transition-all duration-200"
                                    disabled={uploadingState}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-500/40 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-medium transition-all duration-200"
                                    disabled={uploadingState || !uploadFile}
                                >
                                    {uploadingState ? "Uploading…" : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enlarge Image Modal (Lightbox) */}
            {enlargedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
                    onClick={() => setEnlargedImage(null)}
                >
                    <div 
                        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center cursor-default bg-primary1 border-2 border-zinc-800 rounded-2xl p-4 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                            <div className="min-w-0 pr-4">
                                <h3 className="text-sm font-semibold text-white truncate">
                                    {enlargedImage.uniqueId}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Size: {formatBytes(enlargedImage.size)} · Storage: {enlargedImage.location || "LOCAL"} · Uploader: {enlargedImage.uploader?.username || "System"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copy(enlargedImage.urlSet.portalUrl || enlargedImage.urlSet.webUrl || enlargedImage.urlSet.shortUrl || '')}
                                    className="p-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 hover:text-white transition-all duration-200 text-xs"
                                    title="Copy direct link"
                                >
                                    <FaRegCopy className="h-4 w-4" />
                                </button>
                                <a
                                    href={(enlargedImage.urlSet.rawUrl || '') + "?download=true"}
                                    className="p-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 hover:text-white transition-all duration-200 text-xs"
                                    title="Download"
                                >
                                    <FaExternalLinkAlt className="h-4 w-4" />
                                </a>
                                <button
                                    onClick={() => setEnlargedImage(null)}
                                    className="p-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-400 hover:text-white transition-all duration-200 text-xs"
                                    title="Close"
                                >
                                    <FaTimes className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Image / Video preview */}
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-black/40 rounded-xl p-2">
                            {["mp4", "webm", "mov"].includes(enlargedImage.type?.toLowerCase() || '') ? (
                                <video
                                    src={enlargedImage.urlSet.rawUrl}
                                    controls
                                    autoPlay
                                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                                />
                            ) : (
                                <img
                                    src={enlargedImage.urlSet.rawUrl}
                                    alt={enlargedImage.uniqueId}
                                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
