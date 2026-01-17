"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteCode } from "@/types/invite";
import { createInvites } from "@/lib/apiPoster";
import type { DefaultResponse } from "@/types/core";
import {errorToast, getUserRoleBadge, infoToast, okToast} from "@/lib/client";
import {ImCross} from "react-icons/im";
import {RxCross1} from "react-icons/rx";
import {FaRegCopy} from "react-icons/fa6";
import MainStringInput from "@/components/MainStringInput";

type FilterMode = "all" | "unused" | "used";

type SortMode =
    | "created_desc"
    | "created_asc"
    | "used_desc"
    | "used_asc";

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function parseDateMs(iso?: string | null) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? null : t;
}

function UserBadge({ label, user }: { label: string; user?: any | null }) {
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
                <div className="text-sm flex gap-2">
                    <span className="text-white hover:text-blue-500 font-medium"><a href={"/user/" + user.username}>{user.username ?? "N/A"}</a></span>
                    {/*{user.role ? <span className="text-gray-400"> · {user.role}</span> : null}*/}
                    <div className={"flex flex-row items-center justify-center gap-2"}>
                        <span className="text-gray-400"> · </span>
                        {getUserRoleBadge(user.role, {size: "xs"})}
                    </div>
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
        ${
                used
                    ? "bg-red-600/15 text-red-200 border-red-500/30"
                    : "bg-emerald-600/15 text-emerald-200 border-emerald-500/30"
            }
      `}
        >
      {used ? "USED" : "UNUSED"}
    </span>
    );
}

export default function InvitesClient({
                                          initialInvites,
                                          initialUsed,
                                          initialError = "",
                                      }: {
    initialInvites: InviteCode[];
    initialUsed?: boolean;
    initialError?: string;
}) {
    const router = useRouter();

    const initialFilter: FilterMode =
        initialUsed === true ? "used" : initialUsed === false ? "unused" : "all";

    const [filter, setFilter] = useState<FilterMode>(initialFilter);
    const [error, setError] = useState<string>(initialError);
    const [invites, setInvites] = useState<InviteCode[]>(initialInvites);

    // Search + pagination
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // NEW: sort + createdBy filter
    const [sort, setSort] = useState<SortMode>("created_desc");
    const [createdBy, setCreatedBy] = useState<string>(""); // username filter

    // create form
    const [createCount, setCreateCount] = useState<number>(1);
    const [createPrefix, setCreatePrefix] = useState<string>("");
    const [creating, setCreating] = useState(false);

    useEffect(() => setInvites(initialInvites), [initialInvites]);
    useEffect(() => setError(initialError ?? ""), [initialError]);
    useEffect(() => setFilter(initialFilter), [initialFilter]);

    useEffect(() => {
        setPage(1);
    }, [filter, pageSize, search, sort, createdBy]);

    const applyFilter = (next: FilterMode) => {
        setFilter(next);
        setPage(1);

        if (next === "used") router.push("/admin/invites?used=true");
        else if (next === "unused") router.push("/admin/invites?used=false");
        else router.push("/admin/invites");
    };

    const createdByOptions = useMemo(() => {
        // unique usernames from createdBy field
        const set = new Set<string>();
        for (const inv of invites as any[]) {
            const u = inv?.createdBy?.username;
            if (u) set.add(String(u));
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [invites]);

    const filteredAndSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const createdByQ = createdBy.trim().toLowerCase();

        let list = invites as any[];

        // search filter (code + usernames)
        if (q) {
            list = list.filter((inv) => {
                const code = String(inv.code ?? "").toLowerCase();
                const creator = String(inv?.createdBy?.username ?? "").toLowerCase();
                const user = String(inv?.usedBy?.username ?? "").toLowerCase();
                return code.includes(q) || creator.includes(q) || user.includes(q);
            });
        }

        // createdBy filter
        if (createdByQ) {
            list = list.filter(
                (inv) => String(inv?.createdBy?.username ?? "").toLowerCase() === createdByQ
            );
        }

        // sort
        const sorted = [...list].sort((a, b) => {
            const aCreated = parseDateMs(a.createdAt) ?? -Infinity;
            const bCreated = parseDateMs(b.createdAt) ?? -Infinity;

            const aUsed = parseDateMs(a.usedAt);
            const bUsed = parseDateMs(b.usedAt);

            const aUsedVal = aUsed ?? Infinity;
            const bUsedVal = bUsed ?? Infinity;

            switch (sort) {
                case "created_desc":
                    return bCreated - aCreated;
                case "created_asc":
                    return aCreated - bCreated;
                case "used_desc":
                    // newest used first; unused at end
                    return bUsedVal - aUsedVal;
                case "used_asc":
                    // oldest used first; unused at end
                    return aUsedVal - bUsedVal;
                default:
                    return 0;
            }
        });

        return sorted as InviteCode[];
    }, [invites, search, createdBy, sort]);

    const total = filteredAndSorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pageInvites = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page]);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            infoToast("Copied.");
        } catch {
            errorToast("Failed to copy to clipboard.");
        }
    };

    const onCreate = async () => {
        if (!Number.isFinite(createCount) || createCount < 1 || createCount > 500) {
            setError("Count must be between 1 and 500.");
            return;
        }

        setCreating(true);
        setError("");

        try {
            const data: DefaultResponse = await createInvites(
                createCount,
                createPrefix || undefined
            );
            console.log("create data: " + JSON.stringify(data));
            okToast("Created invites successfully.");
            router.refresh();
        } catch (e: any) {
            setError(e?.message ?? "Failed to create invites");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header + filter */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Invites</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            View and manage invite codes. Filter by used/unused, and paginate results.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">Show</div>
                        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
                            <button
                                className={`px-3 py-2 text-sm transition-colors ${
                                    filter === "all"
                                        ? "bg-white/10 text-white"
                                        : "text-gray-300 hover:bg-white/5"
                                }`}
                                onClick={() => applyFilter("all")}
                            >
                                All
                            </button>
                            <button
                                className={`px-3 py-2 text-sm transition-colors ${
                                    filter === "unused"
                                        ? "bg-white/10 text-white"
                                        : "text-gray-300 hover:bg-white/5"
                                }`}
                                onClick={() => applyFilter("unused")}
                            >
                                Unused
                            </button>
                            <button
                                className={`px-3 py-2 text-sm transition-colors ${
                                    filter === "used"
                                        ? "bg-white/10 text-white"
                                        : "text-gray-300 hover:bg-white/5"
                                }`}
                                onClick={() => applyFilter("used")}
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
                                    className="in-primary w-full"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={createCount}
                                    onChange={(e) => setCreateCount(Number(e.target.value))}
                                />
                                <div className="text-[11px] text-gray-500 mt-1">
                                    Max 500 per batch.
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-400">Prefix (optional)</label>
                                <MainStringInput
                                    className="w-full"
                                    type="text"
                                    placeholder="e.g. SPACE-"
                                    value={createPrefix}
                                    onChange={(e) => setCreatePrefix(e)}
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
                  ${
                                    creating
                                        ? "bg-white/5 text-gray-400"
                                        : "bg-primary_light/20 hover:bg-primary_light/30 text-white"
                                }
                `}
                            >
                                {creating ? "Creating..." : "Create"}
                            </button>

                            <button
                                onClick={() => router.refresh()}
                                className="px-4 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

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

                {error ? (
                    <div className="mt-4 text-sm text-red-300 border border-red-500/20 bg-red-600/10 rounded-lg p-3">
                        {error}
                    </div>
                ) : null}
            </div>

            {/* Invite list header row WITH search + sort + createdBy filter + compact paginator */}
            <div className="box-primary p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex lg:flex-row flex-col items-center justify-between gap-5">
                        <div className="font-semibold">Invite list</div>
                        <div className="text-xs text-gray-400 lg:hidden">
                            Showing {pageInvites.length} of {total}
                        </div>

                        {/* Search */}
                        <div className={"flex items-center gap-2"}>
                            <MainStringInput
                                className="w-full"
                                type="text"
                                placeholder="Search code / user..."
                                value={search}
                                onChange={(e) => setSearch(e)}
                            />

                            <RxCross1 className={`hover:cursor-pointer ${(search.length > 0) ? "" : "hidden"}`} onClick={() => setSearch("")} />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">



                        {/*<button
                            className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                            onClick={() => setSearch("")}
                            disabled={!search.trim()}
                        >
                            Clear
                        </button>*/}

                        {/* Created-by filter */}
                        <select
                            className="in-primary w-full lg:w-[200px]"
                            value={createdBy}
                            onChange={(e) => setCreatedBy(e.target.value)}
                            title="Filter by creator"
                        >
                            <option value="">All creators</option>
                            {createdByOptions.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            className="in-primary w-full lg:w-[230px]"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortMode)}
                            title="Sort invites"
                        >
                            <option value="created_desc">Created: newest</option>
                            <option value="created_asc">Created: oldest</option>
                            <option value="used_desc">Used at: newest</option>
                            <option value="used_asc">Used at: oldest</option>
                        </select>

                        {/* Compact paginator */}
                        <div className="flex items-center gap-2 lg:pl-3.5 lg:ml-2 lg:border-l lg:border-white/10">
                            <button
                                className="px-3 py-2 rounded-lg text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Prev
                            </button>

                            <div className="text-sm text-gray-300 whitespace-nowrap">
                <span className="hidden xl:inline">
                  Showing <span className="text-white">{pageInvites.length}</span> of{" "}
                    <span className="text-white">{total}</span> ·{" "}
                </span>
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
                                        <FaRegCopy
                                            onClick={() => copy(inv.code)}
                                            className={"hover:cursor-pointer"}
                                        />

                                    </div>
                                </td>
                                <td className="py-3 pr-2">
                                    <StatusPill used={inv.used} />
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

                        {pageInvites.length === 0 ? (
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
                                        <FaRegCopy
                                            onClick={() => copy(inv.code)}
                                            className={"hover:cursor-pointer"}
                                        />
                                    </div>
                                </div>
                                <StatusPill used={inv.used} />
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

                    {pageInvites.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No invites found.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}