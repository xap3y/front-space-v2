"use client";
import Surface from "@/components/ui/Surface";

import { NativeButton, NativeDeleteButton } from "@/components/ui/NativeButton";


import ResourceList from "@/components/ui/ResourceList";
import Pagination from "@/components/ui/Pagination";

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
                    <Surface className="grid gap-3 box-primary p-2 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Surface key={i} className="box-primary p-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-row items-center justify-between gap-3">
                                        <div className="min-w-0 flex flex-col gap-1 w-full">
                                            <div className="h-4 w-1/3 bg-white/10 rounded" />
                                            <div className="h-3 w-1/2 bg-white/5 rounded mt-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-[26px] w-[26px] bg-white/5 rounded-md" />
                                            <div className="h-[26px] w-[26px] bg-white/5 rounded-md" />
                                            <div className="h-[26px] w-[26px] bg-white/5 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            </Surface>
                        ))}
                    </Surface>
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
                            <NativeButton
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                                disabled={loading}
                                title="New Paste"
                            >
                                <FaPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">New</span>
                            </NativeButton>
                        </a>
                        <NativeButton
                            onClick={fetchPastes}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 transition-all duration-200 text-sm font-medium text-gray-200"
                            disabled={loading}
                            title="Refresh List"
                        >
                            <FaRotateRight className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </NativeButton>
                    </div>
                </div>

                {/* List Container */}
                <ResourceList className="flex flex-col box-primary p-3 md:p-4 gap-3">
                    {loading &&
                        Array.from({ length: 4 }).map((_, i) => (
                            <Surface key={i} className="rounded-md border border-zinc-800 bg-primary1 px-3 py-2 animate-pulse">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-row items-center justify-between gap-3">
                                        <div className="min-w-0 flex flex-col gap-1 w-full">
                                            <div className="h-4 w-1/3 bg-white/10 rounded" />
                                            <div className="h-3 w-1/2 bg-white/5 rounded mt-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-[26px] w-[26px] bg-white/5 rounded-md" />
                                            <div className="h-[26px] w-[26px] bg-white/5 rounded-md" />
                                            <div className="h-[26px] w-[26px] bg-white/5 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            </Surface>
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
                                <Surface
                                    key={p.uniqueId}
                                    className="rounded-md border border-zinc-800 bg-primary1 px-3 py-2"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-row items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1 flex flex-col gap-1">
                                                <div className="text-xs text-white font-medium truncate flex gap-2 items-center">
                                                    {p.title || p.uniqueId}
                                                    {!p.isPublic && (
                                                        <span className={"text-xs"}><FaLock /></span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-2 gap-y-0">
                                                    <span>ID: {p.uniqueId}</span>
                                                    <span className="text-gray-500">•</span>
                                                    <span>Created: {formatDate(p.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 gap-1">
                                                <NativeButton
                                                    onClick={() => (portalUrl ? window.open(portalUrl, "_blank") : null)}
                                                    className="!h-[26px] !min-h-[26px] !w-[26px] !p-0 text-gray-200 disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                >
                                                    <FaExternalLinkAlt className="h-4 w-4" />
                                                </NativeButton>
                                                <NativeButton
                                                    onClick={() => copy(portalUrl)}
                                                    className="!h-[26px] !min-h-[26px] !w-[26px] !p-0 text-gray-200 disabled:opacity-50"
                                                    disabled={!portalUrl}
                                                >
                                                    <FaRegCopy className="h-4 w-4" />
                                                </NativeButton>
                                                <NativeDeleteButton
                                                    onClick={() => deletePaste(p)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-600/10 hover:bg-red-600/20 text-red-300 transition-all duration-200"
                                                >

                                                </NativeDeleteButton>
                                            </div>
                                        </div>
                                    </div>
                                </Surface>
                            );
                        })}

                    {/* Paginator Footer */}
                    <Pagination
                            page={page}
                            pages={totalPages}
                            onChange={setPageIdx}
                            pageSize={pageSize}
                            pageSizes={[8, 12, 16]}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPageIdx(1);
                            }}
                        />
                </ResourceList>
            </div>
        </section>
    );
}
