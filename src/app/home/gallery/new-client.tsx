'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { FaExternalLinkAlt, FaRegTrashAlt, FaDownload, FaLock, FaCopy, FaInfoCircle } from 'react-icons/fa';
import { FaPlus, FaRotateRight } from 'react-icons/fa6';
import { copyToClipboard, deleteImageApi as apiDeleteImage, errorToast, okToast } from "@/lib/client";
import { getUserImages } from "@/lib/apiGetters";
import { ImageListResponse, UploadedImagePage } from "@/types/image";
import { isVideoFile } from "@/lib/core";
import LoadingPage from "@/components/LoadingPage";
import { useRouter } from "next/navigation";
import { useGalleryRows } from "@/hooks/useGalleryRow";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";

const ITEMS_PER_STAGGER = 4;
const STAGGER_DELAY_MS = 120;

type DefaultResponse = { error: boolean; message: string; data?: any; count?: number };

function isErrorResponse(x: unknown): x is DefaultResponse {
    return !!x && typeof x === 'object' && 'error' in (x as any) && typeof (x as any).error === 'boolean';
}

export default function GalleryPage() {
    const { user, loadingUser, error: userError } = useUser();
    const [items, setItems] = useState<UploadedImagePage[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(21); // ✅ Dynamic page size
    const [visibleCount, setVisibleCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    const lang = useTranslation();
    const canLoad = !!user?.uid && !loadingUser;
    const rowMode = useGalleryRows();
    const router = useRouter();

    const columnsMobile = 2;
    const columnsDesktop = 7;
    const rowsPerPage = 3;

    const imagesPerPage = rowMode === "mobile"
        ? columnsMobile * rowsPerPage
        : columnsDesktop * rowsPerPage;

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

    // ✅ Fetch with page number instead of timestamps
    async function fetchImages(page: number = 0) {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const res = await getUserImages(String(user.uid), page, pageSize);

            if (res?.error === true) {
                errorToast(res.message || 'Failed to load images');
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
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            setItems([]);
            errorToast('Failed to load images');
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 200);
        }
    }

    // Initial Load
    useEffect(() => {
        if (canLoad) {
            fetchImages(0);
        }
    }, [canLoad, pageSize]);

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
            const res = await apiDeleteImage(img.uniqueId, user.apiKey);
            if (isErrorResponse(res) && res.error) {
                errorToast(res.message);
                return;
            }
            setItems(prev => prev.filter(i => i.uniqueId !== img.uniqueId));
            okToast('Deleted.');
        } catch {
            errorToast('Delete failed');
        }
    }, [user?.apiKey]);

    // Reset visible count when page changes
    useEffect(() => {
        setVisibleCount(0);
    }, [currentPage]);

    // Staggered loading animation
    useEffect(() => {
        if (loading || items.length === 0) return;

        if (visibleCount < items.length) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + ITEMS_PER_STAGGER, items.length));
            }, STAGGER_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [visibleCount, items.length, loading]);

    const goToNextPage = async () => {
        if (currentPage >= totalPages - 1) {
            errorToast("No more pages");
            return;
        }
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        await fetchImages(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToPrevPage = async () => {
        if (currentPage <= 0) return;
        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        await fetchImages(prevPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToPage = async (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setCurrentPage(page);
        await fetchImages(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✅ Generate page numbers to display
    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        const maxVisible = isMobile ? 3 : 5;
        const halfVisible = Math.floor(maxVisible / 2);

        if (totalPages <= maxVisible) {
            // Show all pages
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(0);

            // Calculate range around current page
            let start = Math.max(1, currentPage - halfVisible);
            let end = Math.min(totalPages - 2, currentPage + halfVisible);

            // Adjust if we're near the start or end
            if (currentPage < halfVisible + 1) {
                end = maxVisible - 2;
            } else if (currentPage > totalPages - halfVisible - 2) {
                start = totalPages - maxVisible + 1;
            }

            // Add ellipsis if there's a gap
            if (start > 1) {
                pages.push('...');
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis if there's a gap
            if (end < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages - 1);
        }

        return pages;
    };

    if (loadingUser || !user) {
        return <LoadingPage />;
    }

    const SkeletonCard = ({ animate = true }: { animate?: boolean }) => (
        <div className={`rounded-md border border-white/10 bg-primary h-full w-full ${animate ? 'animate-pulse' : ''}`}>
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-md bg-white/5">
                <div className="absolute right-1 top-1 flex items-center gap-1 z-10">
                    <div className="h-[19px] w-[26px] bg-white/10 rounded border border-white/5" />
                    <div className="h-[19px] w-[26px] bg-white/10 rounded border border-white/5" />
                    <div className="h-[19px] w-[35px] bg-white/10 rounded border border-white/5" />
                </div>
            </div>

            <div className="p-2 space-y-1">
                <div className="min-w-0 flex items-center gap-2 h-[16px]">
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                    <div className="h-2.5 w-1/4 bg-white/5 rounded" />
                </div>

                <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="h-[26px] w-[31px] rounded-md bg-white/5 border border-white/10" />
                        <div className="h-[26px] w-[31px] rounded-md bg-white/5 border border-white/10" />
                    </div>
                    <div className="h-[26px] w-[31px] rounded-md bg-red-600/5 border border-red-500/20" />
                </div>
            </div>
        </div>
    );

    const gridClasses = "w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3 md:gap-4 grid-rows:[repeat(3,minmax(0,1fr))]";

    return (
        <section className="flex-1 min-w-0 max-w-full px-0 sm:px-3 md:px-6 bg-primaryDottedSize bg-primaryDotted">
            <div className="w-full mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between px-2 sm:pt-10 pt-5">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Your uploads</h1>
                        <div className="mt-1 text-sm text-gray-400">
                            Page {currentPage + 1} of {totalPages}
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
                                fetchImages(currentPage);
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
                    style={{ minHeight: "calc(3 * 220px + 56px + 2rem)" }}
                >
                    <div className="flex-1 flex items-stretch">
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
                                {userError ? 'Could not load user.' : 'No uploads on this page.'}
                            </div>
                        )}

                        {/* Content with staggered animation */}
                        {!loading && items.length > 0 && (
                            <ul className={gridClasses}>
                                {items.map((img, index) => {
                                    const isVisible = index < visibleCount;
                                    return (
                                        <li key={img.uniqueId} className="relative group">
                                            {/* Skeleton layer */}
                                            <div
                                                className={`absolute inset-0 z-0 transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                            >
                                                <SkeletonCard animate={!isVisible} />
                                            </div>

                                            {/* Content layer */}
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

                    {/* ✅ Improved Paginator */}
                    <div className="border-t border-white/10 pt-3 pb-1 flex justify-center items-center gap-2 md:gap-4 bg-black/0 mt-4 min-h-[56px] flex-wrap">
                        {/* Previous button (visible if not on first page) */}
                        {currentPage > 0 && (
                            <button
                                onClick={goToPrevPage}
                                disabled={loading}
                                className="rounded-lg border border-white/10 px-2 py-2 bg-secondary hover:bg-white/10 transition-colors text-sm flex items-center justify-center disabled:opacity-40"
                                aria-label="Previous page"
                            >
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}

                        {/* Page numbers */}
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
                            {getPageNumbers().map((pageNum, idx) => (
                                pageNum === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-1 text-gray-500">...</span>
                                ) : (
                                    <button
                                        key={`page-${pageNum}`}
                                        onClick={() => goToPage(pageNum as number)}
                                        disabled={loading || pageNum === currentPage}
                                        className={`rounded-lg px-2.5 py-1.5 text-xs md:text-sm font-semibold transition-colors ${
                                            pageNum === currentPage
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-white/10 bg-secondary hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-40'
                                        }`}
                                    >
                                        {(pageNum as number) + 1}
                                    </button>
                                )
                            ))}
                        </div>

                        {/* Next button (visible if not on last page) */}
                        {currentPage < totalPages - 1 && (
                            <button
                                onClick={goToNextPage}
                                disabled={loading}
                                className="rounded-lg border border-white/10 px-2 py-2 bg-secondary hover:bg-white/10 transition-colors text-sm flex items-center justify-center disabled:opacity-40"
                                aria-label="Next page"
                            >
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// MediaCard component remains the same as before
function MediaCard({ item, onDelete, lang }: { item: UploadedImagePage; onDelete: () => void, lang: LanguageModel }) {
    const isVideo = isVideoFile(item.type || '');
    const [imgFailed, setImgFailed] = useState(false);

    // Handle new URL structure from pageable endpoint
    const urls = {
        original: item.urls?.rawUrl || item.urls?.userPreference || '',
        portalUrl: item.urls?.portalUrl || '',
        shortUrl: item.urls?.shortUrl || '',
    };

    const title = deriveTitle(item, urls.original);
    const size = formatBytes(item.size || 0);

    const showPlaceholder = imgFailed || !urls.original || item.size === 0;
    const rawUrl = (item.location === "LOCAL" && !item.public) ? item.urls?.webUrl : urls.original;

    return (
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
                        preload="metadata"
                        poster={item.urls?.posterUrl || undefined}
                        controls={true}
                        style={{ minHeight: 0 }}
                    >
                        <source src={urls.original} type="video/mp4" />
                    </video>
                ) : (
                    <img
                        src={rawUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        style={{ minHeight: 0 }}
                        onError={() => setImgFailed(true)}
                    />
                )}

                {/* Badges */}
                <div className="absolute right-1 top-1 flex items-center gap-1 z-10">
                    <span className="inline-flex items-center gap-1 bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10">
                        <FaInfoCircle className="h-3 w-3" />
                    </span>
                    <span
                        onClick={() => copyToClipboard(urls.original, lang)}
                        className="cursor-pointer inline-flex items-center gap-1 bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10"
                    >
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
                <div className="min-w-0 flex items-center gap-2 h-[16px]">
                    <p className="text-xs font-semibold truncate" title={title}>
                        {title}.{item.type}
                    </p>
                    <p className="text-[10px] text-gray-400 flex-shrink-0">({size})</p>
                </div>

                {/* Actions */}
                <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                            href={urls.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs border border-white/10 bg-primary hover:bg-secondary transition-colors"
                            aria-label="Open"
                            title="Open"
                        >
                            <FaExternalLinkAlt className="h-4 w-4" />
                        </a>
                        <a
                            href={urls.original + "?download=true"}
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
        </div>
    );
}

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