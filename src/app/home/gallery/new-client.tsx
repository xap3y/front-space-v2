'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { FaExternalLinkAlt, FaRegTrashAlt, FaDownload, FaLock } from 'react-icons/fa';
import { FaRotateRight } from 'react-icons/fa6';
import {copyToClipboard, deleteImageApi as apiDeleteImage, errorToast, okToast} from "@/lib/client";
import {getUserImages} from "@/lib/apiGetters";
import {UploadedImage} from "@/types/image";
import {isVideoFile} from "@/lib/core";

type DefaultResponse = { error: boolean; message: string };

function isErrorResponse(x: unknown): x is DefaultResponse {
    return !!x && typeof x === 'object' && 'error' in (x as any) && typeof (x as any).error === 'boolean';
}

export default function GalleryPage() {
    const { user, loadingUser, error: userError } = useUser();
    const [items, setItems] = useState<UploadedImage[]>([]);
    const [loading, setLoading] = useState(false);

    const canLoad = !!user?.uid && !loadingUser;

    const fetchImages = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            const res = await getUserImages(String(user.uid));
            if (isErrorResponse(res)) {
                if (res.error) {
                    errorToast(res.message || 'Failed to load images');
                    setItems([]);
                } else {
                    setItems([]);
                }
            } else {
                setItems(res || []);
            }
        } catch {
            errorToast('Failed to load images');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        if (canLoad) fetchImages();
    }, [canLoad, fetchImages]);

    const handleDelete = useCallback(async (img: UploadedImage) => {
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

    return (
        <section className="flex-1 min-w-0 md:pt-0 pt-14 px-0 sm:px-3 md:px-6 bg-primaryDottedSize bg-primaryDotted">
            {/* Use full width between sidebar and page edge */}
            <div className="w-full mx-auto space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between px-2 sm:pt-10 pt-5">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Your uploads</h1>
                    <button
                        onClick={fetchImages}
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
                <div className="sm:rounded-xl border border-white/10 bg-transparent sm:p-3 p-2 md:p-4">
                    {/* Loading skeletons */}
                    {loading && (
                        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <li key={i} className="rounded-xl overflow-hidden border border-white/10 bg-[#1b1f26]">
                                    <div className="w-full aspect-[4/3] bg-white/5 animate-pulse" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                                        <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
                                        <div className="h-8 w-full bg-white/5 rounded animate-pulse" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Error / Empty */}
                    {!loading && (userError || (!items.length && canLoad)) && (
                        <div className="px-2 py-10 text-center text-sm text-gray-400">
                            {userError ? 'Could not load user.' : 'No uploads yet.'}
                        </div>
                    )}

                    {/* List */}
                    {!loading && items.length > 0 && (
                        <ul className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
                            {items.map((img) => (
                                <li key={img.uniqueId}>
                                    <MediaCard
                                        item={img}
                                        onDelete={() => handleDelete(img)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}

function MediaCard({ item, onDelete }: { item: UploadedImage; onDelete: () => void }) {
    const isVideo = isVideoFile(item.type || '');
    const urls = normalizeUrls(item);
    const title = deriveTitle(item, urls.original);
    const size = formatBytes(item.size || 0);

    const [imgFailed, setImgFailed] = useState(false);

    const showPlaceholder = imgFailed || !urls.original || item.size === 0;

    return (
        <div className="group rounded-xl border border-white/10 bg-primary hover:bg-secondary transition-colors">
            {/* Preview (clip inside) */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-xl bg-black">
                {showPlaceholder ? (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary to-black/60 text-white/80 p-3">
                        <div className="text-center">
                            <div className="text-xs text-gray-300 mb-1">Image - error</div>
                            <div className="font-mono text-sm break-all">{item.uniqueId}</div>
                        </div>
                    </div>
                ) : isVideo ? (
                    <video
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        preload="metadata"
                        controls={true}
                    >
                        <source src={item.urlSet.customUrl || item.urlSet.rawUrl} type="video/mp4" />
                    </video>
                ) : (
                    <img
                        src={urls.thumb || urls.original}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
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
                <div className="absolute right-2 top-2 flex items-center gap-2 z-10">
                    {item.requiresPassword && (
                        <span className="inline-flex items-center gap-1 bg-black/60 text-xs px-2 py-1 rounded-md border border-white/10">
              <FaLock className="h-3 w-3" />
              Locked
            </span>
                    )}
                    <span className="inline-flex items-center bg-black/60 text-xs px-2 py-1 rounded-md border border-white/10">
            {isVideo ? 'Video' : 'Image'}
          </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" title={title}>{title + "." + item.type}</p>
                    <p className="text-xs text-gray-400">{size}</p>
                </div>
                {/*{!!item.description && (
                    <p className="text-xs text-gray-300 break-words" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={item.description}>
                        {item.description}
                    </p>
                )}*/}

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                            href={urls.original}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border border-white/10 bg-primary hover:bg-secondary transition-colors"
                            aria-label="Open"
                            title="Open"
                        >
                            <FaExternalLinkAlt className="h-4 w-4" />
                            <span className="hidden 3xl:inline">Open</span>
                        </a>
                        <a
                            href={(item.urlSet.rawUrl || urls.original) + "?download=true"}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border border-white/10 bg-primary hover:bg-secondary transition-colors"
                            aria-label="Download"
                            title="Download"
                        >
                            <FaDownload className="h-4 w-4" />
                            <span className="hidden 3xl:inline">Download</span>
                        </a>
                    </div>
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border border-red-500/30 bg-red-600/10 hover:bg-red-600/15 text-red-300 transition-colors flex-shrink-0"
                        aria-label="Delete"
                        title="Delete"
                    >
                        <FaRegTrashAlt className="h-4 w-4" />
                        <span className="hidden 3xl:inline">Delete</span>
                    </button>
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