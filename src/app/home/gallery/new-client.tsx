'use client';
import VideoConversionControl from "@/components/VideoConversionControl";
import { versionedVideoUrl } from "@/lib/videoConversion";
import Surface from "@/components/ui/Surface";

import { NativeButton } from "@/components/ui/NativeButton";
import MainStringInput from "@/components/MainStringInput";


import ResourceList from "@/components/ui/ResourceList";
import Pagination from "@/components/ui/Pagination";

import { type ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { FaExternalLinkAlt, FaRegTrashAlt, FaDownload, FaLock, FaCopy, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { FaPlus, FaRotateRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { copyToClipboard, deleteImageApi as apiDeleteImage, errorToast, okToast } from "@/lib/client";
import { getUserImages } from "@/lib/apiGetters";
import { updateImagePassword } from "@/lib/apiPoster";
import { ImageListResponse, UploadedImagePage } from "@/types/image";
import { getR2VideoUrl, isVideoFile } from "@/lib/core";

import { useRouter } from "next/navigation";
import { useGalleryRows } from "@/hooks/useGalleryRow";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import HoverDiv, {DeleteButton} from "@/components/HoverDiv";

function TimeDropdownShell({label, children}: {label: string; children: ReactNode}) {
    const [open, setOpen] = useState(false);

    return <div className="relative">
        <NativeButton
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
            className="flex items-center gap-1.5 rounded-lg border-2 border-zinc-800 bg-primary1 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors duration-150 hover:border-zinc-700 hover:in-shadow focus:outline-none"
        >
            <span>{label}</span>
            <span className={`text-[10px] text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
        </NativeButton>
        {open && <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <Surface className="absolute left-0 z-40 mt-1 w-72 space-y-3 rounded-lg border-2 border-zinc-800 bg-primary1 p-3 shadow-xl">
                {children}
            </Surface>
        </>}
    </div>;
}

export default function GalleryPage() {
    const { user, loadingUser, error: userError } = useUser();
    const [items, setItems] = useState<UploadedImagePage[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(21); // ✅ Dynamic page size
    const requestSequence = useRef(0);
    const previousQuery = useRef("");
    const [isMobile, setIsMobile] = useState(false);

    const lang = useTranslation();
    const canLoad = !!user?.uid && !loadingUser;
    const rowMode = useGalleryRows();
    const router = useRouter();

    const columnsMobile = 2;
    const columnsDesktop = 7;
    const rowsPerPage = 3;

    // Filters state
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [timeFilterMode, setTimeFilterMode] = useState<"range" | "exact" | "time-day">("range");
    const [fromDate, setFromDate] = useState("");
    const [fromTime, setFromTime] = useState("");
    const [toDate, setToDate] = useState("");
    const [toTime, setToTime] = useState("");
    const [exactDate, setExactDate] = useState("");
    const [dayDate, setDayDate] = useState("");
    const [dayStartTime, setDayStartTime] = useState("");
    const [dayEndTime, setDayEndTime] = useState("");

    // Dropdown open states
    const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

    // Password modal state
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordModalImage, setPasswordModalImage] = useState<UploadedImagePage | null>(null);
    const [newPasswordVal, setNewPasswordVal] = useState("");

    // Enlarge Lightbox modal state
    const [enlargedImage, setEnlargedImage] = useState<UploadedImagePage | null>(null);

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (enlargedImage) setEnlargedImage(null);
                if (passwordModalOpen) {
                    setPasswordModalOpen(false);
                    setPasswordModalImage(null);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [enlargedImage, passwordModalOpen]);

    // ✅ Detect mobile and adjust page size
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 640;
            setIsMobile(mobile);
            setPageSize(mobile ? 10 : 21);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Construct query string helper
    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (selectedFormats.length > 0) {
            params.append("formats", selectedFormats.join(","));
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

        return params.toString();
    }, [selectedFormats, timeFilterMode, fromDate, fromTime, toDate, toTime, exactDate, dayDate, dayStartTime, dayEndTime]);

    // ✅ Fetch with page number and filters
    const fetchImages = useCallback(async (page: number = 0) => {
        if (!user?.uid) {
            return;
        }

        const sequence = ++requestSequence.current;
        setLoading(true);
        try {
            const res = await getUserImages(String(user.uid), page, pageSize, queryString);

            if (sequence !== requestSequence.current) {
                return;
            }

            if (res?.error === true) {
                if (res.message !== 'Resource not found') {
                    errorToast(res.message || 'Failed to load images');
                }
                setItems([]);
                return;
            }

            const message = res?.data as ImageListResponse;
            if (message && message.images && message.images.length > 0) {
                setItems(message.images);
                setCurrentPage(message.currentPage);
                setTotalPages(message.totalPages);
            } else {
                setItems([]);
                setCurrentPage(0);
                setTotalPages(1);
            }
        } catch (error) {
            if (sequence !== requestSequence.current) {
                return;
            }
            console.error('Error fetching images:', error);
            setItems([]);
            errorToast('Failed to load images');
        } finally {
            if (sequence === requestSequence.current) {
                setLoading(false);
            }
        }
    }, [user?.uid, pageSize, queryString]);

    // Reset pagination before fetching new filters, without requesting the old page.
    useEffect(() => {
        if (previousQuery.current !== queryString) {
            previousQuery.current = queryString;
            if (currentPage !== 0) {
                setCurrentPage(0);
                return;
            }
        }

        if (canLoad) {
            fetchImages(currentPage);
        }

        return () => {
            requestSequence.current += 1;
        };
    }, [canLoad, currentPage, queryString, fetchImages]);

    // Auth check
    useEffect(() => {
        if (loadingUser) return;
        if (!user && !loadingUser) {
            setLoading(true);
            router.push("/login?after=/home/gallery");
        }
    }, [user, loadingUser, router]);

    const handleDelete = useCallback(async (img: UploadedImagePage) => {
        if (!user?.apiKey) return;
        try {
            await apiDeleteImage(img.uniqueId, user.apiKey);
            setItems(prev => prev.filter(i => i.uniqueId !== img.uniqueId));
            okToast('Deleted.');
        } catch (err) {
            errorToast(err instanceof Error ? err.message : 'Delete failed');
        }
    }, [user?.apiKey]);

    const openPasswordModal = useCallback((image: UploadedImagePage) => {
        setPasswordModalImage(image);
        setNewPasswordVal("");
        setPasswordModalOpen(true);
    }, []);

    const goToNextPage = () => {
        if (currentPage >= totalPages - 1) {
            errorToast("No more pages");
            return;
        }
        setCurrentPage(currentPage + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToPrevPage = () => {
        if (currentPage <= 0) return;
        setCurrentPage(currentPage - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleFormat = (f: string) => {
        if (selectedFormats.includes(f)) {
            setSelectedFormats(selectedFormats.filter(x => x !== f));
        } else {
            setSelectedFormats([...selectedFormats, f]);
        }
    };

    const resetFilters = () => {
        setSelectedFormats([]);
        setFromDate("");
        setFromTime("");
        setToDate("");
        setToTime("");
        setExactDate("");
        setDayDate("");
        setDayStartTime("");
        setDayEndTime("");
    };

    const handleSavePassword = async () => {
        if (!passwordModalImage) return;
        try {
            const res = await updateImagePassword(passwordModalImage.uniqueId, newPasswordVal);
            if (res && !res.error) {
                okToast("Password updated");
                setPasswordModalOpen(false);
                setPasswordModalImage(null);
                fetchImages(currentPage);
            } else {
                errorToast(res?.message || "Failed to update password");
            }
        } catch (e: any) {
            errorToast(e?.message || "Failed to update password");
        }
    };

    const SkeletonCard = ({ animate = true }: { animate?: boolean }) => (
        <Surface className={`rounded-xl border-2 border-zinc-800 bg-primary1 h-full w-full ${animate ? 'animate-pulse' : ''}`}>
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-xl bg-black">
                <div className="absolute right-1 top-1 flex items-center gap-1 z-10">
                    <div className="h-[19px] w-[26px] bg-black/60 rounded border border-white/10" />
                    <div className="h-[19px] w-[26px] bg-black/60 rounded border border-white/10" />
                    <div className="h-[19px] w-[35px] bg-black/60 rounded border border-white/10" />
                </div>
            </div>

            <div className="p-2 space-y-1">
                <div className="min-w-0 flex items-center gap-2 h-[16px]">
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                    <div className="h-2.5 w-1/4 bg-white/5 rounded" />
                </div>

                <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="h-[26px] w-[31px] rounded-md bg-primary border-2 border-zinc-800" />
                        <div className="h-[26px] w-[31px] rounded-md bg-primary border-2 border-zinc-800" />
                    </div>
                    <div className="h-[26px] w-[31px] rounded-md bg-red-600/10 border-2 border-red-500/30" />
                </div>
            </div>
        </Surface>
    );

    const gridClasses = "w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3";

    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6 bg-primaryDottedSize bg-primaryDotted relative">
            <div className="max-w-[90rem] mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pt-5 pb-2">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Your uploads</h1>
                        <div className="mt-1 text-sm text-gray-400">
                            Page {currentPage + 1} of {totalPages}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <a href="/a/image">
                            <NativeButton
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                                aria-label="New upload"
                                title="New"
                            >
                                <FaPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">New</span>
                            </NativeButton>
                        </a>

                        <NativeButton
                            onClick={() => {
                                setLoading(true);
                                fetchImages(currentPage);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                            disabled={loading}
                            aria-label="Refresh list"
                            title="Refresh"
                        >
                            <FaRotateRight className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                        </NativeButton>
                    </div>
                </div>

                {/* Compact Filters Panel */}
                <div className="flex flex-col gap-1.5">
                    <Surface className="box-primary p-3 flex flex-wrap items-center gap-3 text-xs">
                        {/* Format selector */}
                        <div className="relative">
                            <NativeButton
                                type="button"
                                onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 flex items-center gap-1.5 focus:outline-none transition-all duration-200"
                            >
                                <span>Format ({selectedFormats.length})</span>
                                <span className="text-[10px] text-gray-400">▼</span>
                            </NativeButton>
                            {formatDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setFormatDropdownOpen(false)} />
                                    <Surface className="absolute left-0 mt-1 w-36 rounded-lg border-2 border-zinc-800 bg-primary1 shadow-xl z-40 p-1">
                                        {["png", "jpg", "webp", "gif", "mp4"].map(f => {
                                            const isSel = selectedFormats.includes(f);
                                            return (
                                                <NativeButton
                                                    key={f}
                                                    type="button"
                                                    onClick={() => toggleFormat(f)}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded hover:bg-white/5 text-xs flex items-center justify-between transition-colors ${isSel ? "text-primary_light font-semibold" : "text-gray-300"}`}
                                                >
                                                    <span>{f.toUpperCase()}</span>
                                                    {isSel && <span className="text-[10px]">✓</span>}
                                                </NativeButton>
                                            );
                                        })}
                                    </Surface>
                                </>
                            )}
                        </div>

                        {/* Time Filter Dropdown */}
                        <TimeDropdownShell label={`Time: ${timeFilterMode === "range" ? "Range" : timeFilterMode === "exact" ? "Exact" : "One Day"}`}>
                                        <div className="flex gap-1 border-b border-white/5 pb-2">
                                            <NativeButton
                                                type="button"
                                                onClick={() => setTimeFilterMode("range")}
                                                className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition-colors ${timeFilterMode === "range" ? "bg-primary_light/20 text-white" : "text-gray-400"}`}
                                            >
                                                Range
                                            </NativeButton>
                                            <NativeButton
                                                type="button"
                                                onClick={() => setTimeFilterMode("exact")}
                                                className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition-colors ${timeFilterMode === "exact" ? "bg-primary_light/20 text-white" : "text-gray-400"}`}
                                            >
                                                Exact Date
                                            </NativeButton>
                                            <NativeButton
                                                type="button"
                                                onClick={() => setTimeFilterMode("time-day")}
                                                className={`flex-1 text-center py-1 rounded text-[10px] font-medium transition-colors ${timeFilterMode === "time-day" ? "bg-primary_light/20 text-white" : "text-gray-400"}`}
                                            >
                                                One Day
                                            </NativeButton>
                                        </div>

                                        {timeFilterMode === "range" && (
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">From Date</span>
                                                    <MainStringInput type="date" value={fromDate} onChange={(_value, e) => setFromDate(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">From Time</span>
                                                    <MainStringInput type="time" value={fromTime} onChange={(_value, e) => setFromTime(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">To Date</span>
                                                    <MainStringInput type="date" value={toDate} onChange={(_value, e) => setToDate(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">To Time</span>
                                                    <MainStringInput type="time" value={toTime} onChange={(_value, e) => setToTime(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                            </div>
                                        )}

                                        {timeFilterMode === "exact" && (
                                            <div className="text-[10px]">
                                                <span className="text-gray-400 block mb-0.5">Date</span>
                                                <MainStringInput type="date" value={exactDate} onChange={(_value, e) => setExactDate(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                            </div>
                                        )}

                                        {timeFilterMode === "time-day" && (
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div className="col-span-2">
                                                    <span className="text-gray-400 block mb-0.5">Date</span>
                                                    <MainStringInput type="date" value={dayDate} onChange={(_value, e) => setDayDate(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">Start Time</span>
                                                    <MainStringInput type="time" value={dayStartTime} onChange={(_value, e) => setDayStartTime(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block mb-0.5">End Time</span>
                                                    <MainStringInput type="time" value={dayEndTime} onChange={(_value, e) => setDayEndTime(e.target.value)} className="w-full rounded border-2 border-zinc-800 bg-primary px-2 py-1 text-white focus:outline-none text-[10px]" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-1.5 pt-1.5 border-t border-white/5">
                                            <NativeButton
                                                type="button"
                                                onClick={() => {
                                                    setFromDate(""); setFromTime(""); setToDate(""); setToTime("");
                                                    setExactDate(""); setDayDate(""); setDayStartTime(""); setDayEndTime("");
                                                }}
                                                className="px-2 py-1 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-[10px] font-medium text-gray-300 transition-all duration-200"
                                            >
                                                Clear
                                            </NativeButton>
                                        </div>
                        </TimeDropdownShell>

                        {/* Reset button */}
                        <div className="flex gap-1.5 ml-auto">
                            <NativeButton
                                onClick={resetFilters}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                            >
                                Reset Filters
                            </NativeButton>
                        </div>
                    </Surface>

                    {/* Filter Badges */}
                    {selectedFormats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[10px] px-1">
                            {selectedFormats.map(f => (
                                <span key={`fmt-${f}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white border-2 border-zinc-800 uppercase font-semibold">
                                    <span>{f}</span>
                                    <NativeButton onClick={() => toggleFormat(f)} className="hover:text-white">×</NativeButton>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid card area */}
                <ResourceList
                    className="flex flex-col box-primary sm:p-3 p-2 md:p-4"
                    style={{ minHeight: "calc(3 * 220px + 56px + 2rem)" }}
                >
                    <div className="flex-1 flex items-start">
                        {/* Loading state */}
                        {loading && (
                            <ul className={gridClasses}>
                                {Array.from({ length: pageSize }).map((_, i) => (
                                    <li key={`load-${i}`}>
                                        <SkeletonCard />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Error or empty state */}
                        {!loading && (userError || (!items.length && canLoad)) && (
                            <div className="px-2 py-10 w-full text-center text-sm text-gray-400">
                                {userError ? 'Could not load user.' : 'No uploads matching the filters.'}
                            </div>
                        )}

                        {/* Render available results immediately. */}
                        {!loading && items.length > 0 && (
                            <ul className={gridClasses}>
                                {items.map((img) => {
                                    return (
                                        <li key={img.uniqueId} className="relative group">
                                            <div className="relative h-full w-full">
                                                <MediaCard
                                                    item={img}
                                                    apiKey={user?.apiKey}
                                                    onDelete={handleDelete}
                                                    onPasswordChange={openPasswordModal}
                                                    onEnlarge={setEnlargedImage}
                                                    lang={lang}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <Pagination
                            page={currentPage + 1}
                            pages={totalPages}
                            onChange={(page) => setCurrentPage(page - 1)}
                            onPrevious={goToPrevPage}
                            onNext={goToNextPage}
                            disabled={loading}
                        />
                </ResourceList>
            </div>

            {/* Password Modal */}
            {passwordModalOpen && passwordModalImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm cursor-pointer"
                    onClick={() => { setPasswordModalOpen(false); setPasswordModalImage(null); }}
                >
                    <Surface
                        className="box-primary w-full max-w-sm p-5 space-y-4 rounded-xl border-2 border-zinc-800 shadow-2xl relative cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <NativeButton
                            type="button"
                            onClick={() => { setPasswordModalOpen(false); setPasswordModalImage(null); }}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes />
                        </NativeButton>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Image Password Settings</h3>
                            <p className="text-xs text-gray-400 mt-1 truncate">For: {passwordModalImage.uniqueId}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Password</label>
                            <MainStringInput
                                type="password"
                                placeholder="Enter password (leave empty to remove)"
                                value={newPasswordVal}
                                onChange={(_value, e) => setNewPasswordVal(e.target.value)}
                                className="w-full rounded-lg border-2 border-zinc-800 bg-primary px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <NativeButton
                                type="button"
                                onClick={() => { setPasswordModalOpen(false); setPasswordModalImage(null); }}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-300 transition-all duration-200"
                            >
                                Cancel
                            </NativeButton>
                            <NativeButton
                                type="button"
                                onClick={handleSavePassword}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-white transition-all duration-200"
                            >
                                Save
                            </NativeButton>
                        </div>
                    </Surface>
                </div>
            )}

            {/* Enlarge Image Modal (Lightbox) */}
            {enlargedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
                    onClick={() => setEnlargedImage(null)}
                >
                    <Surface
                        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center cursor-default bg-primary1 border-2 border-zinc-800 rounded-2xl p-4 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                            <div className="min-w-0 pr-4">
                                <h3 className="text-sm font-semibold text-white truncate">
                                    {enlargedImage.description || enlargedImage.uniqueId}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {enlargedImage.uniqueId} · {formatBytes(enlargedImage.size || 0)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <HoverDiv
                                    onClick={() => copyToClipboard(enlargedImage.urls?.portalUrl || `${window.location.origin}/i/${encodeURIComponent(enlargedImage.uniqueId)}`, lang)}
                                    icon={<FaCopy className="h-4 w-4"/>}
                                    className="p-2 text-xs"
                                    title="Copy portal URL"
                                    aria-label="Copy portal URL"
                                />
                                <a
                                    href={(enlargedImage.urls?.rawUrl || enlargedImage.urls?.userPreference || '') + "?download=true"}
                                    className="inline-flex"
                                    title="Download"
                                >
                                <HoverDiv icon={<FaDownload className="h-4 w-4"/>} className="p-2 text-xs" aria-label="Download"/>
                                </a>
                                <HoverDiv
                                    onClick={() => setEnlargedImage(null)}
                                    icon={<FaTimes className="h-4 w-4"/>}
                                    className="p-2 text-xs"
                                    title="Close"
                                    aria-label="Close"
                                />
                            </div>
                        </div>

                        {/* Image / Video preview */}
                        <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-black/40 rounded-xl p-2">
                            {isVideoFile(enlargedImage.type || '') ? (
                                <video
                                    src={enlargedImage.location === "R2"
                                        ? getR2VideoUrl("media", enlargedImage.uniqueId)
                                        : enlargedImage.location === "LOCAL"
                                            ? `/api/images/${encodeURIComponent(enlargedImage.uniqueId)}`
                                            : enlargedImage.urls?.userPreference || enlargedImage.urls?.rawUrl || undefined}
                                    controls
                                    autoPlay
                                    preload="metadata"
                                    playsInline
                                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                                />
                            ) : (
                                <img
                                    src={enlargedImage.location === "LOCAL" ? `/api/images/${encodeURIComponent(enlargedImage.uniqueId)}` : (enlargedImage.urls?.rawUrl || enlargedImage.urls?.userPreference || undefined)}
                                    alt={enlargedImage.uniqueId}
                                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                                />
                            )}
                        </div>
                    </Surface>
                </div>
            )}
        </section>
    );

}

// MediaCard component
const MediaCard = memo(function MediaCard({
    item,
    apiKey,
    onDelete,
    onPasswordChange,
    onEnlarge,
    lang
}: {
    item: UploadedImagePage;
    apiKey?: string;
    onDelete: (item: UploadedImagePage) => void;
    onPasswordChange: (item: UploadedImagePage) => void;
    onEnlarge: (item: UploadedImagePage) => void;
    lang: LanguageModel;
}) {
    const isVideo = isVideoFile(item.type || '');
    const [imgFailed, setImgFailed] = useState(false);
    const [videoVersion, setVideoVersion] = useState("");

    // Handle new URL structure from pageable endpoint
    const urls = {
        original: item.urls?.rawUrl || item.urls?.userPreference || '',
        portalUrl: item.urls?.portalUrl || '',
        shortUrl: item.urls?.shortUrl || '',
    };

    const title = deriveTitle(item, urls.original);
    const size = formatBytes(item.size || 0);

    const showPlaceholder = imgFailed || !urls.original || item.size === 0;
    const rawUrl = item.location === "LOCAL" ? `/api/images/${encodeURIComponent(item.uniqueId)}` : urls.original;
    const videoUrl = item.location === "R2" ? getR2VideoUrl("media", item.uniqueId) : rawUrl;

    return (
        <Surface className="group rounded-xl border-2 border-zinc-800 hover:border-zinc-700 bg-primary1 hover:bg-secondary/40 shadow-lg shadow-black/30 hover:shadow-black/50 transition-all duration-200 w-full h-full flex flex-col overflow-hidden">
            {/* Preview */}
            <div
                className="relative w-full aspect-[4/3] overflow-hidden bg-black/60 flex-shrink-0 cursor-pointer"
                style={{ minHeight: 0 }}
                onClick={() => onEnlarge(item)}
            >
                {showPlaceholder ? (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary to-black/80 text-white/80 p-2">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-400 mb-1">Image Error</div>
                            <div className="font-mono text-xs break-all text-red-400">{item.uniqueId}</div>
                        </div>
                    </div>
                ) : isVideo ? (
                    <video
                        src={videoUrl ? versionedVideoUrl(videoUrl, videoVersion) : undefined}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        preload="metadata"
                        poster={item.location === "R2" ? undefined : item.urls?.posterUrl || undefined}
                        controls={true}
                        playsInline
                        onClick={(e) => e.stopPropagation()}
                        style={{ minHeight: 0 }}
                    >
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <img
                        src={rawUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                        style={{ minHeight: 0 }}
                        onError={() => setImgFailed(true)}
                    />
                )}

                {/* Badges & Overlays */}
                <div className="absolute right-1.5 top-1.5 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-[10px] px-1.5 py-0.5 rounded-md border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer" title="Info">
                        <FaInfoCircle className="h-3 w-3" />
                    </span>
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(urls.portalUrl || `${window.location.origin}/i/${encodeURIComponent(item.uniqueId)}`, lang);
                        }}
                        className="cursor-pointer inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-[10px] px-1.5 py-0.5 rounded-md border border-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Copy portal URL"
                    >
                        <FaCopy className="h-3 w-3" />
                    </span>
                    {item.requiresPassword && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/20 backdrop-blur-md text-[10px] px-1.5 py-0.5 rounded-md border border-amber-500/30 text-amber-300" title="Password protected">
                            <FaLock className="h-3 w-3" />
                        </span>
                    )}
                    <span className="inline-flex items-center bg-black/60 backdrop-blur-md text-[10px] px-1.5 py-0.5 rounded-md border border-white/10 text-gray-300 uppercase font-bold tracking-wider">
                        {isVideo ? 'Video' : 'Image'}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                <div className="min-w-0 flex items-center justify-between gap-2 h-[16px]">
                    {item.type?.toLowerCase() === "mp4" && (
                        <VideoConversionControl compact kind="image" id={item.uniqueId} size={item.size} apiKey={apiKey} onComplete={setVideoVersion} />
                    )}
                    <p className="text-xs font-semibold text-gray-200 truncate group-hover:text-white transition-colors cursor-pointer" onClick={() => onEnlarge(item)} title={title}>
                        {title}.{item.type}
                    </p>
                    <p className="text-[10px] text-gray-500 group-hover:text-gray-300 flex-shrink-0 font-medium transition-colors">({size})</p>
                </div>


                {/* Actions */}
                <div className="mt-2.5 flex items-center justify-between gap-1 pt-1.5 border-t border-white/5">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                            href={urls.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1.5 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 hover:text-white transition-all duration-200"
                            aria-label="Open"
                            title="Open portal"
                        >
                            <FaExternalLinkAlt className="h-3.5 w-3.5" />
                        </a>
                        <a
                            href={urls.original + "?download=true"}
                            className="inline-flex items-center px-2 py-1.5 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 hover:text-white transition-all duration-200"
                            aria-label="Download"
                            title="Download original"
                        >
                            <FaDownload className="h-3.5 w-3.5" />
                        </a>
                        {/* Lock Button to modify password */}
                        <HoverDiv
                            onClick={() => onPasswordChange(item)}
                            type={item.requiresPassword ? "WARN" : "INFO"}
                            icon={<FaLock className="h-3.5 w-3.5"/>}
                            className="px-2 py-1.5 text-xs"
                            aria-label="Password settings"
                            title="Set / update password"
                        />
                    </div>
                    <DeleteButton
                        onClick={() => onDelete(item)}
                        icon={<FaRegTrashAlt className="h-3.5 w-3.5"/>}
                        className="px-2 py-1.5 text-xs"
                        inputClassName="flex-shrink-0"
                        aria-label="Delete"
                        title="Delete upload"
                    />
                </div>
            </div>
        </Surface>
    );
});

function deriveTitle(item: UploadedImagePage, originalUrl: string): string {
    if (item.description) return item.description;
    try {
        const u = new URL(originalUrl);
        const path = u.pathname.split('/').filter(Boolean);
        const last = path[path.length - 1] || item.uniqueId;
        return decodeURIComponent(last);
    } catch {
        return item.uniqueId || 'file';
    }
}

function formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = bytes / Math.pow(k, i);
    return `${val.toFixed(val >= 100 || i === 0 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
}
