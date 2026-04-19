'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { FaExternalLinkAlt, FaRegTrashAlt, FaDownload, FaLock, FaCopy, FaInfoCircle } from 'react-icons/fa';
import { FaPlus, FaRotateRight } from 'react-icons/fa6';
import { copyToClipboard, deleteImageApi as apiDeleteImage, errorToast, okToast } from "@/lib/client";
import { getUserImages } from "@/lib/apiGetters";
import { UploadedImage } from "@/types/image";
import { isVideoFile } from "@/lib/core";
import LoadingPage from "@/components/LoadingPage";
import { useRouter } from "next/navigation";
import { useGalleryRows } from "@/hooks/useGalleryRow";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import { useIsMobile } from "@/hooks/utils";
import { useHoverCard } from "@/hooks/useHoverCard";

// --- ANIMATION CONFIGURATION ---
const ITEMS_PER_STAGGER = 4; // How many images to reveal per tick
const STAGGER_DELAY_MS = 120; // Delay between ticks in milliseconds

type DefaultResponse = { error: boolean; message: string; data?: any; count?: number };

function isErrorResponse(x: unknown): x is DefaultResponse {
    return !!x && typeof x === 'object' && 'error' in (x as any) && typeof (x as any).error === 'boolean';
}

export default function GalleryPage() {
    const { user, loadingUser, error: userError } = useUser();
    const [items, setItems] = useState<UploadedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState<number>(0);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [page, setPage] = useState(1);
    const [usedPages, setUsedPages] = useState<number[]>([]);

    // State for staggered loading animation
    const [visibleCount, setVisibleCount] = useState(0);

    const lang = useTranslation();
    const canLoad = !!user?.uid && !loadingUser;
    const rowMode = useGalleryRows();
    const router = useRouter();

    // Defined grid dimensions to lock aspect ratios and prevents parent resizing
    const columnsMobile = 2;
    const columnsDesktop = 7;
    const rowsPerPage = 3; // We lock the grid to 3 rows high

    const imagesPerPage = rowMode === "mobile"
        ? columnsMobile * rowsPerPage
        : columnsDesktop * rowsPerPage;

    const addToImages = useCallback((newImages: UploadedImage[]) => {
        setItems(prev => {
            const existingIds = new Set(prev.map(img => img.uniqueId));
            const filteredNewImages = newImages.filter(img => !existingIds.has(img.uniqueId));
            return [...prev, ...filteredNewImages];
        });
    }, []);

    async function fetchImages(direction: "next" | "prev" | "first" = "first") {
        if (!user?.uid) return;
        if (direction === "prev") return;

        setLoading(true);
        if (direction === "first") {
            setUsedPages([1]);
        }

        const actualFromDate = (direction === "first") ? 0 : (fromDate != null ? fromDate : 0);

        try {
            const res = await getUserImages(String(user.uid), actualFromDate, imagesPerPage);
            if (res?.error === true) {
                errorToast(res.message || 'Failed to load images');
                setItems([]);
            }

            const images = res?.data as UploadedImage[];
            if (res && images && images.length > 0) {
                const mili = new Date(images[images.length - 1].uploadedAt).getTime() - 1;
                setFromDate(mili);
                addToImages(images);
                setTotalItems(res?.count || 0);
            }
        } catch {
            setItems([]);
        } finally {
            // Small timeout to smooth out the loading spinner transition
            setTimeout(() => {
                setLoading(false);
            }, 200);
        }
    }

    // Initial Load
    useEffect(() => {
        if (canLoad) {
            fetchImages();
        }
    }, [canLoad]);

    // Auth check
    useEffect(() => {
        if (loadingUser) return;
        if (!user && !loadingUser) {
            setLoading(true);
            router.push("/login?after=/home/gallery");
        }
    }, [user, loadingUser, router]);

    const handleDelete = useCallback(async (img: UploadedImage) => {
        if (!user?.apiKey) return;
        try {
            const res = await apiDeleteImage(img.uniqueId, user.apiKey);
            if (isErrorResponse(res) && res.error) {
                errorToast(res.message);
                return;
            }
            setItems(prev => prev.filter(i => i.uniqueId !== img.uniqueId));
            setTotalItems(prev => Math.max(0, (prev || 0) - 1));
            okToast('Deleted.');
        } catch {
            errorToast('Delete failed');
        }
    }, [user?.apiKey]);

    const totalPages = Math.max(1, Math.ceil(totalItems / imagesPerPage));

    const pagedItems = useMemo(() => {
        if (items.length === 0 || page < 1 || page > totalPages) return [];
        const start = (page - 1) * imagesPerPage;
        const end = page * imagesPerPage;
        return items.slice(start, end);
    }, [items, page, totalPages, imagesPerPage]);

    // Safe page boundary check
    useEffect(() => {
        if (loading) return;

        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }

        if (!loading && pagedItems.length === 0 && page > 1) {
            setPage(page - 1);
        }
    }, [items.length, pagedItems.length, page, totalPages, loading]);

    // Reset the visible count when the page changes to restart animation
    useEffect(() => {
        setVisibleCount(0);
    }, [page]);

    // Staggered loading effect based on config
    useEffect(() => {
        if (loading || pagedItems.length === 0) return;

        if (visibleCount < pagedItems.length) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + ITEMS_PER_STAGGER, pagedItems.length));
            }, STAGGER_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [visibleCount, pagedItems.length, loading]);

    const goToNextPage = async () => {
        if (page >= totalPages) return errorToast("No more pages");

        const nextStart = page * imagesPerPage;

        if (items.length <= nextStart) {
            await fetchImages("next");
        }

        setPage(prev => prev + 1);
        if (!usedPages.includes(page + 1)) {
            setUsedPages(prev => [...prev, page + 1]);
        }
    };

    const goToPrevPage = () => {
        if (page <= 1) return;
        setPage(prev => prev - 1);
    };

    if (loadingUser || !user) {
        return <LoadingPage />;
    }

    /**
     * Ghost loading skeleton component.
     * Re-written to exactly match the structure, padding, margins, and text heights
     * of the MediaCard to prevent layout popping.
     */
    const SkeletonCard = ({ animate = true }: { animate?: boolean }) => (
        <div className={`rounded-md border border-white/10 bg-primary h-full w-full ${animate ? 'animate-pulse' : ''}`}>
            {/* Preview Area (w/ Badges skeleton) */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-md bg-white/5">
                <div className="absolute right-1 top-1 flex items-center gap-1 z-10">
                    <div className="h-[19px] w-[26px] bg-white/10 rounded border border-white/5" />
                    <div className="h-[19px] w-[26px] bg-white/10 rounded border border-white/5" />
                    <div className="h-[19px] w-[35px] bg-white/10 rounded border border-white/5" />
                </div>
            </div>

            {/* Body Area */}
            <div className="p-2 space-y-1">
                {/* Title & Size Line */}
                <div className="min-w-0 flex items-center gap-2 h-[16px]"> {/* Locked height of text row */}
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                    <div className="h-2.5 w-1/4 bg-white/5 rounded" />
                </div>

                {/* Actions Line */}
                <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Open & Download Buttons */}
                        <div className="h-[26px] w-[31px] rounded-md bg-white/5 border border-white/10" />
                        <div className="h-[26px] w-[31px] rounded-md bg-white/5 border border-white/10" />
                    </div>
                    {/* Delete Button */}
                    <div className="h-[26px] w-[31px] rounded-md bg-red-600/5 border border-red-500/20" />
                </div>
            </div>
        </div>
    );

    // Shared grid classes to ensure initial loading state matches paged state exactly
    const gridClasses = "w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3 md:gap-4 grid-rows:[repeat(3,minmax(0,1fr))]";

    return (
        <section className="flex-1 min-w-0 max-w-full px-0 sm:px-3 md:px-6 bg-primaryDottedSize bg-primaryDotted">
            <div className="w-full mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between px-2 sm:pt-10 pt-5">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Your uploads</h1>
                        <div className="mt-1 text-sm text-gray-400">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </div>
                    </div>

                    <div className="space-x-4">
                        <a href="/a/new">
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 box-primary transition-colors text-sm"
                                aria-label="New upload"
                                title="New"
                            >
                                <FaPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">New</span>
                            </button>
                        </a>

                        <button
                            onClick={() => {
                                setLoading(true);
                                setPage(1);
                                fetchImages("first");
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg box-primary transition-colors text-sm"
                            disabled={loading}
                            aria-label="Refresh list"
                            title="Refresh"
                        >
                            <FaRotateRight className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>

                {/* Grid card area */}
                <div
                    className="flex flex-col sm:rounded-xl border border-white/10 bg-transparent sm:p-3 p-2 md:p-4"
                    // Min height calculated: (3 rows * approx card height) + paginator + gap
                    style={{ minHeight: "calc(3 * 220px + 56px + 2rem)" }}
                >
                    <div className="flex-1 flex items-stretch">
                        {/* Initial deep loading state (fetching initial data from server) */}
                        {loading && (
                            <ul className={gridClasses}>
                                {Array.from({ length: imagesPerPage }).map((_, i) => (
                                    <li key={`init-load-${i}`}>
                                        <SkeletonCard />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!loading && (userError || (!items.length && canLoad)) && (
                            <div className="px-2 py-10 w-full text-center text-sm text-gray-400">
                                {userError ? 'Could not load user.' : 'No uploads yet.'}
                            </div>
                        )}

                        {/* Paged display rendering with cross-fade animation */}
                        {!loading && pagedItems.length > 0 && (
                            <ul className={gridClasses}>
                                {pagedItems.map((img, index) => {
                                    const isVisible = index < visibleCount;
                                    return (
                                        <li key={img.uniqueId} className="relative group">
                                            {/* SKELETON LAYER Layer - Fades out */}
                                            <div
                                                className={`absolute inset-0 z-0 transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                            >
                                                {/* Don't animate pulse on skeletons that are about to disappear */}
                                                <SkeletonCard animate={!isVisible} />
                                            </div>

                                            {/* REAL CONTENT Layer - Fades in and scales up slightly */}
                                            <div
                                                className={`relative z-10 h-full w-full transition-all duration-500 ease-out transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                                            >
                                                <MediaCard
                                                    item={img}
                                                    onDelete={() => handleDelete(img)}
                                                    lang={lang}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Paginator */}
                    <div className="border-t border-white/10 pt-3 pb-1 flex justify-center items-center gap-4 bg-black/0 mt-4 min-h-[56px]">
                        <button
                            onClick={goToPrevPage}
                            disabled={page <= 1 || loading}
                            className="rounded-lg border border-white/10 px-2 py-2 bg-secondary hover:bg-white/10 transition-colors text-sm flex items-center justify-center disabled:opacity-40"
                            aria-label="Previous page"
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <span className="text-sm text-gray-300 font-medium select-none">
                            Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
                        </span>
                        <button
                            onClick={goToNextPage}
                            disabled={page >= totalPages || loading}
                            className="rounded-lg border border-white/10 px-2 py-2 bg-secondary hover:bg-white/10 transition-colors text-sm flex items-center justify-center disabled:opacity-40"
                            aria-label="Next page"
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MediaCard({ item, onDelete, lang }: { item: UploadedImage; onDelete: () => void, lang: LanguageModel }) {
    const isVideo = isVideoFile(item.type || '');
    const urls = normalizeUrls(item);
    const title = deriveTitle(item, urls.original);
    const size = formatBytes(item.size || 0);

    const isMobile: boolean = useIsMobile();

    /*const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);*/

    const [imgFailed, setImgFailed] = useState(false);

    const showPlaceholder = imgFailed || !urls.original || item.size === 0;

    const rawUrl = (item.location === "LOCAL" && (!item.isPublic || item.requiresPassword)) ? "/api/images/" + item.uniqueId : item.urlSet.rawUrl;

    return (
        // Changed h-full to w-full to let grid define height
        <div className="group rounded-md border border-white/10 bg-primary hover:bg-secondary transition-colors w-full h-full flex flex-col">
            {/* Preview */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-md bg-black flex-shrink-0" style={{ minHeight: 0 }}>
                {showPlaceholder ? (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary to-black/60 text-white/80 p-2">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-300 mb-1">Image - error</div>
                            <div className="font-mono text-xs break-all">{item.uniqueId}</div>
                        </div>
                    </div>
                ) : isVideo ? (
                    <video
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        preload={item.urlSet.posterUrl ? 'metadata' : 'none'}
                        poster={item.urlSet.posterUrl ?? undefined}
                        controls={true}
                        style={{ minHeight: 0 }}
                    >
                        <source src={item.urlSet.customUrl || item.urlSet.rawUrl} type="video/mp4" />
                    </video>
                ) : (
                    <img
                        src={rawUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        style={{ minHeight: 0 }}
                        onError={(e) => {
                            const imgEl = e.currentTarget as HTMLImageElement;
                            if (imgEl.src === (urls.thumb || '')) {
                                if (urls.original && urls.original !== urls.thumb) {
                                    imgEl.src = urls.original;
                                } else {
                                    setImgFailed(true);
                                }
                            } else {
                                setImgFailed(true);
                            }
                        }}
                    />
                )}

                {/* Top-right badges */}
                <div className="absolute right-1 top-1 flex items-center gap-1 z-10">
                    <span
                        className="inline-flex items-center gap-1 bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10">
                          <FaInfoCircle className="h-3 w-3" />
                    </span>
                    <span onClick={(event) => {
                        let copyText = item.urlSet.userPreferences || item.urlSet.rawUrl || urls.original;
                        if (event.shiftKey) copyText = item.urlSet.portalUrl;
                        else if (event.ctrlKey) copyText = item.urlSet.rawUrl;
                        copyToClipboard(copyText, lang);
                    }} className="cursor-pointer inline-flex items-center gap-1 bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10">
                          <FaCopy className="h-3 w-3" />
                    </span>
                    {item.requiresPassword && (
                        <span className="inline-flex items-center gap-1 bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10">
                          <FaLock className="h-3 w-3" />
                        </span>
                    )}
                    <span className="inline-flex items-center bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10">
                        {isVideo ? 'Video' : 'Image'}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                <div className="min-w-0 flex items-center gap-2 h-[16px]"> {/* Locked height to match skeleton */}
                    <p className="text-xs font-semibold truncate" title={title}>
                        {title + "." + item.type}
                    </p>
                    <p className="text-[10px] text-gray-400 flex-shrink-0">{"(" + size + ")"}</p>
                </div>

                {/* Actions - icons only */}
                <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                            href={item.urlSet.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs border border-white/10 bg-primary hover:bg-secondary transition-colors"
                            aria-label="Open"
                            title="Open"
                        >
                            <FaExternalLinkAlt className="h-4 w-4" />
                        </a>
                        <a
                            href={(item.urlSet.rawUrl || urls.original) + "?download=true"}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs border border-white/10 bg-primary hover:bg-secondary transition-colors"
                            aria-label="Download"
                            title="Download"
                        >
                            <FaDownload className="h-4 w-4" />
                        </a>
                    </div>
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs border border-red-500/30 bg-red-600/10 hover:bg-red-600/15 text-red-300 transition-colors flex-shrink-0"
                        aria-label="Delete"
                        title="Delete"
                    >
                        <FaRegTrashAlt className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Hover Info Card */}
            {/*<div className={`pointer-events-none transition-all duration-200 ease-out transform ${
                showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } absolute bg-secondary shadow-lg rounded-lg p-2 z-50 flex flex-row gap-4`} style={{ top: position.y + 10, left: position.x + 15 }}>
                <div className="flex gap-1 flex-col text-sm text-zinc-300">
                    <span className="flex gap-2 flex-row">
                        <p>Uploaded at:</p>
                        <p>{new Date(item.uploadedAt).toLocaleString()}</p>
                    </span>

                    <span className="flex gap-2 flex-row">
                        <p>File type:</p>
                        <p>{item.type}</p>
                    </span>

                    <span className="flex gap-2 flex-row">
                        <p>Location:</p>
                        <p>{item.location}</p>
                    </span>
                </div>
            </div>*/}
        </div>
    );
}

function normalizeUrls(item: UploadedImage): { original: string; thumb?: string; download?: string } {
    const any = (item as any)?.urlSet || {};
    const original = any.fileUrl || any.rawUrl || any.originalUrl || any.downloadUrl || any.shortUrl || any.url || '';
    const thumb = any.thumbnailUrl || any.thumbUrl || any.thumb || any.previewUrl || (typeof original === 'string' && original) || undefined;
    const download = any.downloadUrl || any.fileUrl || original;
    return { original, thumb, download };
}

function deriveTitle(item: UploadedImage, originalUrl: string): string {
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