'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import {FaExternalLinkAlt, FaRegTrashAlt, FaDownload, FaLock, FaCopy, FaInfoCircle} from 'react-icons/fa';
import {FaInfo, FaRotateRight} from 'react-icons/fa6';
import {copyToClipboard, deleteImageApi as apiDeleteImage, errorToast, okToast} from "@/lib/client";
import {getUserImages} from "@/lib/apiGetters";
import {UploadedImage} from "@/types/image";
import {isVideoFile} from "@/lib/core";
import LoadingPage from "@/components/LoadingPage";
import {useRouter} from "next/navigation";
import {useGalleryRows} from "@/hooks/useGalleryRow";
import {useTranslation} from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import {useIsMobile} from "@/hooks/utils";
import {useHoverCard} from "@/hooks/useHoverCard";

type DefaultResponse = { error: boolean; message: string };

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

    const lang = useTranslation();

    const canLoad = !!user?.uid && !loadingUser;

    const rowMode = useGalleryRows();

    const columnsMobile = 2;
    const columnsDesktop = 7;

    const imagesPerPage =
        rowMode === "mobile"
            ? columnsMobile * 5
            : columnsDesktop * 3;

    const router = useRouter()

    /*const fetchImages2 = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const res = await getUserImages(String(user.uid));
            if (isErrorResponse(res)) {
                if (res.error) {
                    errorToast(res.message || 'Failed to load images');
                    setItems([]);
                } else {
                    setItems([]);
                }
            } else {
                setItems(res?.data as UploadedImage[] || []);
            }
        } catch {
            errorToast('Failed to load images');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);*/

    const addToImages = useCallback((newImages: UploadedImage[]) => {
        setItems(prev => {
            const existingIds = new Set(prev.map(img => img.uniqueId));
            const filteredNewImages = newImages.filter(img => !existingIds.has(img.uniqueId));
            // log out dupes
            if (filteredNewImages.length < newImages.length) {
                console.log(`Filtered out ${newImages.length - filteredNewImages.length} duplicate images`);
                // loop and log duped ids
                newImages.forEach(img => {
                    if (existingIds.has(img.uniqueId)) {
                        console.log(`Duplicate image id: ${img.uniqueId}`);
                    }
                });
            }
            return [...prev, ...filteredNewImages];
        });
    }, []);

    async function fetchImages(direction: "next" | "prev" | "first" = "first") {
        if (!user?.uid) return;
        console.log("-------------START--------------")
        console.log(imagesPerPage + " < imagesPerPage")
        if (usedPages.includes(page+1)) {
            console.log("Page " + page + " already used, not fetching")
            return;
        }

        if (direction === "prev") return;

        setLoading(true);


        if (direction === "first") {
            setUsedPages([1])
        }

        const actualFromDate = (direction === "first") ? 0 : (fromDate != null ? fromDate : 0);
        console.log("Fetching images for user " + user.uid + " from date " + actualFromDate + " direction " + direction)
        console.log("AC DATE: " + actualFromDate)

        try {
            const res = await getUserImages(String(user.uid), actualFromDate, imagesPerPage);
            if (res?.error == true) {
                errorToast(res.message || 'Failed to load images');
                setItems([]);
            }
            console.log("data count is " + res?.count)
            const images = res?.data as UploadedImage[]
            if (res && images.length > 0) {

                console.log("Got " + images.length + " images, total is " + (res?.count || 0))
                // miliseconds to seconds

                console.log("AC UID: " + images[images.length - 1].uniqueId + " DATE " + images[images.length - 1].uploadedAt)

                const mili = new Date(images[images.length - 1].uploadedAt).getTime() - 1;
                console.log("last image date is " + images[images.length - 1].uploadedAt + " which is " + mili + " in miliseconds")
                // first
                console.log("first image date is " + images[0].uploadedAt + " which is " + new Date(images[0].uploadedAt).getTime() + " in miliseconds" + " and " + Math.floor(new Date(images[0].uploadedAt).getTime() / 1000) + " in seconds")
                setFromDate(mili);
                console.log("AC SET TO " + mili)
                console.log("AC REAL " + new Date(images[images.length - 1].uploadedAt))
                addToImages(images)
                setTotalItems(res?.count || 0);
            }
        } catch {
            setItems([]);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 200)
            console.log("-------------DONE--------------")
        }
    }

    useEffect(() => {
        if (canLoad) {
            console.log("Can load, fetching images")
            fetchImages();
        }
    }, [canLoad]);

    useEffect(() => {
        console.log("Items changed, total is " + items.length)
        console.log("Items changed, total is " + items.length)
    }, [items]);

    useEffect(() => {
        if (loadingUser) return
        if (!user && !loadingUser) {
            setLoading(true)
            router.push("/login")
        }
    }, [user, loadingUser]);

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
            setUsedPages(prev => prev.filter(p => p !== (page + 1)));
            okToast('Deleted.');
        } catch {
            errorToast('Delete failed');
        }
    }, [user?.apiKey, page]);

    const totalPages = Math.max(1, Math.ceil(totalItems / imagesPerPage));
    const pagedItems = useMemo(() => {
        console.log("Calculating paged items for page " + page)
        console.log("Items size " + items.length)
        if (items.length === 0) return [];
        if (page < 1) return [];
        if (page > totalPages) return [];
        const start = (page - 1) * imagesPerPage;
        const end = page * imagesPerPage;
        console.log("Slicing items from " + start + " to " + end)
        //setLoading(false)
        return items.slice(start, end);
    }, [items, page, totalPages]);


    useEffect(() => {
        if (!loading && pagedItems.length === 0 && page > 1) {
            setPage(page - 1);
        }
        if (page > totalPages) {
            setPage(totalPages);
        }
        console.log("Paged items changed, length is " + pagedItems.length + " for page " + page + " total pages " + totalPages + " loading is " + loading)
        if (pagedItems.length < 1) {
            setPage(1);
        }
    }, [items, pagedItems.length, page, totalPages, loading]);

    useEffect(() => {
        const needFill = pagedItems.length < imagesPerPage;
        const haveMoreServer = totalItems > items.length;
        if (!loading && needFill && haveMoreServer && canLoad) {
            setUsedPages(prev => prev.filter(p => p !== (page + 1)));
            fetchImages("next");
        }
    }, [pagedItems.length, imagesPerPage, totalItems, items.length, loading, canLoad, page]);

    const goToNextPage = () => {
        if (pagedItems.length < imagesPerPage) return errorToast("No more pages");
        setPage(page + 1);
        setUsedPages(prev => [...prev, page+1]);
        //fetchImages("next");
        fetchImages("next");
    };

    const goToPrevPage = () => {
        setPage(page - 1);
        setUsedPages(prev => [...prev, page-1]);
        console.log("Going to prev page, current page is " + page)
        fetchImages("prev");
    };

    if (loadingUser) {
        return (
            <LoadingPage />
        )
    }

    return (
        <section className="flex-1 min-w-0 max-w-full px-0 sm:px-3 md:px-6 bg-primaryDottedSize bg-primaryDotted">
            {/* Use full width between sidebar and page edge */}
            <div className="w-full mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between px-2 sm:pt-10 pt-5">
                    <div className={"flex flex-col"}>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Your uploads</h1>

                        {/* New upload button, keep vercel style like */}
                        <div className="mt-1 text-sm text-gray-400">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setLoading(true)
                            // timeout to show loading
                            setTimeout(() => {
                                errorToast("Not implemented yet") // TODO
                                setLoading(false)
                            }, 500);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-secondary hover:bg-white/10 transition-colors text-sm"
                        disabled={loading}
                        aria-label="Refresh list"
                        title="Refresh"
                    >
                        <FaRotateRight className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>

                {/* Grid card area */}
                <div
                    className="flex flex-col sm:rounded-xl border border-white/10 bg-transparent sm:p-3 p-2 md:p-4"
                    style={{ minHeight: "calc(3 * 180px + 56px + 2rem)" }}
                >
                    {/* Grid card area */}
                    <div className="flex-1 flex items-stretch">
                        {loading && (
                            <ul className={`w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3 md:gap-4`}>
                                {Array.from({ length: imagesPerPage }).map((_, i) => (
                                    <li key={i} className="min-w-[150px] rounded-md overflow-hidden border border-white/10 bg-primary hover:bg-secondary">
                                        <div className="w-full aspect-[4/3] bg-white/5 animate-pulse" />
                                        <div className="p-2 space-y-1">
                                            <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                                            <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
                                            <div className="h-8 w-full bg-white/5 rounded animate-pulse" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!loading && (userError || (!items.length && canLoad)) && (
                            <div className="px-2 py-10 text-center text-sm text-gray-400">
                                {userError ? 'Could not load user.' : 'No uploads yet.'}
                            </div>
                        )}

                        {!loading && pagedItems.length > 0 && (
                            <ul className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3 md:gap-4`}>
                                {pagedItems.map((img) => (
                                    <li key={img.uniqueId}>
                                        <MediaCard
                                            item={img}
                                            onDelete={() => handleDelete(img)}
                                            lang={lang}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Paginator: always sticks to bottom */}
                    <div className="border-t border-white/10 pt-3 pb-1 flex justify-center items-center gap-4 bg-black/0 mt-4 min-h-[56px]">
                        <button
                            onClick={goToPrevPage}
                            disabled={page <= 1}
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
                            disabled={page >= totalPages}
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

    const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);

    const [imgFailed, setImgFailed] = useState(false);

    const showPlaceholder = imgFailed || !urls.original || item.size === 0;

    return (
        <div onMouseMove={handleMouseMove} className="group rounded-md border border-white/10 bg-primary hover:bg-secondary transition-colors">
            {/* Preview */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-md bg-black" style={{ minHeight: 0 }}>
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
                        src={urls.thumb || urls.original}
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
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className="inline-flex items-center gap-1 bg-black/60 text-[10px] px-1 py-0.5 rounded border border-white/10">
                          <FaInfoCircle className="h-3 w-3" />
                    </span>
                    <span onClick={(event) => {
                        // check if user is holding shift
                        let copyText = item.urlSet.userPreferences || item.urlSet.rawUrl || urls.original;
                        if (event.shiftKey) copyText = item.urlSet.portalUrl
                        else if (event.ctrlKey) copyText = item.urlSet.rawUrl
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
            <div className="p-2 space-y-1">
                <div className="min-w-0 flex items-center gap-2">
                    <p className="text-xs font-semibold truncate" title={title}>
                        {title + "." + item.type}
                    </p>
                    <p className="text-[10px] text-gray-400">{"(" + size + ")"}</p>
                </div>

                {/* Actions - icons only */}
                <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                            href={urls.original}
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

            <div className={`pointer-events-none transition-all duration-200 ease-out transform ${
                showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } absolute bg-secondary shadow-lg rounded-lg p-2 z-50 flex flex-row gap-4`} style={{ top: position.y + 10, left: position.x + 15 }}>
                <div className={"flex gap-1 flex-col text-sm text-zinc-300"}>
                    <span className={"flex gap-2 flex-row"}>
                        <p>Uploaded at:</p>
                        <p>{new Date(item.uploadedAt).toLocaleString()}</p>
                    </span>

                    <span className={"flex gap-2 flex-row"}>
                        <p>File type:</p>
                        <p>{item.type}</p>
                    </span>

                    <span className={"flex gap-2 flex-row"}>
                        <p>Location:</p>
                        <p>{item.location}</p>
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Try to derive reasonable URLs from UrlSet without relying on exact field names.
 */
function normalizeUrls(item: UploadedImage): { original: string; thumb?: string; download?: string } {
    const any = (item as any)?.urlSet || {};
    const original =
        any.fileUrl ||
        any.rawUrl ||
        any.originalUrl ||
        any.downloadUrl ||
        any.shortUrl ||
        any.url ||
        '';
    const thumb =
        any.thumbnailUrl ||
        any.thumbUrl ||
        any.thumb ||
        any.previewUrl ||
        (typeof original === 'string' && original) ||
        undefined;
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