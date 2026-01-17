"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserObj } from "@/types/user";
import { getUserRoleBadge, infoToast } from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";
import {FaBan, FaRegUserCircle, FaEye, FaEyeSlash, FaKey, FaRegTrashAlt} from "react-icons/fa";
import {MdAlternateEmail, MdEmail} from "react-icons/md";
import {FaArrowDown, FaArrowRight, FaIdCardClip, FaPencil} from "react-icons/fa6";
import { IoIdCardSharp } from "react-icons/io5";
import {RiLockPasswordLine} from "react-icons/ri";
import {IoIosArrowDown} from "react-icons/io";

type SortMode =
    | "created_desc"
    | "created_asc"
    | "username_asc"
    | "username_desc"
    | "uid_asc"
    | "uid_desc";

type ModalType = "email" | "avatar" | "username" | "role" | null;

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function formatBytes(n?: number | null) {
    if (n === undefined || n === null || Number.isNaN(n)) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function parseDateMs(iso?: string | null) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? null : t;
}

function Avatar({ src, username }: { src: string | null | undefined; username: string }) {
    if (!src) {
        return (
            <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-xs text-gray-300">
                {username?.slice?.(0, 2)?.toUpperCase?.() ?? "U"}
            </div>
        );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return (
        <img
            src={src}
            alt={username}
            className="h-10 w-10 rounded-lg border border-white/10 object-cover"
        />
    );
}

function ActionButton({
                          children,
                          variant = "default",
                          onClick,
                          disabled,
                          title,
                      }: {
    children: React.ReactNode;
    variant?: "default" | "danger" | "verydanger";
    onClick: () => void;
    disabled?: boolean;
    title?: string;
}) {
    const styles =
        variant === "danger"
            ? "border-red-500/30 bg-red-600/10 text-red-500 hover:bg-red-600/15"
            : variant === "verydanger"
                ? "border-red-500/30 bg-red-800/10 text-red-500 hover:bg-red-600/15"
            : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10";
    return (
        <button
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`px-3 py-2 rounded-md text-sm border transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles}`}
        >
            {children}
        </button>
    );
}

