"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaLock, FaCheck, FaCopy, FaDownload } from "react-icons/fa6";
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

    useEffect(() => {
        fetchPackInfo();
    }, [packId]);

    const fetchPackInfo = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                getApiUrl() + `/v1/files/pack/public/${packId}/info`
            );

            if (!response.data.error) {
                setPackInfo(response.data);
                if (response.data.isPasswordProtected) {
                    setRequiresPassword(true);
                } else {
                    // No password, fetch files directly
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
                getApiUrl() + `/v1/files/pack/public/${packId}`,
                requestBody
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
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition flex items-center justify-center"
                        >
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
                                    type="text"
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
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded transition flex items-center justify-center text-sm"
                        >
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
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition flex items-center justify-center"
                        >
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

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                copyToClipboard(file.uniqueId)
                                            }
                                            className="p-2 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                            title="Copy URL"
                                        >
                                            <FaCopy className="w-4 h-4 text-blue-400" />
                                        </button>
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

                    {/* Footer */}
                    <div className="flex gap-3">
                        <a
                            href="/files"
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded transition flex items-center justify-center"
                        >
                            Back to Upload
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}