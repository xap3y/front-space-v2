"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { EmailEntry } from "@/types/email";
import MainStringInput from "@/components/MainStringInput";
import { EmailStream } from "@/components/EmailStream";
import type { TempMail } from "@/hooks/useTempMail";
import { useUser } from "@/hooks/useUser";
import { errorToast, infoToast, okToast } from "@/lib/client";
import { getApiUrl } from "@/lib/core";
import {FaExternalLinkAlt, FaRegTrashAlt} from "react-icons/fa";
import {PiSealWarningDuotone} from "react-icons/pi";

type SortMode =
    | "created_desc"
    | "created_asc"
    | "expires_desc"
    | "expires_asc"
    | "email_asc"
    | "email_desc"
    | "id_asc"
    | "id_desc";

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

function StatusPill({ status }: { status: string }) {
    const s = String(status ?? "UNKNOWN").toUpperCase();
    const styles =
        s === "ACTIVE" || s === "VALID" || s === "OPEN"
            ? "bg-emerald-600/15 text-emerald-200 border-emerald-500/30"
            : s === "EXPIRED" || s === "DELETED" || s === "DISABLED"
                ? "bg-red-600/15 text-red-200 border-red-500/30"
                : s === "SUSPENDED"
                    ? "bg-red-800/15 text-red-300 border-red-500/30"
                    : "bg-yellow-600/15 text-yellow-100 border-yellow-500/30";

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${styles}`}>
            {s}
        </span>
    );
}

function OpenPill({ expiresAt }: { expiresAt?: string | null }) {
    const expMs = parseDateMs(expiresAt);
    const isOpen = expMs === null ? true : expMs > Date.now();
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                isOpen
                    ? "bg-emerald-600/15 text-emerald-200 border-emerald-500/30"
                    : "bg-red-600/15 text-red-200 border-red-500/30"
            }`}
        >
            {isOpen ? "OPEN" : "EXPIRED"}
        </span>
    );
}

function ActionButton({
    children,
    onClick,
    disabled,
    variant = "default",
}: {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "danger";
}) {
    const styles =
        variant === "danger"
            ? "border-red-500/30 bg-red-600/10 text-red-300 hover:bg-red-600/15"
            : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10";

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`px-3 py-2 rounded-md text-sm border transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles}`}
        >
            {children}
        </button>
    );
}

function UserMini({ user }: { user: EmailEntry["createdBy"] }) {
    if (!user) return <span className="text-gray-500">—</span>;
    return (
        <a href={"/user/" + user.username} className="inline-flex items-center gap-2 hover:text-blue-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="h-6 w-6 rounded-full border border-white/10 object-cover" />
            ) : (
                <div className="h-6 w-6 rounded-full bg-white/10 border border-white/10" />
            )}
            <span className="text-sm text-gray-200">{user.username}</span>
            <span className="text-xs text-gray-500">#{user.uid}</span>
        </a>
    );
}