export default function UsersClient({
                                        initialUsers,
                                        initialError = "",
                                        totalCount,
                                        fetchedAt,
                                    }: {
    initialUsers: UserObj[];
    initialError?: string;
    totalCount: number;
    fetchedAt?: string;
}) {
    const router = useRouter();

    const [error, setError] = useState(initialError);

    // list controls
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortMode>("created_desc");
    const [roleFilter, setRoleFilter] = useState<string>("");

    // pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // default 10 items per page

    // expand/collapse
    const [openUid, setOpenUid] = useState<number | null>(null);

    // email reveal state
    const [emailReveal, setEmailReveal] = useState<Record<number, boolean>>({});

    // modal state
    const [modal, setModal] = useState<{
        type: ModalType;
        uid: number | null;
        value: string;
        loading: boolean;
    }>({ type: null, uid: null, value: "", loading: false });

    const roleOptions = useMemo(() => {
        const s = new Set<string>();
        for (const u of initialUsers) s.add(u.role);
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [initialUsers]);

    const filteredSorted = useMemo(() => {
        const q = search.trim().toLowerCase();

        let list = initialUsers;

        if (q) {
            list = list.filter((u) => {
                const uname = String(u.username ?? "").toLowerCase();
                const uid = String(u.uid ?? "");
                const role = String(u.role ?? "").toLowerCase();
                const invitor = String(u.invitor?.username ?? "").toLowerCase();
                return (
                    uname.includes(q) ||
                    uid.includes(q) ||
                    role.includes(q) ||
                    invitor.includes(q)
                );
            });
        }

        if (roleFilter) {
            list = list.filter((u) => u.role === roleFilter);
        }

        const sorted = [...list].sort((a, b) => {
            const aCreated = parseDateMs(a.createdAt) ?? -Infinity;
            const bCreated = parseDateMs(b.createdAt) ?? -Infinity;

            switch (sort) {
                case "created_desc":
                    return bCreated - aCreated;
                case "created_asc":
                    return aCreated - bCreated;
                case "username_asc":
                    return a.username.localeCompare(b.username);
                case "username_desc":
                    return b.username.localeCompare(a.username);
                case "uid_asc":
                    return a.uid - b.uid;
                case "uid_desc":
                    return b.uid - a.uid;
                default:
                    return 0;
            }
        });

        return sorted;
    }, [initialUsers, search, sort, roleFilter]);

    const totalFiltered = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

    const pageUsers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSorted.slice(start, start + pageSize);
    }, [filteredSorted, page, pageSize]);

    // Dummy actions for now:
    const banUser = async (uid: number) => {
        infoToast("banning user..");
    };

    const openModal = (type: ModalType, uid: number, preset = "") => {
        setModal({ type, uid, value: preset, loading: false });
    };

    const closeModal = () => setModal({ type: null, uid: null, value: "", loading: false });

    const submitModal = async () => {
        if (!modal.type || !modal.uid) return;
        setModal((m) => ({ ...m, loading: true }));
        try {
            if (modal.type === "email") {
                console.log("SET EMAIL", modal.uid, modal.value);
            } else if (modal.type === "avatar") {
                console.log("SET AVATAR", modal.uid, modal.value);
            } else if (modal.type === "username") {
                console.log("SET USERNAME", modal.uid, modal.value);
            } else if (modal.type === "role") {
                console.log("SET ROLE", modal.uid, modal.value);
            }
            router.refresh();
            closeModal();
        } catch (e) {
            setError((e as any)?.message ?? "Action failed");
            setModal((m) => ({ ...m, loading: false }));
        }
    };

    const toggleEmail = (uid: number) =>
        setEmailReveal((prev) => ({ ...prev, [uid]: !prev[uid] }));

    return (
        <div className="flex flex-col gap-4">
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Users</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            Total users: <span className="text-white">{totalCount}</span>
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
                        <div className={"flex flex-row gap-5 items-center justify-center"}>
                            <div className="font-semibold">User list</div>

                            <MainStringInput
                                className="p-0.5 min-w-96"
                                inputClassName={"p-2"}
                                type="text"
                                placeholder="Search username / uid / invitor..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="text-xs text-gray-400 lg:hidden">
                            Showing {pageUsers.length} of {totalFiltered}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <select
                            className="in-primary w-full lg:w-[170px]"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setPage(1);
                            }}
                            title="Filter by role"
                        >
                            <option value="">All roles</option>
                            {roleOptions.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>

                        <select
                            className="in-primary w-full lg:w-[210px]"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortMode)}
                            title="Sort users"
                        >
                            <option value="created_desc">Created: newest</option>
                            <option value="created_asc">Created: oldest</option>
                            <option value="username_asc">Username: A → Z</option>
                            <option value="username_desc">Username: Z → A</option>
                            <option value="uid_desc">UID: high → low</option>
                            <option value="uid_asc">UID: low → high</option>
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
                  Showing <span className="text-white">{pageUsers.length}</span> of{" "}
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

                {/* Card list (desktop and mobile unified) */}
                <div className="mt-4 grid gap-3">
                    {pageUsers.map((u) => {
                        const isOpen = openUid === u.uid;
                        const emailShown = emailReveal[u.uid] ?? false;
                        return (
                            <div
                                key={u.uid}
                                className="rounded-xl box-primary p-3 shadow-sm shadow-black/30"
                            >
                                <button
                                    className="w-full text-left"
                                    onClick={() => {
                                        const next = isOpen ? null : u.uid;
                                        setOpenUid(next);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar src={u.avatar} username={u.username} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold truncate">
                          {u.username} <span className="text-gray-400 font-normal">(#{u.uid})</span>
                        </span>
                                                {getUserRoleBadge(u.role as any, { size: "sm" })}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2 items-center">
                                                <span>Created: {formatDate(u.createdAt)}</span>
                                                <span className="text-gray-500">•</span>
                                                <span>
                          Invited by: <span className="text-gray-200">{u.invitor?.username ?? "N/A"}</span>
                        </span>
                                                <span className="text-gray-500">•</span>
                                                <span className="flex items-center gap-1">
                          Email:
                          <span className={emailShown ? "text-gray-100" : "text-gray-300 blur-sm select-none"}>
                            {u.email ?? "—"}
                          </span>
                          <div
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEmail(u.uid);
                              }}
                              className="text-gray-300 hover:text-white transition"
                              aria-label={emailShown ? "Hide email" : "Show email"}
                          >
                            {emailShown ? <FaEyeSlash /> : <FaEye />}
                          </div>
                        </span>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-gray-300 transition-transform duration-200 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        >
                                            <IoIosArrowDown />
                                        </div>
                                    </div>
                                </button>

                                <div
                                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                                        isOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
                                    }`}
                                    aria-hidden={!isOpen}
                                >
                                    <div
                                        className={`mt-3 grid gap-3 lg:grid-cols-3 transition-opacity duration-300 ${
                                            isOpen ? "opacity-100" : "opacity-0 pointer-events-none select-none"
                                        }`}
                                    >
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <div className="text-xs text-gray-400">Total uploads</div>
                                            <div className="text-lg font-semibold mt-1">
                                                {u.stats?.totalUploads ?? "—"}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2">Storage used</div>
                                            <div className="text-sm text-gray-100">
                                                {formatBytes(u.stats?.storageUsed)}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2">Pastes created</div>
                                            <div className="text-sm text-gray-100">
                                                {u.stats?.pastesCreated ?? "—"}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2">URLs shortened</div>
                                            <div className="text-sm text-gray-100">
                                                {u.stats?.urlsShortened ?? "—"}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <div className="text-xs text-gray-400">Invited by</div>
                                            <div className="mt-2">
                                                {u.invitor ? (
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={u.invitor.avatar} username={u.invitor.username} />
                                                        <div>
                                                            <div className="text-white font-medium">
                                                                {u.invitor.username}{" "}
                                                                <span className="text-gray-400 font-normal">(#{u.invitor.uid})</span>
                                                            </div>
                                                            <div className="mt-1">
                                                                {getUserRoleBadge(u.invitor.role as any, { size: "xs" })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">N/A</div>
                                                )}
                                            </div>
                                            <div className="mt-4 text-xs text-gray-400">Email</div>
                                            <div className="text-sm text-gray-100 break-words">
                                                {u.email ?? "—"}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <div className="text-xs text-gray-400">Actions</div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {u.role == "BANNED" ? (
                                                    <ActionButton variant="danger" onClick={() => banUser(u.uid)}>
                                                        <FaBan />
                                                        UnBan
                                                    </ActionButton>
                                                ) : (
                                                    <ActionButton variant="danger" onClick={() => banUser(u.uid)}>
                                                        <FaBan />
                                                        Ban
                                                    </ActionButton>
                                                )}

                                                <ActionButton variant="verydanger" onClick={() => banUser(u.uid)}>
                                                    <FaRegTrashAlt />
                                                    Delete
                                                </ActionButton>

                                                <ActionButton onClick={() => openModal("email", u.uid, u.email ?? "")}>
                                                    <MdAlternateEmail />
                                                    Update email
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("avatar", u.uid, u.avatar ?? "")}>
                                                    <FaRegUserCircle />
                                                    Update profile pic
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("username", u.uid, u.username)}>
                                                    <FaPencil />
                                                    Rename
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("role", u.uid, u.role)}>
                                                    <FaIdCardClip />
                                                    Change role
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("role", u.uid, u.role)}>
                                                    <FaKey />
                                                    Change API Key
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("role", u.uid, u.role)}>
                                                    <RiLockPasswordLine />
                                                    Change password
                                                </ActionButton>
                                                <ActionButton onClick={() => router.push("/admin/logs?user=" + u.username)}>
                                                    Display logs
                                                    <FaArrowRight />
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {pageUsers.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No users found.</div>
                    ) : null}
                </div>
            </div>

            {/* Modal */}
            {modal.type && modal.uid !== null ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md box-primary p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                {modal.type === "email"
                                    ? "Update email"
                                    : modal.type === "avatar"
                                        ? "Update profile picture URL"
                                        : modal.type === "username"
                                            ? "Rename user"
                                            : "Change role"}
                            </h2>
                            <button
                                className="text-gray-300 hover:text-white"
                                onClick={closeModal}
                                disabled={modal.loading}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4">
                            {modal.type === "role" ? (
                                <select
                                    className="in-primary w-full"
                                    value={modal.value}
                                    onChange={(e) => setModal((m) => ({ ...m, value: e.target.value }))}
                                    disabled={modal.loading}
                                >
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <MainStringInput
                                    className="p-1 in-primary w-full"
                                    placeholder={
                                        modal.type === "email"
                                            ? "user@example.com"
                                            : modal.type === "avatar"
                                                ? "https://..."
                                                : "New username"
                                    }
                                    value={modal.value}
                                    onChange={(e) => setModal((m) => ({ ...m, value: e }))}
                                    disabled={modal.loading}
                                />
                            )}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="px-3 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                                onClick={closeModal}
                                disabled={modal.loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-2 rounded-md text-sm border border-primary_light/50 bg-primary_light/20 text-white hover:bg-primary_light/30 disabled:opacity-50"
                                onClick={submitModal}
                                disabled={modal.loading || !modal.value.trim()}
                            >
                                {modal.loading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}