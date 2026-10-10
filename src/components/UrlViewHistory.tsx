"use client";

import {useEffect, useState} from "react";
import {FaChevronLeft, FaChevronRight, FaEye} from "react-icons/fa6";
import HoverDiv from "@/components/HoverDiv";
import {getApiUrl} from "@/lib/core";

type Visit = {
    id: number;
    time: string;
    viewer: {uid: number; username: string; avatar?: string} | null;
    ipAddress?: string | null;
    userAgent?: string | null;
};

type Props = {
    urlId: string;
    admin?: boolean;
    defaultOpen?: boolean;
};

export default function UrlViewHistory({urlId, admin = false, defaultOpen = false}: Props) {
    const [open, setOpen] = useState(defaultOpen);
    const [page, setPage] = useState(0);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError("");
        fetch(`${getApiUrl()}/v1/url/get/${encodeURIComponent(urlId)}/views${admin ? "/admin" : ""}?page=${page}`, {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async response => {
                const body = await response.json();
                if (!response.ok || body.error) {
                    throw new Error(body.message || "Failed to load visit history");
                }
                return body.message;
            })
            .then(result => {
                if (!controller.signal.aborted) {
                    setVisits(result.content);
                    setPages(Math.max(1, result.totalPages));
                    setTotal(result.totalElements);
                }
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setError(error.message);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });
        return () => controller.abort();
    }, [open, urlId, page, admin]);

    return (
        <div className="my-1.5 space-y-2 text-xs">
            {!defaultOpen && (
                <HoverDiv
                    type="INFO"
                    icon={<FaEye />}
                    onClick={() => setOpen(value => !value)}
                    aria-expanded={open}
                    className="px-2 py-1 text-[10px] text-zinc-400"
                >
                    View history
                </HoverDiv>
            )}
            {open && (
                <div className="rounded-md border border-zinc-800 bg-black/20 p-2">
                    {error ? (
                        <p role="alert" className="py-2 text-red-400">{error}</p>
                    ) : loading ? (
                        <div className="animate-pulse space-y-2" aria-label="Loading visit history">
                            {Array.from({length: 3}).map((_, index) => (
                                <div key={index} className="flex h-8 items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-white/5" />
                                    <div className="h-2 w-24 rounded bg-white/5" />
                                    <div className="ml-auto h-2 w-28 rounded bg-white/5" />
                                </div>
                            ))}
                        </div>
                    ) : visits.length === 0 ? (
                        <p className="py-3 text-center text-zinc-600">No visits yet.</p>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {visits.map(visit => (
                                <div key={visit.id} className="space-y-1 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {visit.viewer?.avatar && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={visit.viewer.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                                        )}
                                        <span className="text-[11px] text-zinc-300">{visit.viewer?.username ?? "Anonymous"}</span>
                                        {visit.ipAddress && <code className="text-[10px] text-zinc-500">{visit.ipAddress}</code>}
                                        <time className="ml-auto text-[10px] text-zinc-600" dateTime={visit.time}>
                                            {new Date(visit.time).toLocaleString()}
                                        </time>
                                    </div>
                                    {visit.userAgent && <p className="break-all text-[10px] text-zinc-600">{visit.userAgent}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2 text-[10px] text-zinc-500">
                        <span>{total} visits · {page + 1} / {pages}</span>
                        <div className="flex gap-1">
                            <HoverDiv
                                type="INFO"
                                icon={<FaChevronLeft />}
                                disabled={loading || page === 0}
                                onClick={() => setPage(value => value - 1)}
                                aria-label="Previous visits"
                                className="h-6 w-6"
                            />
                            <HoverDiv
                                type="INFO"
                                icon={<FaChevronRight />}
                                disabled={loading || page + 1 >= pages}
                                onClick={() => setPage(value => value + 1)}
                                aria-label="Next visits"
                                className="h-6 w-6"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
