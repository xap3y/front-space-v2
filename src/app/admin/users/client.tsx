"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserObj } from "@/types/user";
import { getUserRoleBadge, infoToast, okToast, errorToast } from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";
import { updateUser, deleteUser, createAdminUser } from "@/lib/apiPoster";
import {FaBan, FaRegUserCircle, FaEye, FaEyeSlash, FaKey, FaRegTrashAlt} from "react-icons/fa";
import {MdAlternateEmail, MdEmail} from "react-icons/md";
import {FaArrowDown, FaArrowRight, FaIdCardClip, FaPencil, FaChevronLeft, FaChevronRight} from "react-icons/fa6";
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

type ModalType = "email" | "avatar" | "username" | "role" | "password" | null;

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
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [sort, setSort] = useState<SortMode>("created_desc");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [openUid, setOpenUid] = useState<number | null>(null);
    const [emailReveal, setEmailReveal] = useState<Record<number, boolean>>({});

    const [modal, setModal] = useState<{
        type: ModalType;
        uid: number | null;
        value: string;
        loading: boolean;
    }>({ type: null, uid: null, value: "", loading: false });

    // User Creation states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createUsername, setCreateUsername] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [createPassword, setCreatePassword] = useState("");
    const [createVerified, setCreateVerified] = useState(true);
    const [creatingUser, setCreatingUser] = useState(false);

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

    const handleBanToggle = async (uid: number, currentRole: string) => {
        const nextRole = currentRole === "BANNED" ? "USER" : "BANNED";
        infoToast(currentRole === "BANNED" ? "Unbanning user..." : "Banning user...");
        try {
            const res = await updateUser(uid, { role: nextRole });
            if (res.error) {
                errorToast(res.message || "Failed to update user role");
            } else {
                setError("");
                okToast(currentRole === "BANNED" ? "User unbanned successfully" : "User banned successfully");
                router.refresh();
            }
        } catch (err: any) {
            errorToast(err.message || "An error occurred");
        }
    };

    const handleDelete = async (uid: number, username: string) => {
        if (!confirm(`Are you sure you want to delete user ${username} (#${uid})?`)) return;
        infoToast("Deleting user...");
        try {
            const res = await deleteUser(uid);
            if (res.error) {
                errorToast(res.message || "Failed to delete user");
            } else {
                setError("");
                okToast("User deleted successfully");
                router.refresh();
            }
        } catch (err: any) {
            errorToast(err.message || "An error occurred");
        }
    };

    const openModal = (type: ModalType, uid: number, preset = "") => {
        setModal({ type, uid, value: preset, loading: false });
    };

    const closeModal = () => setModal({ type: null, uid: null, value: "", loading: false });

    const submitModal = async () => {
        if (!modal.type || !modal.uid) return;
        setModal((m) => ({ ...m, loading: true }));
        try {
            let res;
            if (modal.type === "email") {
                res = await updateUser(modal.uid, { email: modal.value });
            } else if (modal.type === "avatar") {
                res = await updateUser(modal.uid, { avatar: modal.value });
            } else if (modal.type === "role") {
                res = await updateUser(modal.uid, { role: modal.value });
            } else if (modal.type === "password") {
                res = await updateUser(modal.uid, { password: modal.value });
            }

            if (res) {
                if (res.error) {
                    errorToast(res.message || "Failed to update user");
                } else {
                    setError("");
                    okToast(res.message || "User updated successfully");
                    router.refresh();
                    closeModal();
                }
            } else {
                errorToast("No response from server");
            }
        } catch (e) {
            setError((e as any)?.message ?? "Action failed");
            errorToast((e as any)?.message ?? "Action failed");
        } finally {
            setModal((m) => ({ ...m, loading: false }));
        }
    };

    const toggleEmail = (uid: number) =>
        setEmailReveal((prev) => ({ ...prev, [uid]: !prev[uid] }));

    const handleCreateUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
            errorToast("Please fill all required fields!");
            return;
        }

        setCreatingUser(true);
        try {
            const res = await createAdminUser({
                username: createUsername.trim(),
                email: createEmail.trim(),
                password: createPassword,
                verified: createVerified
            });

            if (res.error) {
                errorToast(res.message || "Failed to create user");
            } else {
                okToast("User created successfully!");
                setIsCreateModalOpen(false);
                setCreateUsername("");
                setCreateEmail("");
                setCreatePassword("");
                setCreateVerified(true);
                router.refresh();
            }
        } catch (err: any) {
            errorToast(err?.message || "User creation failed");
        } finally {
            setCreatingUser(false);
        }
    };

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

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 rounded-md text-sm bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/30 transition-colors"
                        >
                            New User
                        </button>
                        <button
                            onClick={() => router.refresh()}
                            className="px-4 py-2 rounded-md text-sm border border-white/10 text-gray-200 hover:bg-white/5"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="mt-4 text-sm text-red-300 border border-red-500/20 bg-red-600/10 rounded-lg p-3">
                        {error}
                    </div>
                ) : null}
            </div>

            {/* Compact Filters Panel */}
            <div className="box-primary p-3 flex flex-wrap items-center gap-3 text-xs mt-4">
                <input
                    type="text"
                    placeholder="Search username / uid / invitor..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-56 rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-gray-500"
                />

                <select
                    className="rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    title="Filter by role"
                >
                    <option value="">All roles</option>
                    {roleOptions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>

                <select
                    className="rounded border border-white/10 bg-primary px-2.5 py-1.5 text-xs text-white focus:outline-none"
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

                <div className="flex gap-1.5 ml-auto">
                    <button
                        onClick={() => { setSearch(""); setRoleFilter(""); setSort("created_desc"); setPage(1); }}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary text-xs font-medium transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => router.refresh()}
                        className="px-3 py-1.5 rounded-lg bg-primary_light/25 hover:bg-primary_light/35 border border-primary_light/40 text-xs font-medium transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col box-primary p-3 md:p-4 gap-3 mt-4">
                <div className="mt-2 grid gap-3">
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
                                                    <ActionButton variant="danger" onClick={() => handleBanToggle(u.uid, u.role)}>
                                                        <FaBan />
                                                        UnBan
                                                    </ActionButton>
                                                ) : (
                                                    <ActionButton variant="danger" onClick={() => handleBanToggle(u.uid, u.role)}>
                                                        <FaBan />
                                                        Ban
                                                    </ActionButton>
                                                )}

                                                <ActionButton variant="verydanger" onClick={() => handleDelete(u.uid, u.username)}>
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
                                                <ActionButton onClick={() => errorToast("Renaming users is not supported by the backend API")}>
                                                    <FaPencil />
                                                    Rename
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("role", u.uid, u.role)}>
                                                    <FaIdCardClip />
                                                    Change role
                                                </ActionButton>
                                                <ActionButton onClick={() => errorToast("Changing API key is not supported by the backend API")}>
                                                    <FaKey />
                                                    Change API Key
                                                </ActionButton>
                                                <ActionButton onClick={() => openModal("password", u.uid, "")}>
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

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="w-full border-t border-white/10 pt-4 mt-2 flex items-center justify-between text-sm text-gray-300">
                        <div className="flex items-center gap-4">
                            <div className="text-xs text-gray-400">
                                Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-500 uppercase font-semibold">Page size</span>
                                <select
                                    className="rounded border border-white/10 bg-primary px-2 py-0.5 text-xs focus:outline-none text-gray-300"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary disabled:opacity-40 disabled:hover:bg-primary transition-colors text-xs flex items-center gap-1.5"
                            >
                                <FaChevronLeft className="h-3 w-3" />
                                <span>Prev</span>
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-primary hover:bg-secondary disabled:opacity-40 disabled:hover:bg-primary transition-colors text-xs flex items-center gap-1.5"
                            >
                                <span>Next</span>
                                <FaChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
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
                                            : modal.type === "password"
                                                ? "Change password"
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
                                    type={modal.type === "password" ? "password" : "text"}
                                    placeholder={
                                        modal.type === "email"
                                            ? "user@example.com"
                                            : modal.type === "avatar"
                                                ? "https://..."
                                                : modal.type === "password"
                                                    ? "New password"
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

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-md bg-primary2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                            <div>
                                <h2 className="text-base font-semibold text-white">Create User</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Add a new account to the system</p>
                            </div>
                            <button
                                onClick={() => { if (!creatingUser) { setIsCreateModalOpen(false); setCreateUsername(""); setCreateEmail(""); setCreatePassword(""); setCreateVerified(true); } }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
                                disabled={creatingUser}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-4">
                            {/* Username + Email side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Username <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. john_doe"
                                        value={createUsername}
                                        onChange={(e) => setCreateUsername(e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 placeholder-gray-600 transition-colors"
                                        required
                                        disabled={creatingUser}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={createEmail}
                                        onChange={(e) => setCreateEmail(e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 placeholder-gray-600 transition-colors"
                                        required
                                        disabled={creatingUser}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    placeholder="Enter password..."
                                    value={createPassword}
                                    onChange={(e) => setCreatePassword(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-primary3 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 placeholder-gray-600 transition-colors"
                                    required
                                    disabled={creatingUser}
                                />
                            </div>

                            {/* Verification toggle */}
                            <div
                                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                                    createVerified
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : "border-white/10 bg-white/[0.02]"
                                }`}
                                onClick={() => !creatingUser && setCreateVerified(!createVerified)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${createVerified ? "bg-emerald-500/20" : "bg-white/5"}`}>
                                        {createVerified ? (
                                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-medium ${createVerified ? "text-emerald-300" : "text-gray-300"}`}>
                                            {createVerified ? "Verified (ACTIVE)" : "Unverified (WAITING_VERIFICATION)"}
                                        </div>
                                        <div className="text-[11px] text-gray-600 mt-0.5">
                                            {createVerified ? "Account is immediately active" : "User must verify email first"}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (!creatingUser) setCreateVerified(!createVerified); }}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        createVerified ? "bg-emerald-500" : "bg-white/10"
                                    }`}
                                    disabled={creatingUser}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${createVerified ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreateModalOpen(false); setCreateUsername(""); setCreateEmail(""); setCreatePassword(""); setCreateVerified(true); }}
                                    className="px-4 py-2 rounded-lg text-sm border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    disabled={creatingUser}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-medium transition-colors"
                                    disabled={creatingUser || !createUsername.trim() || !createEmail.trim() || !createPassword.trim()}
                                >
                                    {creatingUser ? "Creating…" : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}