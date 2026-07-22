"use client";

import { MinecraftServerReports } from "@/types/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MainStringInput from "@/components/MainStringInput";
import { FaRegTrashAlt, FaPencilAlt, FaEye, FaEyeSlash, FaRegCopy, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { infoToast } from "@/lib/client";
import { updateMinecraftServer, deleteMinecraftServer } from "@/lib/apiPoster";

type SortMode = "created_desc" | "created_asc" | "name_asc" | "name_desc";
type ModalType = "password" | "apiKey" | "email" | null;

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function maskSensitive(value: string, showLength = 4): string {
    if (!value) return "—";
    if (value.length <= showLength) return "•".repeat(value.length);
    return value.slice(0, showLength) + "•".repeat(Math.max(1, value.length - showLength));
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    infoToast("Copied to clipboard");
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
            ? "border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-600/10 text-red-500"
            : variant === "verydanger"
                ? "border-2 border-red-500/40 hover:border-red-500 hover:in-shadow bg-red-800/20 text-red-500"
                : "border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-200";
    return (
        <button
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`px-3 py-2 rounded-lg text-sm border-2 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${styles}`}
        >
            {children}
        </button>
    );
}

export default function McReportsAdmin({ initialData, initialError = "" }: { initialData: MinecraftServerReports[]; initialError?: string }) {
    const router = useRouter();

    const [error, setError] = useState(initialError);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortMode>("created_desc");
    const [pausedFilter, setPausedFilter] = useState<string>("");

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Expand/collapse
    const [openServer, setOpenServer] = useState<string | null>(null);

    // Reveal sensitive data
    const [revealPassword, setRevealPassword] = useState<Record<string, boolean>>({});
    const [revealApiKey, setRevealApiKey] = useState<Record<string, boolean>>({});

    // Paused state (local tracking)
    const [pausedServers, setPausedServers] = useState<Record<string, boolean>>(
        initialData.reduce((acc, server) => {
            acc[server.serverName] = server.paused;
            return acc;
        }, {} as Record<string, boolean>)
    );

    // Loading states
    const [loadingServers, setLoadingServers] = useState<Record<string, boolean>>({});

    // Modal state
    const [modal, setModal] = useState<{
        type: ModalType;
        serverName: string | null;
        value: string;
        loading: boolean;
    }>({ type: null, serverName: null, value: "", loading: false });

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && modal.type) {
                closeModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [modal.type]);

    const filteredSorted = useMemo(() => {
        const q = search.trim().toLowerCase();

        let list = initialData;

        if (q) {
            list = list.filter((s) => {
                const name = String(s.serverName ?? "").toLowerCase();
                const ip = String(s.serverIp ?? "").toLowerCase();
                const ownerEmail = String(s.ownerEmail ?? "").toLowerCase();
                const ownerIp = String(s.ownerIp ?? "").toLowerCase();
                return (
                    name.includes(q) ||
                    ip.includes(q) ||
                    ownerEmail.includes(q) ||
                    ownerIp.includes(q)
                );
            });
        }

        if (pausedFilter !== "") {
            const filterPaused = pausedFilter === "paused";
            list = list.filter((s) => pausedServers[s.serverName] === filterPaused);
        }

        const sorted = [...list].sort((a, b) => {
            const aCreated = new Date(a.createdAt).getTime();
            const bCreated = new Date(b.createdAt).getTime();

            switch (sort) {
                case "created_desc":
                    return bCreated - aCreated;
                case "created_asc":
                    return aCreated - bCreated;
                case "name_asc":
                    return a.serverName.localeCompare(b.serverName);
                case "name_desc":
                    return b.serverName.localeCompare(a.serverName);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [initialData, search, sort, pausedFilter, pausedServers]);

    const totalFiltered = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

    const pageServers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSorted.slice(start, start + pageSize);
    }, [filteredSorted, page, pageSize]);

    const openModal = (type: ModalType, serverName: string, preset: string | null = "") => {
        setModal({ type, serverName, value: preset ?? "", loading: false });
    };

    const closeModal = () => setModal({ type: null, serverName: null, value: "", loading: false });

    const submitModal = async () => {
        if (!modal.type || !modal.serverName) return;
        setModal((m) => ({ ...m, loading: true }));
        try {
            const updateData: any = {};

            if (modal.type === "password") {
                updateData.password = modal.value;
            } else if (modal.type === "apiKey") {
                updateData.apiKey = modal.value;
            } else if (modal.type === "email") {
                updateData.ownerMail = modal.value || null;
            }

            const success = await updateMinecraftServer(modal.serverName, updateData);
            if (success) {
                infoToast("Server updated successfully");
                router.refresh();
                closeModal();
            } else {
                setError("Failed to update server");
                setModal((m) => ({ ...m, loading: false }));
            }
        } catch (e) {
            setError((e as any)?.message ?? "Action failed");
            setModal((m) => ({ ...m, loading: false }));
        }
    };

    const togglePaused = async (serverName: string) => {
        const newPausedState = !pausedServers[serverName];
        setLoadingServers((prev) => ({ ...prev, [serverName]: true }));

        try {
            const success = await updateMinecraftServer(serverName, { paused: newPausedState });
            if (success) {
                setPausedServers((prev) => ({
                    ...prev,
                    [serverName]: newPausedState,
                }));
                infoToast(newPausedState ? "Server paused" : "Server resumed");
            } else {
                setError("Failed to update server status");
            }
        } catch (e) {
            setError((e as any)?.message ?? "Failed to update server status");
        } finally {
            setLoadingServers((prev) => ({ ...prev, [serverName]: false }));
        }
    };

    const handleDelete = async (serverName: string) => {
        if (!confirm(`Are you sure you want to delete ${serverName}?`)) return;

        setLoadingServers((prev) => ({ ...prev, [serverName]: true }));

        try {
            const success = await deleteMinecraftServer(serverName);
            if (success) {
                infoToast("Server deleted successfully");
                router.refresh();
            } else {
                setError("Failed to delete server");
            }
        } catch (e) {
            setError((e as any)?.message ?? "Failed to delete server");
        } finally {
            setLoadingServers((prev) => ({ ...prev, [serverName]: false }));
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Minecraft Server Reports</h1>
                        <p className="text-sm text-gray-300 mt-1">
                            Total reports: <span className="text-white">{initialData.length}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => router.refresh()}
                        className="px-4 py-2 rounded-lg text-sm border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-200 transition-all duration-200 font-medium"
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

            {/* Compact Filters Panel */}
            <div className="box-primary p-3 flex flex-wrap items-center gap-3 text-xs mt-4">
                <input
                    type="text"
                    placeholder="Search server name / IP / email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-56 rounded border-2 border-zinc-800 bg-primary1 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 placeholder-gray-500"
                />

                <select
                    className="rounded border-2 border-zinc-800 bg-primary1 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                    value={pausedFilter}
                    onChange={(e) => { setPausedFilter(e.target.value); setPage(1); }}
                    title="Filter by status"
                >
                    <option value="">All status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                </select>

                <select
                    className="rounded border-2 border-zinc-800 bg-primary1 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                    title="Sort servers"
                >
                    <option value="created_desc">Created: newest</option>
                    <option value="created_asc">Created: oldest</option>
                    <option value="name_asc">Name: A → Z</option>
                    <option value="name_desc">Name: Z → A</option>
                </select>

                <div className="flex gap-1.5 ml-auto">
                    <button
                        onClick={() => { setSearch(""); setPausedFilter(""); setSort("created_desc"); setPage(1); }}
                        className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => router.refresh()}
                        className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-xs font-medium text-gray-200 transition-all duration-200"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col box-primary p-3 md:p-4 gap-3 mt-4">
                <div className="mt-2 grid gap-3">
                    {pageServers.map((server) => {
                        const isOpen = openServer === server.serverName;
                        const passwordShown = revealPassword[server.serverName] ?? false;
                        const apiKeyShown = revealApiKey[server.serverName] ?? false;
                        const isPaused = pausedServers[server.serverName] ?? server.paused;
                        const isLoading = loadingServers[server.serverName] ?? false;

                        return (
                            <div
                                key={server.serverName}
                                className="rounded-xl box-primary p-3 shadow-sm shadow-black/30"
                            >
                                <button
                                    className="w-full text-left"
                                    onClick={() => {
                                        const next = isOpen ? null : server.serverName;
                                        setOpenServer(next);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`font-semibold truncate ${
                                                        isPaused ? "text-red-400" : "text-white"
                                                    }`}
                                                >
                                                    {server.serverName}
                                                </span>
                                                <div
                                                    className={`h-2.5 w-2.5 rounded-full ${
                                                        isPaused ? "bg-yellow-500" : "bg-green-500"
                                                    }`}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2 items-center">
                                                <span>Created: {formatDate(server.createdAt)}</span>
                                                <span className="text-gray-500">•</span>
                                                <span>Server IP: {server.serverIp ?? "N/A"}</span>
                                                <span className="text-gray-500">•</span>
                                                <span>Owner IP: {server.ownerIp ?? "N/A"}</span>
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

                                {/* Expanded Details */}
                                <div
                                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                                        isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                                    }`}
                                    aria-hidden={!isOpen}
                                >
                                    <div
                                        className={`mt-3 grid gap-3 lg:grid-cols-2 transition-opacity duration-300 ${
                                            isOpen ? "opacity-100" : "opacity-0 pointer-events-none select-none"
                                        }`}
                                    >
                                        {/* Details Section */}
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <div className="text-xs text-gray-400">Server Information</div>

                                            <div className="mt-3 space-y-3">
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Server IP</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="text-sm text-gray-100 break-words flex-1">
                                                            {server.serverIp ?? "—"}
                                                        </div>
                                                        {server.serverIp && (
                                                            <button
                                                                onClick={() => copyToClipboard(server.serverIp!)}
                                                                className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                                title="Copy"
                                                            >
                                                                <FaRegCopy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Owner IP</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="text-sm text-gray-100 break-words flex-1">
                                                            {server.ownerIp ?? "—"}
                                                        </div>
                                                        {server.ownerIp && (
                                                            <button
                                                                onClick={() => copyToClipboard(server.ownerIp!)}
                                                                className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                                title="Copy"
                                                            >
                                                                <FaRegCopy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Owner Email</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="text-sm text-gray-100 break-words flex-1">
                                                            {server.ownerEmail ?? "—"}
                                                        </div>
                                                        {server.ownerEmail && (
                                                            <button
                                                                onClick={() => copyToClipboard(server.ownerEmail!)}
                                                                className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                                title="Copy"
                                                            >
                                                                <FaRegCopy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Created At</div>
                                                    <div className="text-sm text-gray-100">
                                                        {formatDate(server.createdAt)}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Status</div>
                                                    <div className="text-sm text-gray-100">
                                                        {isPaused ? "Paused" : "Active"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sensitive Data Section */}
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <div className="text-xs text-gray-400">Credentials</div>

                                            <div className="mt-3 space-y-3">
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Password</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            className={`text-sm break-words flex-1 ${
                                                                passwordShown
                                                                    ? "text-gray-100"
                                                                    : "text-gray-300 blur-sm select-none"
                                                            }`}
                                                        >
                                                            {passwordShown ? server.password : maskSensitive(server.password)}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRevealPassword((prev) => ({
                                                                    ...prev,
                                                                    [server.serverName]: !prev[server.serverName],
                                                                }));
                                                            }}
                                                            className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                            aria-label={passwordShown ? "Hide password" : "Show password"}
                                                        >
                                                            {passwordShown ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                                                        </button>
                                                        {passwordShown && (
                                                            <button
                                                                onClick={() => copyToClipboard(server.password)}
                                                                className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                                title="Copy"
                                                            >
                                                                <FaRegCopy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">API Key</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            className={`text-sm break-words flex-1 ${
                                                                apiKeyShown
                                                                    ? "text-gray-100"
                                                                    : "text-gray-300 blur-sm select-none"
                                                            }`}
                                                        >
                                                            {apiKeyShown ? server.apiKey : maskSensitive(server.apiKey)}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRevealApiKey((prev) => ({
                                                                    ...prev,
                                                                    [server.serverName]: !prev[server.serverName],
                                                                }));
                                                            }}
                                                            className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                            aria-label={apiKeyShown ? "Hide API key" : "Show API key"}
                                                        >
                                                            {apiKeyShown ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                                                        </button>
                                                        {apiKeyShown && (
                                                            <button
                                                                onClick={() => copyToClipboard(server.apiKey)}
                                                                className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                                title="Copy"
                                                            >
                                                                <FaRegCopy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Section */}
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 lg:col-span-2">
                                            <div className="text-xs text-gray-400 mb-2">Actions</div>
                                            <div className="flex flex-wrap gap-2">
                                                <ActionButton
                                                    onClick={() =>
                                                        openModal("email", server.serverName, server.ownerEmail)
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    <FaPencilAlt />
                                                    Update owner mail
                                                </ActionButton>
                                                <ActionButton
                                                    onClick={() =>
                                                        openModal("password", server.serverName, server.password)
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    <FaPencilAlt />
                                                    Update password
                                                </ActionButton>
                                                <ActionButton
                                                    onClick={() =>
                                                        openModal("apiKey", server.serverName, server.apiKey)
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    <FaPencilAlt />
                                                    Update API key
                                                </ActionButton>
                                                {isPaused ? (
                                                    <ActionButton
                                                        onClick={() => togglePaused(server.serverName)}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "Resuming..." : "Resume"}
                                                    </ActionButton>
                                                ) : (
                                                    <ActionButton
                                                        variant="danger"
                                                        onClick={() => togglePaused(server.serverName)}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "Pausing..." : "Pause"}
                                                    </ActionButton>
                                                )}
                                                <ActionButton
                                                    variant="verydanger"
                                                    onClick={() => handleDelete(server.serverName)}
                                                    disabled={isLoading}
                                                >
                                                    <FaRegTrashAlt />
                                                    {isLoading ? "Deleting..." : "Delete"}
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {pageServers.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No servers found.</div>
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
                                    className="rounded border-2 border-zinc-800 bg-primary1 px-2 py-0.5 text-xs focus:outline-none text-gray-300"
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
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200 text-xs flex items-center gap-1.5 text-gray-200"
                            >
                                <FaChevronLeft className="h-3 w-3" />
                                <span>Prev</span>
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 rounded-lg border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200 text-xs flex items-center gap-1.5 text-gray-200"
                            >
                                <span>Next</span>
                                <FaChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal.type && modal.serverName !== null ? (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-pointer"
                    onClick={closeModal}
                >
                    <div 
                        className="w-full max-w-md bg-primary1 border-2 border-zinc-800 rounded-2xl p-5 shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                            <h2 className="text-base font-semibold text-white">
                                {modal.type === "password"
                                    ? "Update password"
                                    : modal.type === "apiKey"
                                        ? "Update API key"
                                        : "Update owner email"}
                            </h2>
                            <button
                                className="text-gray-400 hover:text-white transition-colors"
                                onClick={closeModal}
                                disabled={modal.loading}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4">
                            <MainStringInput
                                className="p-2 border-2 border-zinc-800 rounded-lg bg-primary1 text-sm text-white w-full focus:outline-none"
                                placeholder={
                                    modal.type === "password"
                                        ? "New password"
                                        : modal.type === "apiKey"
                                            ? "New API key"
                                            : "Owner email (optional)"
                                }
                                value={modal.value}
                                onChange={(e) => setModal((m) => ({ ...m, value: e }))}
                                disabled={modal.loading}
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="px-3 py-2 rounded-lg text-sm border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-gray-300 transition-all duration-200"
                                onClick={closeModal}
                                disabled={modal.loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg text-sm border-2 border-zinc-800 hover:border-zinc-700 hover:in-shadow bg-primary1 text-white font-medium transition-all duration-200 disabled:opacity-50"
                                onClick={submitModal}
                                disabled={modal.loading || (modal.type !== "email" && !modal.value)}
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