"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaLock, FaLink, FaTrash, FaChevronLeft, FaChevronRight, FaChevronDown, FaCopy, FaPlus } from "react-icons/fa6";
import { FaExternalLinkAlt } from "react-icons/fa";
import { LoadingDot } from "@/components/GlobalComponents";

import { errorToast, infoToast, okToast } from "@/lib/client";
import { getApiUrl, getStorageUrl } from "@/lib/core";
import HoverDiv from "@/components/HoverDiv";
import LayoutModeSwitch from "@/components/LayoutModeSwitch";

interface FileInfo {
    uniqueId: string;
    fileName: string;
    fileType: string;
    size: number;
}

interface PackInfo {
    packId: string;
    isComplete: boolean;
    totalFiles: number;
    totalSize: number;
    uploadTime: string;
    isPasswordProtected: boolean;
    files?: FileInfo[];
}

interface PacksResponse {
    packs: PackInfo[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export default function FilesPageClient() {
    const { setPage } = usePage();
    const { user, loadingUser, error } = useUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [packs, setPacks] = useState<PackInfo[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [pageSize] = useState<number>(5);
    const [fetchingPacks, setFetchingPacks] = useState<boolean>(false);
    const [deletingPackId, setDeletingPackId] = useState<string | null>(null);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
    const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<"compact" | "detailed">("compact");

    const router = useRouter();

    useEffect(() => {
        if (window.localStorage.getItem("file-pack-layout") === "detailed") setLayoutMode("detailed");
    }, []);

    useEffect(() => {
        setPage("files");

        if (loadingUser) {
            return;
        } else if (!loadingUser && !user) {
            setLoading(true);
            return router.push("/login?after=/home/files");
        }

        setLoading(false);
        fetchPacks(0);
    }, [user, loadingUser, error, setPage, router]);

    const fetchPacks = async (page: number) => {
        try {
            setFetchingPacks(true);

            // ✅ CHANGED: Enforce a minimum 300ms delay to prevent UI flickering on fast networks
            const [response] = await Promise.all([
                axios.get<PacksResponse>(
                    getApiUrl() + `/v1/files/packs?page=${page}&size=${pageSize}`,
                    {
                        withCredentials: true,
                    }
                ),
                new Promise((resolve) => setTimeout(resolve, 300))
            ]);

            setPacks([...response.data.packs].sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()));
            setCurrentPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
            setExpandedPackId(null);
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to load packs";
            errorToast(errorMsg);
        } finally {
            setFetchingPacks(false);
        }
    };

    const togglePackExpanded = (packId: string) => {
        setExpandedPackId((prev) => (prev === packId ? null : packId));
    };

    const changeLayout = (mode: "compact" | "detailed") => {
        setLayoutMode(mode);
        window.localStorage.setItem("file-pack-layout", mode);
    };

    const handleDeleteFile = async (packId: string, fileId: string, fileName: string) => {
        if (!confirm(`Delete "${fileName}"?`)) {
            return;
        }

        try {
            setDeletingFileId(fileId);

            await axios.delete(
                getApiUrl() + `/v1/files/pack/public/${packId}/file/${fileId}`,
                {
                    withCredentials: true,
                }
            );

            okToast("File deleted!");
            await fetchPacks(currentPage);
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to delete file";
            errorToast(errorMsg);
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleDeletePack = async (packId: string) => {
        if (!confirm("Delete entire pack?")) {
            return;
        }

        try {
            setDeletingPackId(packId);

            await axios.delete(
                getApiUrl() + `/v1/files/pack/public/${packId}`,
                {
                    withCredentials: true,
                }
            );

            okToast("Pack deleted!");
            await fetchPacks(currentPage);
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to delete pack";
            errorToast(errorMsg);
        } finally {
            setDeletingPackId(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getPackUrl = (packId: string) => {
        if (window.location.origin.includes("space.xap3y.eu")) {
            return `https://files.xap3y.eu/${packId}`;
        }
        return `${window.location.origin}/files/pack/${packId}`;
    };

    const getFileUrl = (uniqueId: string) => {
        return `${getStorageUrl()}/files/${uniqueId}`;
    };

    const copyToClipboard = (text: string, message: string = "Copied!") => {
        navigator.clipboard.writeText(text);
        infoToast(message);
    };

    const PackSkeleton = () => (
        <div className={`box-primary overflow-hidden rounded-lg shadow-lg animate-pulse ${layoutMode === "compact" ? "h-[76px]" : "h-[123px]"}`}>
            <div className="flex h-[76px] flex-col justify-center border-b border-gray-700 p-2.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex h-7 flex-wrap items-center gap-1 md:gap-2">
                            <div className="h-3 w-3 shrink-0 rounded-full bg-green-400/25 md:h-4 md:w-4" />
                            <div className="h-3.5 w-[38px] shrink-0 rounded bg-white/10" />
                            <div className="h-1 w-1 shrink-0 rounded-full bg-white/10" />
                            <div className="h-3.5 w-[58px] shrink-0 rounded bg-white/10" />
                            <div className="h-1 w-1 shrink-0 rounded-full bg-white/10" />
                            <div className="h-3.5 w-[112px] shrink-0 rounded bg-white/[.07]" />
                            <div className="hidden h-4 w-4 shrink-0 rounded bg-blue-400/20 md:block" />
                        </div>
                        <div className="flex h-4 items-center gap-2">
                            <div className="h-3 w-[252px] max-w-[calc(100%-20px)] rounded bg-white/[.06]" />
                            <div className="h-3 w-3 rounded bg-white/[.08]" />
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                        {layoutMode === "compact" && <>
                            <div className="h-[26px] w-[26px] rounded bg-blue-600/35" />
                            <div className="h-[26px] w-[26px] rounded border-2 border-zinc-800 bg-primary1" />
                        </>}
                        <div className="h-[26px] w-[26px] rounded border-2 border-zinc-800 bg-primary1" />
                        <div className="h-[26px] w-[26px] rounded border-2 border-red-800/70 bg-red-950/45" />
                    </div>
                </div>
            </div>
            {layoutMode === "detailed" && <div className="flex h-[47px] flex-wrap items-center gap-1 p-2.5 md:gap-2">
                <div className="h-7 w-[75px] rounded bg-blue-600/35" />
                <div className="h-7 w-9 rounded border-2 border-zinc-800 bg-primary1" />
            </div>}
        </div>
    );

    if (loading || !user || loadingUser) {
        return (
            <div className="min-h-screen px-2 py-3 md:px-4 md:py-5">
                <div className="max-w-6xl mx-auto animate-pulse">
                    <div className="mb-4 flex flex-col items-center gap-3 md:flex-row md:justify-between">
                        <div className="text-center md:text-left">
                            <div className="mb-2 h-7 w-40 rounded bg-gray-600 mx-auto md:mx-0" />
                            <div className="h-3 md:h-4 w-64 bg-gray-700 rounded mx-auto md:mx-0" />
                        </div>
                        <div className="flex gap-2"><div className="h-9 w-16 rounded-lg border-2 border-zinc-800 bg-white/[.04] sm:w-[154px]"/><div className="h-9 w-[126px] rounded-lg bg-blue-600/30" /></div>
                    </div>
                    <div className="mb-5 space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <PackSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-2 py-3 md:px-4 md:py-5">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4 flex flex-col items-center gap-3 md:flex-row md:justify-between">
                    <div className="text-center md:text-left">
                        <h1 className="mb-0.5 text-xl font-bold text-white md:text-2xl">My File Packs</h1>
                        <p className="text-xs text-gray-400">Newest packs first · manage your file collections</p>
                    </div>

                    <div className="flex items-center gap-2">
                    <LayoutModeSwitch value={layoutMode} onChange={changeLayout} />
                    {/* Create Button only shows if not fetching and there are packs */}
                    {!fetchingPacks && packs.length > 0 && (
                        <a
                            href="/files"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm shadow-md"
                        >
                            <FaPlus className="w-3 h-3" />
                            Create Pack
                        </a>
                    )}
                    {fetchingPacks && (
                        <div className="h-9 w-[126px] animate-pulse rounded-lg bg-blue-600/30" />
                    )}
                    </div>
                </div>

                {/* ✅ CHANGED: Ghost Skeletons showing while fetching */}
                {fetchingPacks && (
                    <div className="mb-5 space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <PackSkeleton key={i} />)}
                    </div>
                )}

                {/* Empty State */}
                {!fetchingPacks && packs.length === 0 && (
                    <div className="box-primary shadow-2xl rounded-lg p-6 md:p-12 text-center">
                        <p className="text-gray-400 text-sm md:text-lg mb-3">No packs yet</p>
                        <a
                            href="/files"
                            className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-xs md:text-base"
                        >
                            <FaPlus />
                            Create Pack
                        </a>
                    </div>
                )}

                {/* Packs List */}
                {!fetchingPacks && packs.length > 0 && (
                    <div className="mb-5 space-y-2">
                        {packs.map((pack) => (
                            <div
                                key={pack.packId}
                                className="box-primary overflow-hidden rounded-lg shadow-lg"
                            >
                                <div
                                    className="cursor-pointer border-b border-gray-700 p-2.5 transition-colors hover:bg-white/[.025]"
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={expandedPackId === pack.packId}
                                    onClick={(event) => {
                                        if ((event.target as HTMLElement).closest("[data-pack-action]")) return;
                                        togglePackExpanded(pack.packId);
                                    }}
                                    onKeyDown={(event) => {
                                        if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
                                            event.preventDefault();
                                            togglePackExpanded(pack.packId);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 md:gap-2 mb-1 flex-wrap">
                                                <span className="text-lg text-gray-400 flex-shrink-0">
                                                    {pack.isComplete ? (
                                                        <span className="text-green-400">●</span>
                                                    ) : (
                                                        <span className="text-orange-400">●</span>
                                                    )}
                                                </span>
                                                <span className="text-xs md:text-sm text-white font-semibold flex-shrink-0">
                                                    {pack.totalFiles} file{pack.totalFiles !== 1 ? "s" : ""}
                                                </span>
                                                <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                                                <span className="text-xs md:text-sm text-white font-semibold flex-shrink-0">
                                                    {formatFileSize(pack.totalSize)}
                                                </span>
                                                <span className={`text-xs text-gray-400 flex-shrink-0 ${layoutMode === "compact" ? "hidden sm:inline" : ""}`}>•</span>
                                                <span className={`text-xs text-gray-300 flex-shrink-0 ${layoutMode === "compact" ? "hidden sm:inline" : ""}`}>
                                                    {formatDate(pack.uploadTime)}
                                                </span>
                                                {pack.isPasswordProtected && (
                                                    <FaLock className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0 ml-auto md:ml-0" />
                                                )}
                                                {!pack.isPasswordProtected && (
                                                    <FaLink className="w-3 h-3 md:w-4 md:h-4 text-blue-400 flex-shrink-0 ml-auto md:ml-0 hidden md:block" />
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono truncate flex gap-2 items-center">
                                                <span>{pack.packId}</span>
                                                <FaCopy data-pack-action className={"cursor-pointer hover:text-blue-600 duration-500 transition-all"} onClick={
                                                    () => copyToClipboard(pack.packId, "Link copied!")
                                                } />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 flex-shrink-0">
                                            {layoutMode === "compact" && <>
                                                <a data-pack-action href={`/files/pack/${pack.packId}`} aria-label="View pack" title="View" className="flex h-[26px] w-[26px] items-center justify-center rounded bg-blue-600 text-white transition hover:bg-blue-700"><FaExternalLinkAlt className="h-3 w-3"/></a>
                                                <HoverDiv data-pack-action type="INFO" aria-label="Copy pack link" title="Copy" onClick={() => copyToClipboard(getPackUrl(pack.packId), "Link copied!")} className="h-[26px] w-[26px] p-0"><FaCopy className="h-3 w-3"/></HoverDiv>
                                            </>}
                                            <span className="flex h-[26px] w-[26px] items-center justify-center" aria-hidden="true">
                                                <FaChevronDown
                                                    className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 transition-transform duration-300 ${
                                                        expandedPackId === pack.packId ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </span>
                                            <HoverDiv
                                                data-pack-action
                                                type="DELETE"
                                                onClick={() => handleDeletePack(pack.packId)}
                                                disabled={deletingPackId === pack.packId}
                                                className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition disabled:opacity-50"
                                            >
                                                {deletingPackId === pack.packId ? (
                                                    <LoadingDot size="w-3.5" />
                                                ) : (
                                                    <FaTrash className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                                                )}
                                            </HoverDiv>
                                        </div>
                                    </div>
                                </div>

                                {layoutMode === "detailed" && <div className={`p-2.5 ${expandedPackId === pack.packId ? "border-b" : ""} border-gray-700 flex gap-1 md:gap-2 flex-wrap transition-colors duration-300`}>
                                    <a
                                        href={`/files/pack/${pack.packId}`}
                                        className="flex items-center gap-2 px-2 md:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-xs md:text-sm"
                                    >
                                        <FaExternalLinkAlt />
                                        View
                                    </a>

                                    <HoverDiv
                                        type="INFO"
                                        onClick={() => copyToClipboard(getPackUrl(pack.packId), "Link copied!")}
                                        className="flex items-center gap-2 px-2 md:px-3 py-1 text-gray-200 font-semibold rounded transition text-xs md:text-sm"
                                    >
                                        <FaCopy />
                                    </HoverDiv>
                                </div>}

                                <div
                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                                        expandedPackId === pack.packId ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        {pack.files && pack.files.length > 0 ? (
                                            <div className="bg-black/30 p-2.5">
                                                <p className="text-xs md:text-sm font-semibold text-gray-300 mb-2">
                                                    Files ({pack.files.length})
                                                </p>
                                                <div className="space-y-1 md:space-y-2 max-h-64 md:max-h-96 overflow-y-auto">
                                                    {pack.files.map((file, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="box-primary flex items-center justify-between gap-1 p-2 md:gap-2 transition"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs md:text-sm text-white font-semibold truncate">
                                                                    {file.fileName}
                                                                </p>
                                                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                                            </div>
                                                            <div className="flex gap-1 md:gap-3 flex-shrink-0">
                                                                <HoverDiv
                                                                    type="INFO"
                                                                    onClick={() => copyToClipboard(getFileUrl(file.uniqueId), "Copied!")}
                                                                    className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                                                >
                                                                    <FaCopy className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400" />
                                                                </HoverDiv>
                                                                <a
                                                                    href={getFileUrl(file.uniqueId)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 hover:bg-cyan-500 hover:bg-opacity-20 rounded transition"
                                                                >
                                                                    <FaExternalLinkAlt className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" />
                                                                </a>
                                                                <HoverDiv
                                                                    type="DELETE"
                                                                    onClick={() => handleDeleteFile(pack.packId, file.uniqueId, file.fileName)}
                                                                    disabled={deletingFileId === file.uniqueId}
                                                                    className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition disabled:opacity-50"
                                                                >
                                                                    {deletingFileId === file.uniqueId ? (
                                                                        <LoadingDot size="w-2.5" />
                                                                    ) : (
                                                                        <FaTrash className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400" />
                                                                    )}
                                                                </HoverDiv>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-2 md:p-4 bg-black/30 text-center">
                                                <p className="text-xs md:text-sm text-gray-400">No files</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {packs.length > 0 && totalPages > 1 && !fetchingPacks && (
                    <div className="flex items-center justify-center gap-1 md:gap-4">
                        <HoverDiv
                            type="INFO"
                            onClick={() => {
                                if (currentPage > 0) {
                                    fetchPacks(currentPage - 1);
                                }
                            }}
                            disabled={currentPage === 0}
                            className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                        >
                            <FaChevronLeft className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                        </HoverDiv>

                        <div className="flex items-center gap-0.5 md:gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <HoverDiv
                                    type="INFO"
                                    key={i}
                                    onClick={() => fetchPacks(i)}
                                    className={`px-2 md:px-3 py-1 rounded transition text-xs md:text-sm font-semibold ${
                                        i === currentPage
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                                    }`}
                                >
                                    {i + 1}
                                </HoverDiv>
                            ))}
                        </div>

                        <HoverDiv
                            type="INFO"
                            onClick={() => {
                                if (currentPage < totalPages - 1) {
                                    fetchPacks(currentPage + 1);
                                }
                            }}
                            disabled={currentPage === totalPages - 1}
                            className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                        >
                            <FaChevronRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                        </HoverDiv>
                    </div>
                )}

                {/* Pagination Info */}
                {packs.length > 0 && !fetchingPacks && (
                    <div className="text-center mt-4 text-xs md:text-sm text-gray-400">
                        Page {currentPage + 1}/{totalPages}
                    </div>
                )}
            </div>
        </div>
    );
}