export default function AdminEmailsClient({
    initialEmails,
    initialError = "",
    totalCount,
    fetchedAt,
}: {
    initialEmails: EmailEntry[];
    initialError?: string;
    totalCount: number;
    fetchedAt?: string;
}) {
    const router = useRouter();

    const { user, loadingUser } = useUser();

    const [error] = useState(initialError);

    const [streamOpen, setStreamOpen] = useState(false);
    const [streamEmail, setStreamEmail] = useState<EmailEntry | null>(null);
    const [wsForceRefreshId, setWsForceRefreshId] = useState(0);
    const [actingId, setActingId] = useState<number | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [createdByFilter, setCreatedByFilter] = useState<string>("");
    const [sort, setSort] = useState<SortMode>("created_desc");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const statusOptions = useMemo(() => {
        const s = new Set<string>();
        for (const e of initialEmails) s.add(String(e.status ?? "UNKNOWN"));
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [initialEmails]);

    const createdByOptions = useMemo(() => {
        const s = new Set<string>();
        for (const e of initialEmails) {
            const u = e.createdBy?.username;
            if (u) s.add(String(u));
        }
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [initialEmails]);

    const filteredSorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        const statusQ = statusFilter.trim().toLowerCase();
        const createdByQ = createdByFilter.trim().toLowerCase();

        let list = initialEmails;

        if (q) {
            list = list.filter((e) => {
                const email = String(e.email ?? "").toLowerCase();
                const id = String(e.id ?? "");
                const status = String(e.status ?? "").toLowerCase();
                const creator = String(e.createdBy?.username ?? "").toLowerCase();
                return (
                    email.includes(q) ||
                    id.includes(q) ||
                    status.includes(q) ||
                    creator.includes(q)
                );
            });
        }

        if (statusQ) {
            list = list.filter((e) => String(e.status ?? "").toLowerCase() === statusQ);
        }

        if (createdByQ) {
            list = list.filter((e) => String(e.createdBy?.username ?? "").toLowerCase() === createdByQ);
        }

        const sorted = [...list].sort((a, b) => {
            const aCreated = parseDateMs(a.createdAt) ?? -Infinity;
            const bCreated = parseDateMs(b.createdAt) ?? -Infinity;
            const aExp = parseDateMs(a.expiresAt) ?? -Infinity;
            const bExp = parseDateMs(b.expiresAt) ?? -Infinity;

            switch (sort) {
                case "created_desc":
                    return bCreated - aCreated;
                case "created_asc":
                    return aCreated - bCreated;
                case "expires_desc":
                    return bExp - aExp;
                case "expires_asc":
                    return aExp - bExp;
                case "email_asc":
                    return String(a.email ?? "").localeCompare(String(b.email ?? ""));
                case "email_desc":
                    return String(b.email ?? "").localeCompare(String(a.email ?? ""));
                case "id_asc":
                    return (a.id ?? 0) - (b.id ?? 0);
                case "id_desc":
                    return (b.id ?? 0) - (a.id ?? 0);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [initialEmails, search, statusFilter, createdByFilter, sort]);

    const totalFiltered = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

    const pageEmails = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSorted.slice(start, start + pageSize);
    }, [filteredSorted, page, pageSize]);

    const openStream = (email: EmailEntry) => {
        setStreamEmail(email);
        setStreamOpen(true);
        setWsForceRefreshId((v) => v + 1);
    };

    const closeStream = () => {
        setStreamOpen(false);
        setStreamEmail(null);
    };

    const suspendEmail = async (email: string) => {
        if (!user?.apiKey) {
            errorToast("Missing API key");
            return;
        }
        infoToast("Suspending...");

        const res = await fetch(getApiUrl() + `/v1/email/suspend?email=${encodeURIComponent(email)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": user.apiKey,
            },
            body: JSON.stringify({}),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) {
            errorToast(String(data?.message ?? "Failed to suspend"));
            return;
        }
        okToast("Suspended");
        router.refresh();
    };

    const deleteEmail = async (email: string) => {
        if (!user?.apiKey) {
            errorToast("Missing API key");
            return;
        }
        // eslint-disable-next-line no-alert
        if (!confirm(`Delete ${email}?`)) return;

        infoToast("Deleting...");
        const res = await fetch(getApiUrl() + `/v1/email/delete?email=${encodeURIComponent(email)}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": user.apiKey,
            },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) {
            errorToast(String(data?.message ?? "Failed to delete"));
            return;
        }
        okToast("Deleted");
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Emails</h1>
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

            <div className="box-primary p-4 h-full">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-row gap-5 items-center justify-center">
                            <div className="font-semibold">Email list</div>

                            <MainStringInput
                                className="p-0.5 min-w-96"
                                inputClassName="p-2"
                                type="text"
                                placeholder="Search email / id / status / creator..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="text-xs text-gray-400 lg:hidden">
                            Showing {pageEmails.length} of {totalFiltered}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <select
                            className="in-primary w-full lg:w-[170px]"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            title="Filter by status"
                        >
                            <option value="">All statuses</option>
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <select
                            className="in-primary w-full lg:w-[200px]"
                            value={createdByFilter}
                            onChange={(e) => {
                                setCreatedByFilter(e.target.value);
                                setPage(1);
                            }}
                            title="Filter by creator"
                        >
                            <option value="">All creators</option>
                            {createdByOptions.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>

                        <select
                            className="in-primary w-full lg:w-[210px]"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortMode)}
                            title="Sort emails"
                        >
                            <option value="created_desc">Created: newest</option>
                            <option value="created_asc">Created: oldest</option>
                            <option value="expires_desc">Expires: latest</option>
                            <option value="expires_asc">Expires: soonest</option>
                            <option value="email_asc">Email: A → Z</option>
                            <option value="email_desc">Email: Z → A</option>
                            <option value="id_desc">ID: high → low</option>
                            <option value="id_asc">ID: low → high</option>
                        </select>

                        <div className="flex items-center gap-2 lg:pl-2 lg:ml-2 lg:border-l lg:border-white/10">
                            <select
                                className="in-primary w-[110px]"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                title="Page size"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>

                            <button
                                className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Prev
                            </button>

                            <div className="text-sm text-gray-300 whitespace-nowrap">
                                <span className="hidden xl:inline">
                                    Showing <span className="text-white">{pageEmails.length}</span> of{" "}
                                    <span className="text-white">{totalFiltered}</span> ·{" "}
                                </span>
                                Page <span className="text-white">{page}</span> /{" "}
                                <span className="text-white">{totalPages}</span>
                            </div>

                            <button
                                className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                    {pageEmails.map((e) => (
                        <div key={e.id} className="rounded-xl box-primary p-2 shadow-sm shadow-black/30">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="min-w-0">
                                        <div className="text-sm sm:text-base text-white font-semibold break-all flex items-center gap-2">
                                            <span className="truncate">{e.email}</span>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(e.email);
                                                        okToast("Copied");
                                                    } catch (err) {
                                                        infoToast("Copy failed");
                                                    }
                                                }}
                                                title="Copy email"
                                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-gray-300">
                                                    <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                                </svg>
                                            </button>
                                            <span className="text-gray-400 text-xs sm:text-sm">#{e.id}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                                            <span className="truncate">Created: {formatDate(e.createdAt)}</span>
                                            <span className="text-gray-500">•</span>
                                            <span className="truncate">Expires: {formatDate(e.expiresAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:ml-4">
                                    <OpenPill expiresAt={e.expiresAt} />
                                    <StatusPill status={e.status} />

                                    <div className="flex items-center gap-2">
                                        <ActionButton
                                            disabled={loadingUser || !user?.apiKey}
                                            onClick={() => openStream(e)}
                                        >
                                            <FaExternalLinkAlt />
                                        </ActionButton>

                                        <ActionButton
                                            disabled={actingId === e.id || loadingUser || !user?.apiKey}
                                            onClick={async () => {
                                                setActingId(e.id);
                                                try {
                                                    await suspendEmail(e.email);
                                                } finally {
                                                    setActingId(null);
                                                }
                                            }}
                                        >
                                            <PiSealWarningDuotone />
                                        </ActionButton>

                                        <ActionButton
                                            variant="danger"
                                            disabled={actingId === e.id || loadingUser || !user?.apiKey}
                                            onClick={async () => {
                                                setActingId(e.id);
                                                try {
                                                    await deleteEmail(e.email);
                                                } finally {
                                                    setActingId(null);
                                                }
                                            }}
                                        >
                                            <FaRegTrashAlt />
                                        </ActionButton>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-400 sm:hidden">
                                <div className="flex items-center gap-2">
                                    <UserMini user={e.createdBy} />
                                </div>
                            </div>

                            <div className="hidden sm:block mt-2">
                                <div className="text-xs text-gray-400">
                                    Created by <UserMini user={e.createdBy} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {pageEmails.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No emails found.</div>
                    ) : null}
                </div>
            </div>

            {streamOpen && streamEmail ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl box-primary p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-white font-semibold break-all">{streamEmail.email}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Status: {String(streamEmail.status ?? "UNKNOWN")} · Expires: {formatDate(streamEmail.expiresAt)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setWsForceRefreshId((v) => v + 1)}
                                    className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                                    disabled={loadingUser || !user?.apiKey}
                                >
                                    Reconnect
                                </button>
                                <button
                                    onClick={closeStream}
                                    className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mt-3">
                            <EmailStream
                                email={
                                    {
                                        email: streamEmail.email,
                                        status: String(streamEmail.status ?? "UNKNOWN"),
                                        createdBy: String(streamEmail.createdBy?.username ?? ""),
                                        expireAt: streamEmail.expiresAt ?? null,
                                    } as TempMail
                                }
                                apiKey={user?.apiKey ?? ""}
                                forceId={wsForceRefreshId}
                                isExpired={
                                    streamEmail.expiresAt
                                        ? new Date(streamEmail.expiresAt) < new Date()
                                        : false
                                }
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
