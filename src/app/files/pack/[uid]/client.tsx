"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios, {CancelTokenSource} from "axios";
import {FaLock, FaCheck, FaCopy, FaDownload, FaArrowLeft, FaEye, FaFileZipper} from "react-icons/fa6";
import { FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { LoadingDot } from "@/components/GlobalComponents";
import LoadingPage from "@/components/LoadingPage";
import MainStringInput from "@/components/MainStringInput";
import { errorToast, infoToast, okToast } from "@/lib/client";
import {getApiUrl, getStorageUrl} from "@/lib/core";

interface FileInfo {
    uniqueId: string;
    fileName: string;
    fileType: string;
    size: number;
    uploadTime: string;
    fileUrl?: string;
}

interface PackInfo {
    packId: string;
    description: string;
    totalFiles: number;
    totalSize: number;
    uploadTime: string;
    isPasswordProtected: boolean;
}

interface PackResponse {
    error: boolean;
    packId: string;
    files: FileInfo[];
    totalFiles: number;
    totalSize: number;
    uploadTime: string;
}

export function PackPageClient() {
    const { uid } = useParams();
    const packId = uid as string;

    const [loading, setLoading] = useState(true);
    const [packInfo, setPackInfo] = useState<PackInfo | null>(null);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
    const [previewPassword, setPreviewPassword] = useState("");

    const cancelTokenRef = useRef<CancelTokenSource | null>(null);

    useEffect(() => {
        fetchPackInfo();
    }, [packId]);

    const fetchPackInfo = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                getApiUrl() + `/v1/files/pack/public/${packId}/info`, {withCredentials: true}
            );

            if (!response.data.error) {
                setPackInfo(response.data);
                if (response.data.isPasswordProtected && !response.data.hasAccess) {
                    setRequiresPassword(true);
                } else {
                    fetchPackFiles("");
                }
            }
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message ||
                err.message ||
                "Failed to load pack";
            setError(errorMsg);
            errorToast(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchPackFiles = async (pwd: string = "") => {
        try {
            setLoading(true);
            const requestBody = pwd ? { password: pwd } : {};

            const response = await axios.post<PackResponse>(
                getApiUrl() + `/v1/files/pack/public/${packId}`, requestBody, {withCredentials: true}
            );

            if (!response.data.error) {
                setFiles(response.data.files);
                setPackInfo((prev) =>
                    prev
                        ? {
                            ...prev,
                            totalFiles: response.data.totalFiles,
                            totalSize: response.data.totalSize,
                        }
                        : null
                );
                setRequiresPassword(false);
                setPasswordError(null);
                setPassword("");
            }
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message ||
                err.message ||
                "Failed to load pack files";
            setPasswordError(errorMsg);
            errorToast(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            setPasswordError("Password cannot be empty");
            return;
        }

        await fetchPackFiles(password);
    };

    const handleDownloadZip = async () => {
        try {
            setDownloading(true);
            setDownloadProgress(0);
            setDownloadError(null);

            // Create cancel token for this request
            cancelTokenRef.current = axios.CancelToken.source();

            const requestBody = packInfo?.isPasswordProtected
                ? { password: previewPassword || password }
                : {};

            if (packInfo?.isPasswordProtected && !previewPassword && !password) {
                errorToast("Password required to download");
                setDownloading(false);
                return;
            }

            const response = await axios.post(
                getApiUrl() + `/v1/files/pack/public/${packId}/download/zip`,
                requestBody,
                {
                    responseType: 'blob',
                    withCredentials: true,
                    timeout: 600000, // 10 minutes
                    cancelToken: cancelTokenRef.current.token,
                    onDownloadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            setDownloadProgress(percentCompleted);
                        }
                    },
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pack-${packId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            okToast("Pack downloaded successfully!");
            setDownloadProgress(0);
        } catch (err: any) {
            if (axios.isCancel(err)) {
                setDownloadError("Download cancelled");
                errorToast("Download cancelled");
            } else {
                const errorMsg = err.response?.data?.message || "Failed to download pack";
                setDownloadError(errorMsg);
                errorToast(errorMsg);
            }
            setDownloadProgress(0);
        } finally {
            setDownloading(false);
            cancelTokenRef.current = null;
        }
    };

    const handleCancelDownload = () => {
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel("Download cancelled by user");
            setDownloading(false);
            setDownloadProgress(0);
            setDownloadError("Download cancelled");
        }
    };

    const copyToClipboard = (text: string) => {
        const url = getStorageUrl() + "/files/" + text;
        navigator.clipboard.writeText(url);
        infoToast("File URL copied to clipboard");
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
            " " +
            sizes[i]
        );
    };

    const isMediaPreviewable = (fileType: string): boolean => {
        return /^(image\/(png|jpg|jpeg|gif|webp|svg)|video\/)/.test(fileType);
    };

    const isPdfOrDoc = (fileType: string): boolean => {
        return /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(fileType);
    };

    const getFileExtension = (fileName: string): string => {
        return fileName.split('.').pop()?.toLowerCase() || '';
    };

    if (loading) {
        return <LoadingPage />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="box-primary shadow-2xl w-full max-w-md">
                    <div className="space-y-6 p-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white">
                                Error
                            </h1>
                            <p className="text-gray-400 mt-4">{error}</p>
                        </div>

                        <a
                            href="/files"
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-900/60 text-gray-200 font-semibold rounded transition flex items-center justify-center gap-2"
                        >
                            <FaArrowLeft className="w-4 h-4" />
                            Back to Upload
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (requiresPassword && packInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="box-primary shadow-2xl w-full max-w-md">
                    <div className="space-y-6 p-6">
                        <div className="text-center">
                            <FaLock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white">
                                Password Protected
                            </h1>
                            <p className="text-gray-400 mt-2">
                                {packInfo.description ||
                                    "This pack is password protected"}
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-300 block mb-2">
                                    Enter Password
                                </label>
                                <MainStringInput
                                    type="password"
                                    autoComplete="off"
                                    id="image"
                                    value={password}
                                    onChange={(value) => {
                                        setPassword(value);
                                        setPasswordError(null);
                                    }}
                                    onFocus={() => {
                                        setTimeout(() => setIsFocused(true), 100);
                                    }}
                                    placeholder="Enter pack password..."
                                    className={`xl:text-base text-xs w-full ${isFocused ? "text-dots" : ""}`}
                                    autoFocus
                                />
                            </div>

                            {passwordError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                                    <p className="text-red-400 text-sm">
                                        {passwordError}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <LoadingDot size="w-4" />
                                        Unlocking...
                                    </>
                                ) : (
                                    <>
                                        <FaLock size={16} />
                                        Unlock Pack
                                    </>
                                )}
                            </button>
                        </form>

                        <a
                            href="/files"
                            className="w-full py-2 bg-zinc-900 hover:bg-zinc-900/60 text-gray-200 font-semibold rounded transition flex items-center justify-center gap-2 text-sm"
                        >
                            <FaArrowLeft className="w-3 h-3" />
                            Back to Upload
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (!packInfo || files.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="box-primary shadow-2xl w-full max-w-md">
                    <div className="space-y-6 p-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white">
                                No Files
                            </h1>
                            <p className="text-gray-400 mt-4">
                                This pack is empty
                            </p>
                        </div>

                        <a
                            href="/files"
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-900/60 text-gray-200 font-semibold rounded transition flex items-center justify-center gap-2"
                        >
                            <FaArrowLeft className="w-4 h-4" />
                            Back to Upload
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="box-primary shadow-2xl w-full max-w-2xl">
                <div className="space-y-6 p-6">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">
                            File Pack
                        </h1>
                        {packInfo.description && (
                            <p className="text-gray-400 mt-2">
                                {packInfo.description}
                            </p>
                        )}
                        <p className="text-gray-500 text-sm mt-1">
                            {packInfo.totalFiles} file(s) •{" "}
                            {formatFileSize(packInfo.totalSize)}
                        </p>
                    </div>

                    {/* Files List */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {files.map((file, idx) => (
                            <div
                                key={idx}
                                className="box-primary p-4 rounded-lg hover:bg-opacity-80 transition"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold truncate">
                                            {file.fileName}
                                        </p>
                                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>•</span>
                                            <span>
                                                {new Date(
                                                    file.uploadTime
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {/* Preview button for media/pdf/doc */}
                                        {(isMediaPreviewable(file.fileType) || isPdfOrDoc(file.fileType)) && (
                                            <button
                                                onClick={() => setPreviewFile(file)}
                                                className="p-2 hover:bg-purple-500 hover:bg-opacity-20 rounded transition"
                                                title="Preview"
                                            >
                                                <FaEye className="w-4 h-4 text-purple-400" />
                                            </button>
                                        )}

                                        {/* Open in new tab */}
                                        <a
                                            href={getStorageUrl() + "/files/" + file.uniqueId}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-cyan-500 hover:bg-opacity-20 rounded transition"
                                            title="Open"
                                        >
                                            <FaExternalLinkAlt className="w-4 h-4 text-cyan-400" />
                                        </a>

                                        {/* Copy URL */}
                                        <button
                                            onClick={() =>
                                                copyToClipboard(file.uniqueId)
                                            }
                                            className="p-2 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                            title="Copy URL"
                                        >
                                            <FaCopy className="w-4 h-4 text-blue-400" />
                                        </button>

                                        {/* Download */}
                                        <a
                                            href={getStorageUrl() + "/files/" + file.uniqueId + "?download=true"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-green-500 hover:bg-opacity-20 rounded transition"
                                            title="Download"
                                        >
                                            <FaDownload className="w-4 h-4 text-green-400" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Download as ZIP button */}
                    {files.length > 1 && (
                        <button
                            onClick={handleDownloadZip}
                            disabled={downloading}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                        >
                            {downloading ? (
                                <>
                                    <LoadingDot size="w-4" />
                                    Preparing ({downloadProgress}%)...
                                </>
                            ) : (
                                <>
                                    <FaFileZipper className="w-4 h-4" />
                                    Download All as .zip
                                </>
                            )}
                        </button>
                    )}

                    {/* Download Progress Bar */}
                    {downloading && (
                        <div className="space-y-3">
                            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-300"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>{downloadProgress}% complete</span>
                                <button
                                    onClick={handleCancelDownload}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition flex items-center gap-1"
                                >
                                    <FaTimes className="w-3 h-3" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Download Error */}
                    {downloadError && !downloading && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                            <p className="text-red-400 text-sm">
                                {downloadError}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <a
                        href="/files"
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-900/60 text-gray-200 font-semibold rounded transition flex items-center justify-center gap-2 text-sm"
                    >
                        <FaArrowLeft className="w-3 h-3" />
                        Back to Upload
                    </a>
                </div>

                {/* Preview Modal */}
                {previewFile && (
                    <div
                        className="fixed inset-0 flex items-center justify-center p-4 z-50"
                        onClick={() => setPreviewFile(null)}
                    >
                        <div
                            className="box-primary shadow-2xl w-full max-w-4xl min-h-[90vh] overflow-auto flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0">
                                <h2 className="text-white font-semibold truncate flex-1">
                                    {previewFile.fileName}
                                </h2>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="p-2 hover:bg-gray-800 rounded transition ml-4"
                                >
                                    <FaTimes className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                                {isMediaPreviewable(previewFile.fileType) && (
                                    previewFile.fileType.startsWith('image/') ? (
                                        <img
                                            src={getStorageUrl() + "/files/" + previewFile.uniqueId}
                                            alt={previewFile.fileName}
                                            className="max-w-full max-h-full object-contain rounded"
                                        />
                                    ) : previewFile.fileType.startsWith('video/') ? (
                                        <video
                                            controls
                                            className="max-w-full max-h-full rounded"
                                        >
                                            <source src={getStorageUrl() + "/files/" + previewFile.uniqueId} type={previewFile.fileType} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : null
                                )}

                                {/* PDF Preview using iframe */}
                                {previewFile.fileType === 'application/pdf' && (
                                    <iframe
                                        src={`${getStorageUrl()}/files/${previewFile.uniqueId}#toolbar=1&navpanes=0&scrollbar=1`}
                                        className="w-full min-h-[70vh] rounded"
                                        title="PDF Preview"
                                    />
                                )}

                                {/* Word Document Preview - Using Office Online Viewer */}
                                {(previewFile.fileType === 'application/msword' ||
                                    previewFile.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') && (
                                    <iframe
                                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(getStorageUrl() + "/files/" + previewFile.uniqueId)}`}
                                        className="w-full min-h-[70vh] rounded"
                                        title="Document Preview"
                                    />
                                )}

                                {/* Fallback for unsupported preview */}
                                {!isMediaPreviewable(previewFile.fileType) && !isPdfOrDoc(previewFile.fileType) && (
                                    <div className="text-center">
                                        <p className="text-gray-400 mb-4">Preview not available for this file type</p>
                                        <a
                                            href={getStorageUrl() + "/files/" + previewFile.uniqueId}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                                        >
                                            Download File
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-2 p-4 border-t border-gray-700 bg-black/90">
                                <a
                                    href={getStorageUrl() + "/files/" + previewFile.uniqueId}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                                >
                                    <FaExternalLinkAlt className="w-4 h-4" />
                                    Open
                                </a>
                                <a
                                    href={getStorageUrl() + "/files/" + previewFile.uniqueId + "?download=true"}
                                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                                >
                                    <FaDownload className="w-4 h-4" />
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}