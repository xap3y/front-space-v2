"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaLock, FaLink, FaTrash, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp, FaCopy } from "react-icons/fa6";
import { FaExternalLinkAlt } from "react-icons/fa";
import { LoadingDot } from "@/components/GlobalComponents";
import LoadingPage from "@/components/LoadingPage";
import { errorToast, infoToast, okToast } from "@/lib/client";
import { getApiUrl, getStorageUrl } from "@/lib/core";

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
    const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());

    const router = useRouter();

    useEffect(() => {
        setPage("files");

        if (loadingUser) {
            return;
        } else if (!loadingUser && !user) {
            setLoading(true);
            return router.push("/login");
        }

        setLoading(false);
        fetchPacks(0);
    }, [user, loadingUser, error, setPage, router]);

    const fetchPacks = async (page: number) => {
        try {
            setFetchingPacks(true);

            const response = await axios.get<PacksResponse>(
                getApiUrl() + `/v1/files/packs?page=${page}&size=${pageSize}`,
                {
                    withCredentials: true,
                }
            );

            setPacks(response.data.packs);
            setCurrentPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to load packs";
            errorToast(errorMsg);
        } finally {
            setFetchingPacks(false);
        }
    };

    const togglePackExpanded = (packId: string) => {
        const newExpanded = new Set(expandedPacks);
        if (newExpanded.has(packId)) {
            newExpanded.delete(packId);
        } else {
            newExpanded.add(packId);
        }
        setExpandedPacks(newExpanded);
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

    // ✅ CHANGED: Include time in date format
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
                {/* Header */}
                <div className="text-center mb-4 md:mb-8">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">My File Packs</h1>
                    <p className="text-xs md:text-base text-gray-400">Manage your file collections</p>
                </div>

                {/* Empty State */}
                {!fetchingPacks && packs.length === 0 && (
                    <div className="box-primary shadow-2xl rounded-lg p-6 md:p-12 text-center">
                        <p className="text-gray-400 text-sm md:text-lg mb-3">No packs yet</p>
                        <a
                            href="/files"
                            className="inline-block px-4 md:px-6 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-xs md:text-base"
                        >
                            Create Pack
                        </a>
                    </div>
                )}

                {/* Packs List */}
                {packs.length > 0 && (
                    <div className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                        {packs.map((pack) => (
                            <div
                                key={pack.packId}
                                className="box-primary shadow-lg rounded-lg overflow-hidden"
                            >
                                {/* Pack Header - Compact */}
                                <div className="p-2 md:p-4 border-b border-gray-700">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            {/* Status, Icons & Info on one line */}
                                            <div className="flex items-center gap-1 md:gap-2 mb-1 flex-wrap">
                                                {/* Status Dot */}
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {pack.isComplete ? (
                                                        <span className="text-green-400">●</span>
                                                    ) : (
                                                        <span className="text-orange-400">●</span>
                                                    )}
                                                </span>

                                                {/* Files & Size */}
                                                <span className="text-xs md:text-sm text-white font-semibold flex-shrink-0">
                                                    {pack.totalFiles} file{pack.totalFiles !== 1 ? "s" : ""}
                                                </span>

                                                <span className="text-xs text-gray-400 flex-shrink-0">•</span>

                                                <span className="text-xs md:text-sm text-white font-semibold flex-shrink-0">
                                                    {formatFileSize(pack.totalSize)}
                                                </span>

                                                {/* Divider */}
                                                <span className="text-xs text-gray-400 flex-shrink-0">•</span>

                                                {/* Date & Time */}
                                                <span className="text-xs text-gray-300 flex-shrink-0">
                                                    {formatDate(pack.uploadTime)}
                                                </span>

                                                {/* Icons */}
                                                {pack.isPasswordProtected && (
                                                    <FaLock className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0 ml-auto md:ml-0" />
                                                )}

                                                {!pack.isPasswordProtected && (
                                                    <FaLink className="w-3 h-3 md:w-4 md:h-4 text-blue-400 flex-shrink-0 ml-auto md:ml-0 hidden md:block" />
                                                )}
                                            </div>

                                            {/* Pack ID - Hidden on mobile */}
                                            <p className="text-xs text-gray-500 font-mono truncate hidden md:block">
                                                {pack.packId}
                                            </p>
                                        </div>

                                        <div className="flex gap-1 flex-shrink-0">
                                            {/* Expand Button */}
                                            <button
                                                onClick={() => togglePackExpanded(pack.packId)}
                                                className="p-1 hover:bg-gray-700 rounded transition"
                                            >
                                                {expandedPacks.has(pack.packId) ? (
                                                    <FaChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                                                ) : (
                                                    <FaChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                                                )}
                                            </button>

                                            {/* Delete Button */}
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

                                {/* Pack Actions - Compact */}
                                <div className="p-2 md:p-4 border-b border-gray-700 flex gap-1 md:gap-2 flex-wrap">
                                    <a
                                        href={`/files/pack/${pack.packId}`}
                                        className="px-2 md:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-xs md:text-sm"
                                    >
                                        View
                                    </a>

                                    <button
                                        onClick={() => copyToClipboard(getPackUrl(pack.packId), "Link copied!")}
                                        className="px-2 md:px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded transition text-xs md:text-sm"
                                    >
                                        Copy
                                    </button>
                                </div>

                                {/* Files List - Expandable */}
                                {expandedPacks.has(pack.packId) && pack.files && pack.files.length > 0 && (
                                    <div className="p-2 md:p-4 bg-black/30">
                                        <p className="text-xs md:text-sm font-semibold text-gray-300 mb-2">Files ({pack.files.length})</p>
                                        <div className="space-y-1 md:space-y-2 max-h-64 md:max-h-96 overflow-y-auto">
                                            {pack.files.map((file, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 md:p-3 bg-gray-800/50 rounded flex items-center justify-between gap-1 md:gap-2 hover:bg-gray-800 transition"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs md:text-sm text-white font-semibold truncate">
                                                            {file.fileName}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                                    </div>

                                                    <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                                                        {/* Copy */}
                                                        <button
                                                            onClick={() => copyToClipboard(getFileUrl(file.uniqueId), "Copied!")}
                                                            className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                                        >
                                                            <FaCopy className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400" />
                                                        </button>

                                                        {/* Open */}
                                                        <a
                                                            href={getFileUrl(file.uniqueId)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 hover:bg-cyan-500 hover:bg-opacity-20 rounded transition"
                                                        >
                                                            <FaExternalLinkAlt className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" />
                                                        </a>

                                                        {/* Delete */}
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
                                )}

                                {/* Expanded but No Files */}
                                {expandedPacks.has(pack.packId) && (!pack.files || pack.files.length === 0) && (
                                    <div className="p-2 md:p-4 bg-black/30 text-center">
                                        <p className="text-xs md:text-sm text-gray-400">No files</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {fetchingPacks && (
                    <div className="flex items-center justify-center py-8">
                        <LoadingDot size="w-6 md:w-8" />
                        <span className="ml-2 text-xs md:text-base text-gray-400">Loading...</span>
                    </div>
                )}

                {/* Pagination - Compact */}
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

                {/* Pagination Info - Compact */}
                {packs.length > 0 && (
                    <div className="text-center mt-4 text-xs md:text-sm text-gray-400">
                        Page {currentPage + 1}/{totalPages}
                    </div>
                )}
            </div>
        </div>
    );
}