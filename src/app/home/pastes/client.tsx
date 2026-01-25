"use client";

import {usePage} from "@/context/PageContext";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useUser} from "@/hooks/useUser";
import {useRouter} from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import {getUserPastes} from "@/lib/apiGetters";
import {PasteDto} from "@/types/paste";
import {errorToast, infoToast} from "@/lib/client";
import {DefaultResponse} from "@/types/core";
import {FaLock, FaPlus, FaRotateRight, FaTrash} from "react-icons/fa6";
import {FaExternalLinkAlt, FaRegCopy} from "react-icons/fa";
import HoverDiv from "@/components/HoverDiv";

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
            const list = res as PasteDto[];
            setPastes(list ?? []);
        } catch (e: any) {
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
            router.push("/login");
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

    if (loadingUser || !user) return <LoadingPage />;

    const formatDate = (iso?: string | null) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString();
    };

    return (
        <section className="flex-1 min-w-0 pt-0 px-3 md:px-6">
            <div className="max-w-5xl mx-auto w-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between lg:pt-5 pt-10">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Pastes</h1>
                        <p className="text-sm text-gray-400">Total: {total}</p>
                    </div>
                    <div className="space-x-4 flex">
                        <a href="/a/paste">
                            <HoverDiv
                                className="flex items-center h-full gap-2 transition-colors text-sm px-3 py-2"
                                disabled={loading}
                                aria-label="New"
                                title="New"
                            >
                                <FaPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">New</span>
                            </HoverDiv>
                        </a>
                        <HoverDiv
                            onClick={fetchPastes}
                            className="flex items-center justify-center h-full gap-2 transition-colors text-sm px-3 py-2"
                            disabled={loading}
                            aria-label="Refresh list"
                            title="Refresh"
                        >
                            <FaRotateRight className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">{loading ? "Refreshing..." : "Refresh"}</span>
                        </HoverDiv>
                    </div>
                </div>

                {/* Pagination controls */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Page size</span>
                        <select
                            className="in-primary"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPageIdx(1);
                            }}
                        >
                            <option value={7}>7</option>
                            <option value={8}>8</option>
                            <option value={10}>10</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => setPageIdx((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-2 rounded-md border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-xs md:text-sm text-gray-300">
              Page <span className="text-white">{page}</span> / <span className="text-white">{totalPages}</span>
            </span>
                        <button
                            onClick={() => setPageIdx((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-2 rounded-md border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="grid gap-3 box-primary p-2">
                    {loading &&
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
                                <div className="h-4 w-2/3 bg-white/10 rounded mb-2" />
                                <div className="h-3 w-1/2 bg-white/5 rounded" />
                            </div>
                        ))}

                    {!loading && (userError || (!pagePastes.length && canLoad)) && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">
                            {userError ? "Could not load user." : "No pastes yet."}
                        </div>
                    )}

                    {!loading &&
                        pagePastes.map((p) => {
                            const portalUrl = p.urlSet.portalUrl || p.urlSet.webUrl || p.urlSet.shortUrl || "";
                            return (
                                <div
                                    key={p.uniqueId}
                                    className="box-primary p-2"
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
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-white/10 bg-primary1 hover:bg-primary0 transition-colors disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                >
                                                    <FaExternalLinkAlt className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => copy(portalUrl)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-white/10 bg-primary1 hover:bg-primary0 transition-colors disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                >
                                                    <FaRegCopy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deletePaste(p)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border border-red-500/30 bg-red-600/10 hover:bg-red-600/15 text-red-300 transition-colors"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </section>
    );
}