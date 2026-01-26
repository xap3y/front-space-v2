"use client";

import {JSX, useEffect, useMemo, useState} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AuditLog, AuditLogType } from "@/types/auditLog";
import { getUserRoleBadge } from "@/lib/client";
import {
    FiLogIn,
    FiLogOut,
    FiUserPlus,
    FiEdit,
    FiSettings,
    FiUserX,
    FiKey,
    FiLink,
    FiUpload,
    FiTrash2,
    FiClipboard,
    FiHash,
    FiMail,
    FiImage,
} from "react-icons/fi";
import {IoIosArrowDown} from "react-icons/io";
import {FaTelegram} from "react-icons/fa";

type SortMode = "time_desc" | "time_asc";

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

function Avatar({ src, username }: { src: string | null | undefined; username: string }) {
    if (!src) {
        return (
            <div className="h-8 w-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs text-gray-300">
                {username?.slice?.(0, 2)?.toUpperCase?.() ?? "U"}
            </div>
        );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return (
        <img
            src={src}
            alt={username}
            className="h-8 w-8 rounded-full border border-white/10 object-cover"
        />
    );
}

const TYPE_OPTIONS: AuditLogType[] = [
    "USER_LOGIN",
    "USER_LOGOUT",
    "USER_REGISTER",
    "USER_UPDATE_PROFILE",
    "USER_SETTINGS_CHANGE",
    "USER_DELETE_ACCOUNT",
    "INVITE_CODE_CREATE",
    "INVITE_CODE_USE",
    "PASSWORD_RESET_REQUEST",
    "PASSWORD_RESET_COMPLETE",
    "IMAGE_UPLOAD",
    "IMAGE_DELETE",
    "PASTE_CREATE",
    "PASTE_DELETE",
    "URL_CREATE",
    "URL_DELETE",
    "EMAIL_CREATE",
    "EMAIL_DELETE",
    "EMAIL_RECEIVE",
    "TELEGRAM_CONNECTED",
    "TELEGRAM_REVOKED",
    "TELEGRAM_BOT_COMMAND"
];

const TYPE_ICONS: Record<AuditLogType, JSX.Element> = {
    USER_LOGIN: <FiLogIn className={"text-green-400"} />,
    USER_LOGOUT: <FiLogOut className={"text-red-400"} />,
    USER_REGISTER: <FiUserPlus />,
    USER_UPDATE_PROFILE: <FiEdit />,
    USER_SETTINGS_CHANGE: <FiSettings />,
    USER_DELETE_ACCOUNT: <FiUserX />,
    INVITE_CODE_CREATE: <FiKey />,
    INVITE_CODE_USE: <FiKey />,
    PASSWORD_RESET_REQUEST: <FiKey />,
    PASSWORD_RESET_COMPLETE: <FiKey />,
    IMAGE_UPLOAD: <FiImage className={"text-blue-400"} />,
    IMAGE_DELETE: <FiTrash2 className={"text-red-400"} />,
    PASTE_CREATE: <FiClipboard />,
    PASTE_DELETE: <FiTrash2 className={"text-red-400"} />,
    URL_CREATE: <FiLink />,
    URL_DELETE: <FiTrash2 />,
    EMAIL_CREATE: <FiMail />,
    EMAIL_DELETE: <FiTrash2 className={"text-red-400"} />,
    EMAIL_RECEIVE: <FiMail />,
    TELEGRAM_CONNECTED: <FiUserPlus className={"text-green-400"} />,
    TELEGRAM_REVOKED: <FiUserX className={"text-red-400"} />,
    TELEGRAM_BOT_COMMAND: <FiSettings />,
};

const hasViewButton = (t: AuditLogType) => t === "IMAGE_UPLOAD";

export default function LogsClient({
                                       initialLogs,
                                       initialError = "",
                                       totalCount,
                                       fetchedAt,
                                       initialQuery,
                                   }: {
    initialLogs: AuditLog[];
    initialError?: string;
    totalCount: number;
    fetchedAt?: string;
    initialQuery: { q: string; type: string; user: string; page: number };
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [error, setError] = useState(initialError);
    const [q, setQ] = useState(initialQuery.q ?? "");
    const [typeFilter, setTypeFilter] = useState(initialQuery.type ?? "");
    const [userFilter, setUserFilter] = useState(initialQuery.user ?? "");
    const [sort, setSort] = useState<SortMode>("time_desc");
    const [page, setPage] = useState(initialQuery.page ?? 1);
    const [pageSize, setPageSize] = useState(25);
    const [openId, setOpenId] = useState<string | number | null>(null);

    useEffect(() => {
        const sp = searchParams;
        const nq = sp.get("q") ?? "";
        const nt = sp.get("type") ?? "";
        const nu = sp.get("user") ?? "";
        const np = Number(sp.get("page") ?? 1) || 1;
        setQ(nq);
        setTypeFilter(nt);
        setUserFilter(nu);
        setPage(np);
    }, [searchParams]);

    const userOptions = useMemo(() => {
        const s = new Set<string>();
        for (const l of initialLogs) {
            if (l.user?.username) s.add(l.user.username);
        }
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [initialLogs]);

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        let list = initialLogs;

        if (ql) {
            list = list.filter((log) => {
                const haystack = [
                    log.type,
                    log.description ?? "",
                    log.source ?? "",
                    log.user?.username ?? "",
                    String(log.user?.uid ?? ""),
                ]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(ql);
            });
        }

        if (typeFilter) {
            list = list.filter((l) => l.type === typeFilter);
        }

        if (userFilter) {
            list = list.filter((l) => (l.user?.username ?? "") === userFilter);
        }

        const sorted = [...list].sort((a, b) => {
            const at = parseDateMs(a.time) ?? -Infinity;
            const bt = parseDateMs(b.time) ?? -Infinity;
            return sort === "time_desc" ? bt - at : at - bt;
        });

        return sorted;
    }, [initialLogs, q, typeFilter, userFilter, sort]);

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const pageLogs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const updateUrl = (next: { q?: string; type?: string; user?: string; page?: number }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next.q !== undefined) params.set("q", next.q);
        if (next.type !== undefined) params.set("type", next.type);
        if (next.user !== undefined) params.set("user", next.user);
        if (next.page !== undefined) params.set("page", String(next.page));
        if (!params.get("q")) params.delete("q");
        if (!params.get("type")) params.delete("type");
        if (!params.get("user")) params.delete("user");
        if (params.get("page") === "1") params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const onSearch = (v: string) => {
        setQ(v);
        setPage(1);
        updateUrl({ q: v, page: 1 });
    };

    const onType = (v: string) => {
        setTypeFilter(v);
        setPage(1);
        updateUrl({ type: v, page: 1 });
    };

    const onUser = (v: string) => {
        setUserFilter(v);
        setPage(1);
        updateUrl({ user: v, page: 1 });
    };

    const onPage = (p: number) => {
        setPage(p);
        updateUrl({ page: p });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Audit logs</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            Total: <span className="text-white">{totalCount}</span>
                            {fetchedAt ? (
                                <span className="text-gray-400"> · fetched {formatDate(fetchedAt)}</span>
                            ) : null}
                        </p>
                    </div>
                    <button
                        onClick={() => router.refresh()}
                        className="px-4 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                    >
                        Refresh
                    </button>
                </div>

                {error ? (
                    <div className="mt-4 text-sm text-red-300 border border-red-500/20 bg-red-600/10 rounded-lg p-3">
                        {error}
                    </div>
                ) : null}
            </div>

            <div className="box-primary p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold">Log list</div>
                        <div className="text-xs text-gray-400 lg:hidden">
                            Showing {pageLogs.length} of {totalFiltered}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <input
                            className="in-primary w-full lg:w-[220px]"
                            type="text"
                            placeholder="Search user / type / desc / source..."
                            value={q}
                            onChange={(e) => onSearch(e.target.value)}
                        />

                        <select
                            className="in-primary w-full lg:w-[180px]"
                            value={typeFilter}
                            onChange={(e) => onType(e.target.value)}
                            title="Filter by type"
                        >
                            <option value="">All types</option>
                            {TYPE_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>

                        <select
                            className="in-primary w-full lg:w-[180px]"
                            value={userFilter}
                            onChange={(e) => onUser(e.target.value)}
                            title="Filter by user"
                        >
                            <option value="">All users</option>
                            {userOptions.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>

                        <select
                            className="in-primary w-full lg:w-[160px]"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortMode)}
                            title="Sort"
                        >
                            <option value="time_desc">Time: newest</option>
                            <option value="time_asc">Time: oldest</option>
                        </select>

                        <div className="flex items-center gap-2 lg:pl-2 lg:ml-2 lg:border-l lg:border-white/10">
                            <select
                                className="in-primary w-[110px]"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    onPage(1);
                                }}
                                title="Page size"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>

                            <button
                                className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => onPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                            >
                                Prev
                            </button>

                            <div className="text-sm text-gray-300 whitespace-nowrap">
                <span className="hidden xl:inline">
                  Showing <span className="text-white">{pageLogs.length}</span> of{" "}
                    <span className="text-white">{totalFiltered}</span> ·{" "}
                </span>
                                Page <span className="text-white">{page}</span> /{" "}
                                <span className="text-white">{totalPages}</span>
                            </div>

                            <button
                                className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => onPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid gap-3">
                    {pageLogs.map((log) => {
                        const isOpen = openId === log.id;
                        const icon = TYPE_ICONS[log.type] ?? <FiHash />;

                        return (
                            <div
                                key={log.id}
                                className="rounded-xl box-primary p-3 shadow-sm shadow-black/30"
                            >
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className="w-full text-left"
                                    onClick={() => setOpenId(isOpen ? null : log.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setOpenId(isOpen ? null : log.id);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex items-center justify-center h-12 w-12 text-2xl rounded-lg bg-white/8 text-white/90">
                                            {icon}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center flex-wrap gap-2 min-w-0">
                                                {log.type.includes("TELEGRAM") && (
                                                    <FaTelegram className={"text-blue-400 w-5 h-5"} />
                                                )}
                                                <span className="text-sm font-semibold text-white truncate">{log.type}</span>
                                                <div className="flex items-center gap-2 min-w-0 ml-1">
                                                    <Avatar src={log.user?.avatar} username={log.user?.username ?? "?"} />
                                                    <span className="text-sm text-gray-100 truncate">
                                                        {log.user?.username ?? "Unknown"}{" "}
                                                        {log.user?.uid ? (
                                                            <span className="text-gray-400">(#{log.user.uid})</span>
                                                        ) : null}
                                                    </span>
                                                    {log.user?.role
                                                        ? getUserRoleBadge(log.user.role as any, { size: "xs" })
                                                        : null}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">{formatDate(log.time)}</div>
                                        </div>
                                        <div
                                            className={`text-gray-300 transition-transform duration-200 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        >
                                            <IoIosArrowDown />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                                        isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                                    aria-hidden={!isOpen}
                                >
                                    <div
                                        className={`mt-3 space-y-2 transition-opacity duration-300 ${
                                            isOpen ? "opacity-100" : "opacity-0 pointer-events-none select-none"
                                        }`}
                                    >
                                        {log.description ? (
                                            <div className="text-sm text-gray-100 break-words">
                                                Description: {log.description}
                                            </div>
                                        ) : null}

                                        {log.source ? (
                                            <div className="text-sm text-gray-300 break-words">
                                                Source: {log.source}
                                            </div>
                                        ) : null}

                                        {!log.description && !log.source ? (
                                            <div className="text-sm text-gray-500">N/A</div>
                                        ) : null}

                                        {hasViewButton(log.type) && log.description ? (
                                            <div className="pt-1">
                                                <a
                                                    href={`/i/${log.description}`}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5 transition-colors"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {pageLogs.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No logs found.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}