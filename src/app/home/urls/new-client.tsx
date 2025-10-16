'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser'; // adjust to your actual path
import { FaRegCopy, FaTrash, FaRotateRight } from 'react-icons/fa6';
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

function isErrorResponse(x: unknown): x is DefaultResponse {
    return !!x && typeof x === 'object' && 'error' in (x as any) && typeof (x as any).error === 'boolean';
}

export default function UrlsPage() {
    const { user, loadingUser, error: userError } = useUser();
    const [urls, setUrls] = useState<ShortUrlDto[]>([]);
    const [loading, setLoading] = useState(false);

    const canLoad = !!user?.uid && !loadingUser;

    const router = useRouter();

    const fetchUrls = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
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
            setUrls(prev => prev.filter((item) => item.uniqueId !== url.uniqueId));
            toast.success('Deleted.');
        } catch {
            errorToast('Delete failed');
        }
    };

    if (loadingUser || !user) return <LoadingPage />;

    return (
        <section className="flex-1 min-w-0 md:pt-0 pt-14 px-3 md:px-6">
            <div className="max-w-5xl mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between lg:pt-5 pt-10">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Short URLs</h1>
                    <button
                        onClick={fetchUrls}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/10 transition-colors text-sm"
                        disabled={loading}
                        aria-label="Refresh list"
                        title="Refresh"
                    >
                        <FaRotateRight className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-white/10 bg-primary2 overflow-hidden">
                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-[1fr,220px,140px] items-center px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
                        <div>URL</div>
                        <div>Stats</div>
                        <div className="justify-self-end">Actions</div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <ul className="divide-y divide-white/10">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <li key={i} className="px-4 py-4">
                                    <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse mb-2" />
                                    <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Error / Empty */}
                    {!loading && (userError || (!urls.length && canLoad)) && (
                        <div className="px-4 py-10 text-center text-sm text-gray-400">
                            {userError ? 'Could not load user.' : 'No short URLs yet.'}
                        </div>
                    )}

                    {/* List */}
                    {!loading && urls.length > 0 && (
                        <ul className="divide-y divide-white/10">
                            {urls.map((u) => (
                                <UrlRow
                                    key={u.uniqueId}
                                    url={u}
                                    onCopy={() => handleCopy(u.urlSet?.shortUrl || "")}
                                    onDelete={() => handleDelete(u)}
                                />
                            ))}
                        </ul>
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
        <li className="px-4 py-3 group transition-colors hover:bg-white/5">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_140px] gap-3 items-center">
                {/* URL info */}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-sky-300 hover:text-sky-200 inline-flex items-center gap-1"
                            title={shortUrl}
                        >
                            {shortUrl}
                            <FaExternalLinkAlt className="h-3 w-3 opacity-70" />
                        </a>
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-1" title={url.originalUrl}>
                        {url.originalUrl}
                    </div>
                </div>

                {/* Stats (auto-size on md+, wraps on small) */}
                <div className="flex flex-wrap md:flex-nowrap gap-x-4 mr-14 gap-y-1 text-xs text-gray-300 min-w-0">
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-400">Visits:</span>
                        <span className="font-semibold">{url.visits ?? 0}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-400">Created:</span>
                        <span className="font-mono tabular-nums">{created}</span>
                    </div>
                </div>

                {/* Actions (right-aligned in grid) */}
                <div className="flex items-center gap-2 justify-self-end">
                    <button
                        onClick={onCopy}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border border-white/10 bg-primary1 hover:bg-primary0 transition-colors"
                        aria-label="Copy short URL"
                        title="Copy short URL"
                    >
                        <FaRegCopy className="h-4 w-4" />
                        <span className="inline">Copy</span>
                    </button>
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border border-red-500/30 bg-red-600/10 hover:bg-red-600/15 text-red-300 transition-colors"
                        aria-label="Delete"
                        title="Delete"
                    >
                        <FaTrash className="h-4 w-4" />
                        <span className="inline">Delete</span>
                    </button>
                </div>
            </div>
        </li>
    );
}

function safeFormat(iso: string | undefined) {
    if (!iso) return '-';
    try {
        return format(new Date(iso), 'yyyy-MM-dd');
    } catch {
        return '-';
    }
}