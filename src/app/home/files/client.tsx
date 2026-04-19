"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaLock, FaLink, FaTrash, FaChevronLeft, FaChevronRight, FaChevronDown, FaCopy, FaPlus } from "react-icons/fa6";
import { FaExternalLinkAlt } from "react-icons/fa";
import { LoadingDot } from "@/components/GlobalComponents";
import LoadingPage from "@/components/LoadingPage";
import { errorToast, infoToast, okToast } from "@/lib/client";
import { getApiUrl, getStorageUrl } from "@/lib/core";
import HoverDiv from "@/components/HoverDiv";

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

    const router = useRouter();

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

            setPacks(response.data.packs);
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
        return `${window.location.origin}/files/pack/${packId}`;
    };

    const getFileUrl = (uniqueId: string) => {
        return `${getStorageUrl()}/files/${uniqueId}`;
    };

    const copyToClipboard = (text: string, message: string = "Copied!") => {
        navigator.clipboard.writeText(text);
        infoToast(message);
    };

    if (loading || !user || loadingUser) return <LoadingPage />;

    return (
        <div className="min-h-screen px-2 md:px-4 py-4 md:py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:justify-between mb-4 md:mb-8 gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">My File Packs</h1>
                        <p className="text-xs md:text-base text-gray-400">Manage your file collections</p>
                    </div>

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
                </div>

                {/* ✅ CHANGED: Ghost Skeletons showing while fetching */}
                {fetchingPacks && (
                    <div className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="box-primary shadow-lg rounded-lg overflow-hidden animate-pulse">
                                {/* Skeleton Header */}
                                <div className="p-2 md:p-4 border-b border-gray-700 flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 md:gap-4 w-full">
                                        <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-600 rounded-full flex-shrink-0"></div>
                                        <div className="h-3 md:h-4 bg-gray-600 rounded w-16 md:w-20"></div>
                                        <div className="h-3 md:h-4 bg-gray-600 rounded w-12 md:w-16"></div>
                                        <div className="h-3 md:h-4 bg-gray-600 rounded w-24 md:w-32 hidden md:block"></div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <div className="w-4 h-4 md:w-6 md:h-6 bg-gray-600 rounded"></div>
                                        <div className="w-4 h-4 md:w-6 md:h-6 bg-gray-600 rounded"></div>
                                    </div>
                                </div>
                                {/* Skeleton Actions */}
                                <div className="p-2 md:p-4 flex gap-2">
                                    <div className="h-6 md:h-8 w-16 md:w-20 bg-gray-600 rounded"></div>
                                    <div className="h-6 md:h-8 w-8 md:w-10 bg-gray-600 rounded"></div>
                                </div>
                            </div>
                        ))}
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
                    <div className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                        {packs.map((pack) => (
                            <div
                                key={pack.packId}
                                className="box-primary shadow-lg rounded-lg overflow-hidden"
                            >
                                <div className="p-2 md:p-4 border-b border-gray-700">
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
                                                <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                                                <span className="text-xs text-gray-300 flex-shrink-0">
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
                                                <FaCopy className={"cursor-pointer hover:text-blue-600 duration-500 transition-all"} onClick={
                                                    () => copyToClipboard(pack.packId, "Link copied!")
                                                } />
                                            </div>
                                        </div>

                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => togglePackExpanded(pack.packId)}
                                                className="p-1 hover:bg-gray-700 rounded transition"
                                            >
                                                <FaChevronDown
                                                    className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 transition-transform duration-300 ${
                                                        expandedPackId === pack.packId ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePack(pack.packId)}
                                                disabled={deletingPackId === pack.packId}
                                                className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition disabled:opacity-50"
                                            >
                                                {deletingPackId === pack.packId ? (
                                                    <LoadingDot size="w-3.5" />
                                                ) : (
                                                    <FaTrash className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-2 md:p-4 ${expandedPackId === pack.packId ? "border-b" : ""} border-gray-700 flex gap-1 md:gap-2 flex-wrap transition-colors duration-300`}>
                                    <a
                                        href={`/files/pack/${pack.packId}`}
                                        className="flex items-center gap-2 px-2 md:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-xs md:text-sm"
                                    >
                                        <FaExternalLinkAlt />
                                        View
                                    </a>

                                    <HoverDiv
                                        onClick={() => copyToClipboard(getPackUrl(pack.packId), "Link copied!")}
                                        className="flex items-center gap-2 px-2 md:px-3 py-1 text-gray-200 font-semibold rounded transition text-xs md:text-sm"
                                    >
                                        <FaCopy />
                                    </HoverDiv>
                                </div>

                                <div
                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                                        expandedPackId === pack.packId ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        {pack.files && pack.files.length > 0 ? (
                                            <div className="p-2 md:p-4 bg-black/30">
                                                <p className="text-xs md:text-sm font-semibold text-gray-300 mb-2">
                                                    Files ({pack.files.length})
                                                </p>
                                                <div className="space-y-1 md:space-y-2 max-h-64 md:max-h-96 overflow-y-auto">
                                                    {pack.files.map((file, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-2 md:p-3 box-primary flex items-center justify-between gap-1 md:gap-2 transition"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs md:text-sm text-white font-semibold truncate">
                                                                    {file.fileName}
                                                                </p>
                                                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                                            </div>
                                                            <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                                                                <button
                                                                    onClick={() => copyToClipboard(getFileUrl(file.uniqueId), "Copied!")}
                                                                    className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                                                >
                                                                    <FaCopy className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400" />
                                                                </button>
                                                                <a
                                                                    href={getFileUrl(file.uniqueId)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 hover:bg-cyan-500 hover:bg-opacity-20 rounded transition"
                                                                >
                                                                    <FaExternalLinkAlt className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" />
                                                                </a>
                                                                <button
                                                                    onClick={() => handleDeleteFile(pack.packId, file.uniqueId, file.fileName)}
                                                                    disabled={deletingFileId === file.uniqueId}
                                                                    className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition disabled:opacity-50"
                                                                >
                                                                    {deletingFileId === file.uniqueId ? (
                                                                        <LoadingDot size="w-2.5" />
                                                                    ) : (
                                                                        <FaTrash className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400" />
                                                                    )}
                                                                </button>
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
                        <button
                            onClick={() => {
                                if (currentPage > 0) {
                                    fetchPacks(currentPage - 1);
                                }
                            }}
                            disabled={currentPage === 0}
                            className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                        >
                            <FaChevronLeft className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                        </button>

                        <div className="flex items-center gap-0.5 md:gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => fetchPacks(i)}
                                    className={`px-2 md:px-3 py-1 rounded transition text-xs md:text-sm font-semibold ${
                                        i === currentPage
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                if (currentPage < totalPages - 1) {
                                    fetchPacks(currentPage + 1);
                                }
                            }}
                            disabled={currentPage === totalPages - 1}
                            className="p-1 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                        >
                            <FaChevronRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                        </button>
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