'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import {FaRegCopy, FaTrash, FaRotateRight, FaPlus, FaChevronLeft, FaChevronRight} from 'react-icons/fa6';
import { format } from 'date-fns';
import {ShortUrlDto} from "@/types/url";
import {getUserShortUrls} from "@/lib/apiGetters";
import {toast} from "react-toastify";
import {deleteShortUrl} from "@/lib/apiPoster";
import {FaExternalLinkAlt} from "react-icons/fa";
import {errorToast} from "@/lib/client";
import LoadingPage from "@/components/LoadingPage";
import {useRouter} from "next/navigation";

type DefaultResponse = { error: boolean; message: string };

const ITEMS_PER_PAGE = 15;

function isErrorResponse(x: unknown): x is DefaultResponse {
    return !!x && typeof x === 'object' && 'error' in (x as any) && typeof (x as any).error === 'boolean';
}

export default function UrlsPage() {
    const { user, loadingUser, error: userError } = useUser();
    const [urls, setUrls] = useState<ShortUrlDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const canLoad = !!user?.uid && !loadingUser;
    const router = useRouter();

    const totalPages = Math.ceil(urls.length / ITEMS_PER_PAGE);
    const paginatedUrls = urls.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const fetchUrls = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            setCurrentPage(1);
            const res: ShortUrlDto[] | DefaultResponse = await getUserShortUrls(String(user.uid));
            if (isErrorResponse(res)) {
                if (res.error) {
                    if (res.message.includes("No short urls found")) return
                    errorToast(res.message || 'Failed to load URLs');
                    setUrls([]);
                } else {
                    setUrls([]);
                }
            } else {
                setUrls(res || []);
            }
        } catch (e) {
            errorToast('Failed to load URLs');
            setUrls([]);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        if (canLoad) fetchUrls();
    }, [canLoad, fetchUrls]);

    useEffect(() => {
        if (!loadingUser && !user) {
            router.push("/login");
        }
    }, [user, loadingUser])

    const handleCopy = async (shortUrl: string) => {
        if (!shortUrl) {
            errorToast('No short URL to copy');
            return;
        }
        try {
            await navigator.clipboard.writeText(shortUrl);
            toast.success('Copied', { closeOnClick: true});
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = shortUrl;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                toast.success('Copied', { closeOnClick: true});
            } catch {
                errorToast('Copy failed');
            }
        }
    };

    const handleDelete = async (url: ShortUrlDto) => {
        if (!user?.apiKey) return;
        try {
            const res = await deleteShortUrl(url, user.apiKey);
            if (isErrorResponse(res)) {
                if (res.error) {
                    errorToast(res.message);
                    return;
                }
            }
            const newUrls = urls.filter((item) => item.uniqueId !== url.uniqueId);
            setUrls(newUrls);

            const newTotalPages = Math.ceil(newUrls.length / ITEMS_PER_PAGE);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }

            toast.success('Deleted.');
        } catch {
            errorToast('Delete failed');
        }
    };

    if (loadingUser || !user) return <LoadingPage />;

    return (
        <section className="flex-1 min-w-0 pt-0 px-2 md:px-6">
            <div className="max-w-6xl mx-auto w-full space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between pt-4 md:pt-5 pb-1">
                    <h1 className="text-base md:text-xl font-semibold">Short URLs</h1>
                    <div className="flex gap-1.5">
                        <a href={"/a/url"}>
                            <button
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-transparent hover:bg-white/10 transition-colors text-xs"
                                disabled={loading}
                                title="New"
                            >
                                <FaPlus className="h-3 w-3" />
                                <span className="hidden sm:inline">New</span>
                            </button>
                        </a>
                        <button
                            onClick={fetchUrls}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-transparent hover:bg-white/10 transition-colors text-xs"
                            disabled={loading}
                            title="Refresh"
                        >
                            <FaRotateRight className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Card */}
                <div className="box-primary overflow-hidden">
                    {/* Ghost Loading */}
                    {loading && (
                        <ul className="divide-y divide-white/10">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <li key={i} className="px-2 py-1.5 group">
                                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                                        {/* Short URL skeleton */}
                                        <div className="h-3 w-32 md:w-48 bg-white/10 rounded animate-pulse flex-shrink-0" />

                                        {/* Stats skeleton */}
                                        <div className="hidden md:flex items-center gap-2">
                                            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                                            <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                                        </div>

                                        {/* Original URL skeleton */}
                                        <div className="hidden lg:block h-3 flex-1 min-w-0 bg-white/10 rounded animate-pulse" />

                                        {/* Actions skeleton */}
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                            <div className="h-7 w-7 bg-white/10 rounded animate-pulse" />
                                            <div className="h-7 w-7 bg-white/10 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Error / Empty */}
                    {!loading && (userError || (!urls.length && canLoad)) && (
                        <div className="px-2 py-6 text-center text-xs text-gray-400">
                            {userError ? 'Could not load user.' : 'No short URLs yet.'}
                        </div>
                    )}

                    {/* List */}
                    {!loading && urls.length > 0 && (
                        <>
                            <ul className="divide-y divide-white/10 text-xs">
                                {paginatedUrls.map((u) => (
                                    <UrlRow
                                        key={u.uniqueId}
                                        url={u}
                                        onCopy={() => handleCopy(u.urlSet?.shortUrl || "")}
                                        onDelete={() => handleDelete(u)}
                                    />
                                ))}
                            </ul>

                            {/* Pagination Footer */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/10 bg-white/2">
                                    <div className="text-xs text-gray-400">
                                        {currentPage} / {totalPages}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1 rounded border border-white/10 bg-transparent hover:bg-white/10 disabled:opacity-30 transition-colors"
                                            title="Prev"
                                        >
                                            <FaChevronLeft className="h-2.5 w-2.5" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-1 rounded border border-white/10 bg-transparent hover:bg-white/10 disabled:opacity-30 transition-colors"
                                            title="Next"
                                        >
                                            <FaChevronRight className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

function UrlRow({
                    url,
                    onCopy,
                    onDelete
                }: {
    url: ShortUrlDto;
    onCopy: () => void;
    onDelete: () => void;
}) {
    const shortUrl = url.urlSet?.shortUrl || '';
    const created = safeFormat(url.createdAt);

    return (
        <li className="px-2 py-1.5 group hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                {/* Short URL */}
                <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sky-300 hover:text-sky-200 inline-flex items-center gap-1 text-xs flex-shrink-0"
                    title={shortUrl}
                >
                    {shortUrl}
                    <FaExternalLinkAlt className="h-2.5 w-2.5 opacity-70" />
                </a>

                {/* Stats - Visits & Created */}
                <div className="hidden md:flex items-center gap-2 text-gray-400 text-xs flex-shrink-0">
                    <span>•</span>
                    <span>{url.visits ?? 0} visits</span>
                    <span>•</span>
                    <span>{created}</span>
                </div>

                {/* Original URL (hidden on small screens) */}
                <div className="hidden lg:block truncate text-gray-500 text-xs flex-1 min-w-0" title={url.originalUrl}>
                    → {url.originalUrl}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                    <button
                        onClick={onCopy}
                        className="p-1.5 rounded border border-white/10 bg-primary1 hover:bg-primary0 transition-colors text-gray-200"
                        title="Copy"
                    >
                        <FaRegCopy className="h-3 w-3" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded border border-red-500/30 bg-red-600/10 hover:bg-red-600/15 text-red-400 transition-colors"
                        title="Delete"
                    >
                        <FaTrash className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Original URL (shown on small screens) */}
            <div className="md:hidden text-gray-500 text-xs truncate mt-1" title={url.originalUrl}>
                {url.originalUrl}
            </div>
        </li>
    );
}

function safeFormat(iso: string | undefined) {
    if (!iso) return '-';
    try {
        return format(new Date(iso), 'MM/dd/yy');
    } catch {
        return '-';
    }
}