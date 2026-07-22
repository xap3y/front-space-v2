"use client";

import {usePage} from "@/context/PageContext";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useUser} from "@/hooks/useUser";
import {useRouter} from "next/navigation";

import {getUserPastes} from "@/lib/apiGetters";
import {PasteDto} from "@/types/paste";
import {errorToast, infoToast} from "@/lib/client";
import {DefaultResponse} from "@/types/core";
import {FaLock, FaPlus, FaRotateRight, FaTrash, FaChevronLeft, FaChevronRight} from "react-icons/fa6";
import {FaExternalLinkAlt, FaRegCopy} from "react-icons/fa";
import HoverDiv from "@/components/HoverDiv";

function isErrorResponse(x: unknown): x is DefaultResponse {
    return !!x && typeof x === 'object' && 'error' in (x as any) && typeof (x as any).error === 'boolean';
}

export default function HomePastesPage() {
    const { setPage } = usePage();
    const { user, loadingUser, error: userError } = useUser();
    const router = useRouter();

    const [pastes, setPastes] = useState<PasteDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [page, setPageIdx] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const canLoad = !!user?.uid && !loadingUser;

    const fetchPastes = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        setErr("");
        try {
            const res = await getUserPastes(String(user.uid));
            if (isErrorResponse(res)) {
                if (res.error) {
                    if (res.message !== "Resource not found") {
                        errorToast(res.message || "Failed to load pastes");
                        setErr(res.message || "Failed to load pastes");
                    }
                }
                setPastes([]);
            } else {
                setPastes(res ?? []);
            }
        } catch (e: any) {
            errorToast(e?.message ?? "Failed to load pastes");
            setErr(e?.message ?? "Failed to load pastes");
            setPastes([]);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        if (canLoad) fetchPastes();
    }, [canLoad, fetchPastes]);

    useEffect(() => {
        if (!loadingUser && !user) {
            router.push("/login?after=/home/pastes");
        }
    }, [user, loadingUser, router]);

    useEffect(() => {
        setPage("pastes");
    }, [setPage]);

    useEffect(() => {
        setPageIdx(1);
    }, [pastes]);

    const total = pastes.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const sorted = useMemo(() => {
        return [...pastes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [pastes]);

    const pagePastes = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sorted.slice(start, start + pageSize);
    }, [sorted, page, pageSize]);

    const copy = async (text: string | null | undefined) => {
        if (!text) {
            errorToast("No URL to copy");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            infoToast("Copied")
        } catch {
            errorToast("Copy failed");
        }
    };

    const deletePaste = async (p: PasteDto) => {
        /*if (!p.urlSet.deleteUrl) return;
        const ok = window.confirm(`Delete paste "${p.title}"?`);
        if (!ok) return;
        try {
            const resp = await fetch(p.urlSet.deleteUrl, { method: "DELETE" });
            if (!resp.ok) throw new Error("Delete failed");
            setPastes((cur) => cur.filter((x) => x.uniqueId !== p.uniqueId));
        } catch (e: any) {
            errorToast(e?.message ?? "Delete failed");
        }*/
    };

    if (loadingUser || !user) {
        return (
            <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
                <div className="max-w-[90rem] mx-auto w-full space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between lg:pt-5 pt-10 animate-pulse">
                        <div>
                            <div className="h-7 w-32 bg-white/5 rounded" />
                            <div className="h-4 w-16 bg-white/5 rounded mt-2" />
                        </div>
                        <div className="space-x-4 flex">
                            <div className="h-9 w-20 bg-white/5 rounded" />
                            <div className="h-9 w-24 bg-white/5 rounded" />
                        </div>
                    </div>

                    {/* Pagination controls */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 animate-pulse">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-12 bg-white/5 rounded" />
                            <div className="h-8 w-16 bg-white/5 rounded" />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="h-8 w-14 bg-white/5 rounded" />
                            <div className="h-4 w-20 bg-white/5 rounded" />
                            <div className="h-8 w-14 bg-white/5 rounded" />
                        </div>
                    </div>

                    {/* List */}
                    <div className="grid gap-3 box-primary p-2 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="box-primary p-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div className="min-w-0 flex flex-col gap-1 w-full">
                                            <div className="h-4 w-1/3 bg-white/10 rounded" />
                                            <div className="h-3 w-1/2 bg-white/5 rounded mt-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-8 w-8 bg-white/5 rounded-md" />
                                            <div className="h-8 w-8 bg-white/5 rounded-md" />
                                            <div className="h-8 w-8 bg-white/5 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const formatDate = (iso?: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString();
    };    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
            <div className="max-w-[90rem] mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pt-5 pb-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Pastes</h1>
                        <p className="text-sm text-gray-400">Total: {total}</p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/a/paste">
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                                disabled={loading}
                                title="New Paste"
                            >
                                <FaPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">New</span>
                            </button>
                        </a>
                        <button
                            onClick={fetchPastes}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                            disabled={loading}
                            title="Refresh List"
                        >
                            <FaRotateRight className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex flex-col box-primary p-3 md:p-4 gap-3">
                    {loading &&
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border-2 border-zinc-800 bg-primary1 p-3 animate-pulse">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div className="min-w-0 flex flex-col gap-1 w-full">
                                            <div className="h-4 w-1/3 bg-white/10 rounded" />
                                            <div className="h-3 w-1/2 bg-white/5 rounded mt-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-8 w-8 bg-white/5 rounded-md" />
                                            <div className="h-8 w-8 bg-white/5 rounded-md" />
                                            <div className="h-8 w-8 bg-white/5 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {!loading && (userError || (!pagePastes.length && canLoad)) && (
                        <div className="px-2 py-6 text-center text-sm text-gray-400">
                            {userError ? "Could not load user." : "No pastes yet."}
                        </div>
                    )}

                    {!loading &&
                        pagePastes.map((p) => {
                            const portalUrl = p.urlSet.portalUrl || p.urlSet.webUrl || p.urlSet.shortUrl || "";
                            return (
                                <div
                                    key={p.uniqueId}
                                    className="rounded-xl border-2 border-zinc-800 hover:border-zinc-700 bg-primary1 hover:bg-secondary/40 transition-all duration-200 p-3"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="min-w-0 flex flex-col gap-2">
                                                <div className="text-white font-semibold truncate flex gap-2 items-center">
                                                    {p.title || p.uniqueId}
                                                    {!p.isPublic && (
                                                        <span className={"text-xs"}><FaLock /></span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 flex flex-wrap gap-2 mt-1">
                                                    <span>ID: {p.uniqueId}</span>
                                                    <span className="text-gray-500">•</span>
                                                    <span>Created: {formatDate(p.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => (portalUrl ? window.open(portalUrl, "_blank") : null)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-gray-200 disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                >
                                                    <FaExternalLinkAlt className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => copy(portalUrl)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-gray-200 disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                >
                                                    <FaRegCopy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deletePaste(p)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-600/10 hover:bg-red-600/20 text-red-300 transition-all duration-200"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {/* Paginator Footer */}
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
                                        <option value={8}>8</option>
                                        <option value={12}>12</option>
                                        <option value={16}>16</option>
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
        </section>
    );
}