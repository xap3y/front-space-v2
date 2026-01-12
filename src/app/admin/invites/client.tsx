"use client";

import { useEffect, useMemo, useState } from "react";
import type { InviteCode } from "@/types/invite";
import {getApiKey, getApiUrl} from "@/lib/core";
import {getInviteCodes} from "@/lib/apiGetters";
import {createInvites} from "@/lib/apiPoster";
import {DefaultResponse} from "@/types/core";
import {errorToast, infoToast, okToast} from "@/lib/client";

type FilterMode = "all" | "unused" | "used";

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function UserBadge({
                       label,
                       user,
                   }: {
    label: string;
    user?: any | null;
}) {
    if (!user) {
        return (
            <div className="text-xs text-gray-400">
                {label}: <span className="text-gray-500">—</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={user.avatar}
                    alt={user.username ?? "user"}
                    className="h-6 w-6 rounded-full border border-white/10 object-cover"
                />
            ) : (
                <div className="h-6 w-6 rounded-full bg-white/10 border border-white/10" />
            )}
            <div className="leading-tight">
                <div className="text-xs text-gray-400">{label}</div>
                <div className="text-sm">
                    <span className="text-white font-medium">{user.username ?? "Unknown"}</span>
                    {user.role ? <span className="text-gray-400"> · {user.role}</span> : null}
                </div>
            </div>
        </div>
    );
}

function StatusPill({ used }: { used: boolean }) {
    return (
        <span
            className={`
        inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border
        ${used ? "bg-red-600/15 text-red-200 border-red-500/30" : "bg-emerald-600/15 text-emerald-200 border-emerald-500/30"}
      `}
        >
      {used ? "USED" : "UNUSED"}
    </span>
    );
}

export default function InvitesPage() {
    const [filter, setFilter] = useState<FilterMode>("all");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [invites, setInvites] = useState<InviteCode[]>([]);

    // client-side pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // create form
    const [createCount, setCreateCount] = useState<number>(1);
    const [createPrefix, setCreatePrefix] = useState<string>("");
    const [creating, setCreating] = useState(false);

    const queryUrl = useMemo(() => {
        if (filter === "used") return "/v1/admin/invite/get?used=true";
        if (filter === "unused") return "/v1/admin/invite/get?used=false";
        return "/v1/admin/invite/get";
    }, [filter]);

    useEffect(() => {
        // reset pagination when changing filter
        setPage(1);
    }, [filter, pageSize]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await getInviteCodes(queryUrl);

                if (data.error || data.message === undefined) {
                    console.log("Error data: " + JSON.stringify(data));
                }

                const list = (data.data ?? []) as InviteCode[];
                if (!cancelled) setInvites(list);
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load invites");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [queryUrl]);

    const total = invites.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pageInvites = useMemo(() => {
        const start = (page - 1) * pageSize;
        return invites.slice(start, start + pageSize);
    }, [invites, page]);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            infoToast("Copied.")
        } catch {
            errorToast("Failed to copy to clipboard.");
        }
    };

    const onCreate = async () => {
        // UI validation
        if (!Number.isFinite(createCount) || createCount < 1 || createCount > 500) {
            setError("Count must be between 1 and 500.");
            return;
        }

        setCreating(true);
        setError("");

        try {
            const data: DefaultResponse = await createInvites(createCount, createPrefix || undefined);
            console.log("create data: " + JSON.stringify(data))
            okToast("Created invites successfully.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to create invites");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Invites</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            View and manage invite codes. Filter by used/unused, and paginate results.
                        </p>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">Show</div>
                        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
                            <button
                                className={`px-3 py-2 text-sm transition-colors ${
                                    filter === "all" ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                                }`}
                                onClick={() => setFilter("all")}
                            >
                                All
                            </button>
                            <button
                                className={`px-3 py-2 text-sm transition-colors ${
                                    filter === "unused"
                                        ? "bg-white/10 text-white"
                                        : "text-gray-300 hover:bg-white/5"
                                }`}
                                onClick={() => setFilter("unused")}
                            >
                                Unused
                            </button>
                            <button
                                className={`px-3 py-2 text-sm transition-colors ${
                                    filter === "used" ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                                }`}
                                onClick={() => setFilter("used")}
                            >
                                Used
                            </button>
                        </div>
                    </div>
                </div>

                {/* Create */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2 box-primary p-4">
                        <div className="font-semibold">Create invites</div>
                        <div className="text-xs text-gray-400 mt-1">
                            Generate new invite codes. (Count required, prefix optional.)
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                                <label className="text-xs text-gray-400">Count</label>
                                <input
                                    className="in-primary w-full mt-1"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={createCount}
                                    onChange={(e) => setCreateCount(Number(e.target.value))}
                                />
                                <div className="text-[11px] text-gray-500 mt-1">Max 500 per batch.</div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-400">Prefix (optional)</label>
                                <input
                                    className="in-primary w-full mt-1"
                                    type="text"
                                    placeholder="e.g. SPACE-"
                                    value={createPrefix}
                                    onChange={(e) => setCreatePrefix(e.target.value)}
                                />
                                <div className="text-[11px] text-gray-500 mt-1">
                                    If supported by your API, it will prepend the code.
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <button
                                onClick={onCreate}
                                disabled={creating}
                                className={`
                  px-4 py-2 rounded-lg text-sm font-medium border border-white/10
                  ${creating ? "bg-white/5 text-gray-400" : "bg-primary_light/20 hover:bg-primary_light/30 text-white"}
                `}
                            >
                                {creating ? "Creating..." : "Create"}
                            </button>
                            <button
                                onClick={() => {
                                    // quick refresh
                                    // re-trigger effect by toggling filter to itself is not ideal; simplest is:
                                    // just setFilter((f)=>f) won't rerun. So reload by changing queryUrl? Not.
                                    // We'll just reload by hard refresh for now:
                                    window.location.reload();
                                }}
                                className="px-4 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Pagination controls */}
                    <div className="box-primary p-4">
                        <div className="font-semibold">Pagination</div>
                        <div className="text-xs text-gray-400 mt-1">
                            Total: <span className="text-white">{total}</span>
                        </div>

                        <div className="mt-3">
                            <label className="text-xs text-gray-400">Page size</label>
                            <select
                                className="in-primary w-full mt-1"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                                className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Prev
                            </button>

                            <div className="text-sm text-gray-300">
                                Page <span className="text-white">{page}</span> /{" "}
                                <span className="text-white">{totalPages}</span>
                            </div>

                            <button
                                className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Errors / loading */}
                <div className="mt-4">
                    {loading ? (
                        <div className="text-sm text-gray-300">Loading invites...</div>
                    ) : null}
                    {error ? (
                        <div className="mt-2 text-sm text-red-300 border border-red-500/20 bg-red-600/10 rounded-lg p-3">
                            {error}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* List */}
            <div className="box-primary p-4">
                <div className="flex items-center justify-between">
                    <div className="font-semibold">Invite list</div>
                    <div className="text-xs text-gray-400">
                        Showing {pageInvites.length} of {total}
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-400">
                        <tr className="border-b border-white/10">
                            <th className="text-left py-2 pr-2">Code</th>
                            <th className="text-left py-2 pr-2">Status</th>
                            <th className="text-left py-2 pr-2">Created</th>
                            <th className="text-left py-2 pr-2">Created by</th>
                            <th className="text-left py-2 pr-2">Used</th>
                            <th className="text-left py-2 pr-2">Used by</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {pageInvites.map((inv) => (
                            <tr key={inv.code} className="align-top">
                                <td className="py-3 pr-2">
                                    <div className="flex items-center gap-2">
                                        <code className="px-2 py-1 rounded bg-black/20 border border-white/10">
                                            {inv.code}
                                        </code>
                                        <button
                                            className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
                                            onClick={() => copy(inv.code)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </td>
                                <td className="py-3 pr-2">
                                    <StatusPill used={!!inv.used} />
                                </td>
                                <td className="py-3 pr-2 text-gray-200">{formatDate(inv.createdAt)}</td>
                                <td className="py-3 pr-2">
                                    <UserBadge label="Creator" user={(inv as any).createdBy ?? null} />
                                </td>
                                <td className="py-3 pr-2 text-gray-200">{formatDate(inv.usedAt)}</td>
                                <td className="py-3 pr-2">
                                    <UserBadge label="Used by" user={(inv as any).usedBy ?? null} />
                                </td>
                            </tr>
                        ))}
                        {pageInvites.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={6} className="py-6 text-center text-gray-400">
                                    No invites found.
                                </td>
                            </tr>
                        ) : null}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden mt-3 grid gap-3">
                    {pageInvites.map((inv) => (
                        <div key={inv.code} className="box-primary p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-xs text-gray-400">Code</div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <code className="px-2 py-1 rounded bg-black/20 border border-white/10 truncate max-w-[70vw]">
                                            {inv.code}
                                        </code>
                                        <button
                                            className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
                                            onClick={() => copy(inv.code)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                <StatusPill used={!!inv.used} />
                            </div>

                            <div className="mt-3 grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-400">Created</div>
                                        <div className="text-sm text-gray-200 mt-1">
                                            {formatDate(inv.createdAt)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Used</div>
                                        <div className="text-sm text-gray-200 mt-1">
                                            {formatDate(inv.usedAt)}
                                        </div>
                                    </div>
                                </div>

                                <UserBadge label="Creator" user={(inv as any).createdBy ?? null} />
                                <UserBadge label="Used by" user={(inv as any).usedBy ?? null} />
                            </div>
                        </div>
                    ))}

                    {pageInvites.length === 0 && !loading ? (
                        <div className="text-center text-gray-400 py-8">No invites found.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}