"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import axios, { CancelTokenSource } from "axios";
import { MdOutlineDelete } from "react-icons/md";
import { FaCheck, FaDownload, FaCopy, FaPlus, FaPen, FaLink, FaLock, FaLockOpen } from "react-icons/fa6";
import {FaExclamationTriangle, FaTimes} from "react-icons/fa";
import { LoadingDot } from "@/components/GlobalComponents";
import LoadingPage from "@/components/LoadingPage";
import MainStringInput from "@/components/MainStringInput";
import { errorToast, infoToast, okToast, validateApiKey } from "@/lib/client";
import { useDebounce } from "@/hooks/useDebounce";
import {getApiUrl, getStorageUrl} from "@/lib/core";

interface UploadItem {
    id: string;
    file: File;
    realFileName: string;
    progress: number;
    speed: number;
    status: "pending" | "uploading" | "completed" | "error" | "cancelled";
    uploadedUrl?: string;
    error?: string;
    cancelToken?: CancelTokenSource;
}

interface UploadedFile {
    uniqueId: string;
    fileName: string;
    originalFileName: string;
    fileType: string;
    size: number;
    uploadedAt: string;
    fileUrl: string;
}

interface FileRegisterRequest {
    items: {
        uniqueId: string;
        fileName?: string;
        fileType: string;
        size: number;
        description?: string;
        password?: string;
        expiryDate?: number;
    }[];
    password?: string;
    description?: string;
    source?: string;
}

interface FileUploadResponse {
    error: boolean;
    packId: string;
    files: any[];
    totalFiles: number;
    totalSize: number;
    uploadTime: string;
}

const MAX_FILES = 15;
const MAX_SIZE = 1024 * 1024 * 1024; // TODO

export function FilesPageClient() {
    const { user, loadingUser } = useUser();
    const router = useRouter();

    const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [registrationError, setRegistrationError] = useState<string | null>(null);
    const [packId, setPackId] = useState<string | null>(null);

    const [apiKey, setApiKey] = useState<string>("");
    const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
    const [isKeyValidating, setIsKeyValidating] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isPassFocused, setIsPassFocused] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>("");

    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [packPassword, setPackPassword] = useState("");

    const uploadItemsRef = useRef<UploadItem[]>(uploadItems);
    const uploadedFilesRef = useRef<UploadedFile[]>(uploadedFiles);

    useEffect(() => {
        uploadItemsRef.current = uploadItems;
    }, [uploadItems]);

    useEffect(() => {
        uploadedFilesRef.current = uploadedFiles;
    }, [uploadedFiles]);

    const debouncedApiKey = useDebounce(apiKey, 1000);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const errorModalRef = useRef<HTMLDivElement>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        multiple: true,
        onDrop: (acceptedFiles) => {
            if (!isKeyValid || !apiKey) {
                return;
            }
            addFilesToQueue(acceptedFiles);
        },
    });

    const { getRootProps: getAddMoreRootProps, getInputProps: getAddMoreInputProps, isDragActive: isAddMoreDragActive } = useDropzone({
        multiple: true,
        onDrop: (acceptedFiles) => {
            if (!isKeyValid || !apiKey) {
                return;
            }
            addFilesToQueue(acceptedFiles);
        },
    });

    const addFilesToQueue = (files: File[]) => {
        const remainingSlots = MAX_FILES - uploadItems.filter(i => i.status !== "cancelled").length;
        if (remainingSlots <= 0) {
            errorToast("Maximum " + MAX_FILES + " files allowed");
            return;
        }

        const newItems: UploadItem[] = files.slice(0, remainingSlots).map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            realFileName: file.name,
            progress: 0,
            speed: 0,
            status: "pending",
        }));

        setUploadItems((prev) => [...prev, ...newItems]);
    };

    useEffect(() => {
        if (!loadingUser && user && !apiKey) {
            setApiKey(user.apiKey);
            setIsKeyValid(true);
        }
    }, [loadingUser, user, router]);

    useEffect(() => {
        if (!debouncedApiKey) {
            setIsKeyValid(null);
            return;
        }

        setIsKeyValidating(true);

        const validateIt = async () => {
            const isValid = await validateApiKey(debouncedApiKey);

            if (typeof isValid == "boolean" && !isValid) {
                setIsKeyValid(false);
            } else {
                setIsKeyValid(true);
            }

            setTimeout(() => {
                setIsKeyValidating(false);
            }, 100);
        };

        validateIt();
    }, [debouncedApiKey]);

    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (!isKeyValid || !apiKey) {
                return;
            }

            if (!e.clipboardData || !e.clipboardData.items) return;

            const files: File[] = [];
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                addFilesToQueue(files);
                okToast(`${files.length} file(s) pasted`);
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, [isKeyValid, apiKey]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && editingId) {
                setEditingId(null);
                setEditingName("");
            }
        };

        if (editingId) {
            window.addEventListener("keydown", handleEscape);
            return () => window.removeEventListener("keydown", handleEscape);
        }
    }, [editingId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setEditingId(null);
                setEditingName("");
            }
        };

        if (editingId) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [editingId]);

    if (loadingUser) return <LoadingPage />;

    const handleRemoveFile = (id: string) => {
        setUploadItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleCancelItemUpload = (id: string) => {
        const item = uploadItems.find((i) => i.id === id);
        if (item?.cancelToken) {
            item.cancelToken.cancel("Upload cancelled by user");
        }
        setUploadItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, status: "cancelled" } : i
            )
        );
    };

    const handleCancelQueuedItem = (id: string) => {
        setUploadItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, status: "cancelled" } : i
            )
        );
    };

    const handleEditFile = (id: string, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    const handleSaveEdit = () => {
        if (!editingName.trim()) {
            errorToast("File name cannot be empty");
            return;
        }

        setUploadItems((prev) =>
            prev.map((i) =>
                i.id === editingId
                    ? { ...i, realFileName: editingName }
                    : i
            )
        );

        setEditingId(null);
        setEditingName("");
        okToast("File renamed");
    };

    const uploadFile = async (item: UploadItem) => {
        try {
            const cancelToken = axios.CancelToken.source();

            setUploadItems((prev) =>
                prev.map((i) =>
                    i.id === item.id
                        ? { ...i, status: "uploading", cancelToken }
                        : i
                )
            );

            let uid = fileName.trim();
            let filenameNew: string;
            let originalName = item.realFileName;
            let extension = "";

            const split = originalName.split(".");
            if (split.length > 1) {
                extension = "." + split[split.length - 1];
            }

            const activeCount = uploadItemsRef.current.filter(i => i.status !== "cancelled").length;

            if (activeCount === 1 && uid) {
                filenameNew = uid + extension;
            } else {
                uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                filenameNew = uid + extension;
            }

            const presignRes = await axios.post(
                "/api/s3/upload/files",
                {
                    filename: filenameNew,
                    contentType: item.file.type,
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        filename: encodeURIComponent(filenameNew),
                    },
                    cancelToken: cancelToken.token,
                }
            );

            const uploadUrl = presignRes.data.url;
            const startTime = performance.now();

            await axios.put(uploadUrl, item.file, {
                headers: {
                    "Content-Type": item.file.type,
                },
                onUploadProgress: (progressEvent) => {
                    const { loaded, total } = progressEvent;
                    if (!total) return;

                    const percent = (loaded / total) * 100;
                    const elapsedSec = (performance.now() - startTime) / 1000;
                    const speed = elapsedSec > 0 ? Math.round((loaded / elapsedSec) / 1024) : 0;

                    setUploadItems((prev) =>
                        prev.map((i) =>
                            i.id === item.id
                                ? { ...i, progress: Math.round(percent), speed }
                                : i
                        )
                    );
                },
                cancelToken: cancelToken.token,
            });

            const fileUrl = getStorageUrl() + "/files/" + filenameNew;

            setUploadItems((prev) =>
                prev.map((i) =>
                    i.id === item.id
                        ? { ...i, status: "completed", uploadedUrl: fileUrl, progress: 100 }
                        : i
                )
            );

            const newUploadedFile: UploadedFile = {
                uniqueId: filenameNew,
                fileName: filenameNew,
                originalFileName: originalName,
                fileType: item.file.type,
                size: item.file.size,
                uploadedAt: new Date().toLocaleString(),
                fileUrl,
            };

            setUploadedFiles((prev) => [...prev, newUploadedFile]);

            return newUploadedFile;
        } catch (err: any) {
            if (axios.isCancel(err)) {
                return;
            }

            const errorMessage = err.response?.data?.error || err.message || "Failed to upload";
            setUploadItems((prev) =>
                prev.map((i) =>
                    i.id === item.id
                        ? { ...i, status: "error", error: errorMessage }
                        : i
                )
            );
            errorToast(errorMessage);
            return null;
        }
    };

    const registerFilesWithBackend = async (filesToRegister: UploadedFile[]) => {
        try {
            if (filesToRegister.length === 0) {
                errorToast("No files to register");
                return;
            }

            const registerRequest: FileRegisterRequest = {
                items: filesToRegister.map(file => ({
                    uniqueId: file.uniqueId,
                    fileName: file.originalFileName,
                    fileType: file.fileType || "application/octet-stream",
                    size: file.size,
                })),
                source: "PORTAL",
                password: isPasswordProtected && packPassword.trim() ? packPassword : undefined,
            };

            const response = await axios.post<FileUploadResponse>(
                getApiUrl() + "/v1/files/register",
                registerRequest,
                {
                    headers: {
                        "x-api-key": apiKey,
                    },
                }
            );

            if (response.data && response.data.packId) {
                setPackId(response.data.packId);
            }

            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || "Failed to register files";
            setRegistrationError(errorMessage);
            errorToast("Registration failed: " + errorMessage);
            return null;
        }
    };

    const handleUpload = async () => {
        const pendingItems = uploadItems.filter(i => i.status === "pending");

        if (pendingItems.length === 0) {
            errorToast("No files to upload (all cancelled)");
            return;
        }

        if (!apiKey || !isKeyValid) {
            errorToast("Please enter a valid API key");
            return;
        }

        if (isPasswordProtected && !packPassword.trim()) {
            errorToast("Please enter a password");
            return;
        }

        setUploading(true);
        const successfullyUploaded: UploadedFile[] = [];

        for (const item of pendingItems) {
            const currentItemState = uploadItemsRef.current.find(i => i.id === item.id);

            if (currentItemState && currentItemState.status === "cancelled") {
                continue;
            }

            const uploadedFile = await uploadFile(item);

            if (uploadedFile) {
                successfullyUploaded.push(uploadedFile);
            }
        }

        setUploading(false);

        if (successfullyUploaded.length > 0) {
            okToast("All files uploaded!");
            await registerFilesWithBackend(successfullyUploaded);
        } else {
            errorToast("No files successfully uploaded to register.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        infoToast("Copied to clipboard!");
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const handleAddMore = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            addFilesToQueue(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const activeItems = uploadItems.filter(i => i.status !== "cancelled");
    const isMultiple = activeItems.length > 1;
    const allCompleted = uploadItems.every((i) => i.status === "completed" || i.status === "error" || i.status === "cancelled");
    const canAddMore = activeItems.length < MAX_FILES;

    const getPackUrl = () => {
        return `${window.location.origin}/files/pack/${packId}`;
    };

    if (allCompleted && uploadedFiles.length > 0) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="box-primary shadow-2xl w-full max-w-md">
                    <div className="space-y-6 p-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white">
                                Upload Complete
                            </h1>
                            <p className="text-gray-400 mt-2">
                                {uploadedFiles.length} file(s) uploaded successfully
                            </p>
                        </div>

                        {/* Pack URL Section */}
                        {packId && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {isPasswordProtected ? (
                                        <FaLock className="w-4 h-4 text-yellow-400" />
                                    ) : (
                                        <FaLink className="w-4 h-4 text-blue-400" />
                                    )}
                                    <p className="text-sm text-gray-300">Pack URL {isPasswordProtected && "(Password Protected)"}</p>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-black/50 rounded">
                                    <input
                                        type="text"
                                        value={getPackUrl()}
                                        readOnly
                                        className="flex-1 bg-transparent text-white text-xs truncate focus:outline-none"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(getPackUrl())}
                                        className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                    >
                                        <FaCopy className="w-3 h-3 text-blue-400" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="space-y-2 box-primary p-3 rounded-lg text-xs">
                                    <div>
                                        <p className="text-gray-400 mb-1">File Name</p>
                                        <p className="text-white font-semibold truncate">
                                            {file.fileName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1">File URL</p>
                                        <div className="flex items-center gap-2 p-2 bg-black/50 rounded">
                                            <input
                                                type="text"
                                                value={file.fileUrl}
                                                readOnly
                                                className="flex-1 bg-transparent text-white text-xs truncate focus:outline-none"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(file.fileUrl)}
                                                className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                            >
                                                <FaCopy className="w-3 h-3 text-blue-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setUploadItems([]);
                                setUploadedFiles([]);
                                setFileName("");
                                setRegistrationError(null);
                                setPackId(null);
                                setIsPasswordProtected(false);
                                setPackPassword("");
                            }}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded transition"
                        >
                            Upload More
                        </button>
                    </div>
                </div>

                {/* Registration Error Modal */}
                {registrationError && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div
                            ref={errorModalRef}
                            className="box-primary shadow-2xl w-full max-w-sm rounded-lg"
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="w-6 h-6 text-yellow-400" />
                                    <h2 className="text-xl font-bold text-white">Registration Failed</h2>
                                </div>

                                {registrationError && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
                                        <p className="text-yellow-400 text-sm leading-relaxed">
                                            {registrationError}
                                        </p>
                                    </div>
                                )}

                                <div className="bg-orange-500/10 border border-orange-500/30 rounded p-4">
                                    <p className="text-orange-400 text-xs leading-relaxed">
                                        Your files have been uploaded to storage, but the tracking database registration failed.
                                        Your files will likely be automatically deleted in a few days due to the lack of tracking record.
                                        Please save your URLs and contact xap3y on discord
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setRegistrationError(null)}
                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="box-primary shadow-2xl w-full max-w-md">
                    <div className="space-y-4 p-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
                            File Uploader
                        </h1>

                        {!user && (
                            <div className="flex items-center transition-all duration-300 ease-in-out">
                                <MainStringInput
                                    placeholder="API Key"
                                    value={apiKey}
                                    disabled={!!user || uploading || isKeyValidating || activeItems.length > 0}
                                    onChange={(value) => {
                                        setApiKey(value.toLowerCase());
                                        setIsKeyValid(null);
                                    }}
                                    onFocus={() => {
                                        setTimeout(() => setIsFocused(true), 100);
                                    }}
                                    className={`lg:text-base text-xs w-full p-0 ${isFocused ? "text-dots" : ""} ${
                                        !!user || isKeyValid
                                            ? "border-lime-500 bg-lime-500 bg-opacity-10 text-dots"
                                            : ""
                                    } ${isKeyValid === false ? "border-red-400 bg-red-400 bg-opacity-5" : ""} ${
                                        uploading ? "disabled" : ""
                                    } ${activeItems.length > 0 ? "cursor-not-allowed opacity-60" : ""} ${
                                        !!user ? "cursor-not-allowed" : ""
                                    }`}
                                />

                                {isKeyValidating && <LoadingDot size={"w-10"} />}

                                {isKeyValid == true && !isKeyValidating && (
                                    <FaCheck className={"ml-2 w-6 h-6 text-lime-400"} />
                                )}
                            </div>
                        )}

                        {activeItems.length === 0 ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed p-8 text-center rounded-lg transition cursor-pointer ${
                                    isDragActive && isKeyValid
                                        ? "border-green-500 bg-green-500 bg-opacity-10"
                                        : "border-gray-600 hover:border-gray-500"
                                } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <input disabled={uploading || !isKeyValid} {...getInputProps()} />
                                <div className="flex flex-col items-center gap-3">
                                    <div>
                                        <p className="text-white font-semibold">
                                            Drag and drop files here
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            or click to select
                                        </p>
                                        <p className="text-gray-500 text-xs mt-2">
                                            Press Ctrl+V to paste files (max {MAX_FILES})
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`space-y-2 ${isMultiple ? "max-h-[500px] overflow-y-auto" : ""}`}
                            >
                                {uploadItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`${
                                            isMultiple
                                                ? "p-2 box-primary text-xs"
                                                : "p-4 border-2 border-green-700 bg-green-700 bg-opacity-10 rounded-lg"
                                        } ${item.status === "cancelled" ? "opacity-50" : ""}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div
                                                className={`min-w-0 flex-1 ${
                                                    isMultiple
                                                        ? "flex items-center justify-between gap-1"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`font-semibold truncate ${
                                                            isMultiple ? "text-gray-300" : "text-white"
                                                        } ${item.status === "cancelled" ? "line-through text-red-400" : ""}`}
                                                    >
                                                        {item.realFileName}
                                                    </p>
                                                    <p className={`text-gray-500 text-xs ${item.status === "cancelled" ? "line-through text-red-400" : ""}`}>
                                                        {!isMultiple ? formatFileSize(item.file.size) : "(" + formatFileSize(item.file.size) + ")"}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.status === "cancelled" && (
                                                <div className="flex gap-1">
                                                    {/* No buttons for cancelled items */}
                                                </div>
                                            )}

                                            {!uploading && item.status === "pending" && (
                                                <div className="flex gap-1">
                                                    {isMultiple && (
                                                        <button
                                                            onClick={() => handleEditFile(item.id, item.realFileName)}
                                                            className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                                        >
                                                            <FaPen className="w-3 h-3 text-blue-400" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveFile(item.id)}
                                                        className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition"
                                                    >
                                                        <MdOutlineDelete className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            )}

                                            {uploading && item.status === "uploading" && (
                                                <button
                                                    onClick={() => handleCancelItemUpload(item.id)}
                                                    className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition"
                                                >
                                                    <FaTimes className="w-4 h-4 text-red-500" />
                                                </button>
                                            )}

                                            {uploading && item.status === "pending" && (
                                                <button
                                                    onClick={() => handleCancelQueuedItem(item.id)}
                                                    className="p-1 hover:bg-orange-500 hover:bg-opacity-20 rounded transition"
                                                >
                                                    <FaTimes className="w-4 h-4 text-orange-400" />
                                                </button>
                                            )}

                                            {item.status === "completed" && item.uploadedUrl && (
                                                <button
                                                    onClick={() => copyToClipboard(item.uploadedUrl!)}
                                                    className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded transition"
                                                >
                                                    <FaCopy className="w-4 h-4 text-blue-400" />
                                                </button>
                                            )}
                                        </div>

                                        {(item.status === "uploading" || item.status === "completed") && (
                                            <div className={`mt-2 ${isMultiple ? "space-y-1" : "space-y-2"}`}>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400">
                                                        {item.progress}%
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {item.speed} KB/s
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {item.status === "error" && (
                                            <p className="text-red-400 text-xs mt-1">{item.error}</p>
                                        )}
                                    </div>
                                ))}

                                {canAddMore && !uploading && (
                                    <div
                                        {...getAddMoreRootProps()}
                                        className={`border-2 border-dashed p-3 rounded-lg transition cursor-pointer ${
                                            isAddMoreDragActive
                                                ? "border-blue-500 bg-blue-500 bg-opacity-10"
                                                : "border-gray-600 hover:border-gray-500"
                                        }`}
                                    >
                                        <input {...getAddMoreInputProps()} />
                                        <button
                                            onClick={handleAddMore}
                                            className="w-full text-gray-400 hover:text-gray-300 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                            <FaPlus size={14} />
                                            Add More Files ({activeItems.length}/{MAX_FILES})
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeItems.length > 0 && (
                            <>
                                {!isMultiple && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm text-gray-300">
                                                File Name (optional)
                                            </label>
                                            <MainStringInput
                                                value={fileName}
                                                onChange={(e) => setFileName(e)}
                                                placeholder="Enter file name..."
                                                disabled={uploading}
                                                className="xl:text-base text-xs w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Password Protection Toggle */}
                                <div className="flex flex-col gap-3 border-t border-gray-700 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isPasswordProtected ? (
                                                <FaLock className="w-4 h-4 text-yellow-400" />
                                            ) : (
                                                <FaLockOpen className="w-4 h-4 text-gray-400" />
                                            )}
                                            <label className="text-sm text-gray-300">
                                                Password Protected
                                            </label>
                                        </div>

                                        {/* Toggle Switch */}
                                        <button
                                            onClick={() => {
                                                setIsPasswordProtected(!isPasswordProtected);
                                                if (isPasswordProtected) {
                                                    setPackPassword("");
                                                }
                                            }}
                                            disabled={uploading}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                isPasswordProtected
                                                    ? "bg-blue-600"
                                                    : "bg-gray-700"
                                            } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    isPasswordProtected
                                                        ? "translate-x-6"
                                                        : "translate-x-1"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Password Input - Animated */}
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                            isPasswordProtected
                                                ? "max-h-20 opacity-100"
                                                : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        <MainStringInput
                                            type="text"
                                            id={"image"}
                                            autoComplete={"off"}
                                            value={packPassword}
                                            onChange={(e) => setPackPassword(e)}
                                            placeholder="Enter pack password..."
                                            disabled={uploading}
                                            onFocus={() => {
                                                setTimeout(() => setIsPassFocused(true), 100);
                                            }}
                                            className={`xl:text-base text-xs w-full ${isFocused ? "text-dots" : ""}`}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <LoadingDot size="w-4" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck size={16} />
                                            Upload {activeItems.length > 1 ? `${activeItems.length} Files` : "File"}
                                        </>
                                    )}
                                </button>

                                {!uploading && (
                                    <button
                                        onClick={() => {
                                            setUploadItems([]);
                                            setFileName("");
                                        }}
                                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded transition text-sm"
                                    >
                                        Clear
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div
                        ref={modalRef}
                        className="box-primary shadow-2xl w-full max-w-sm rounded-lg"
                    >
                        <div className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-white">Rename File</h2>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-300">New File Name</label>
                                <MainStringInput
                                    value={editingName}
                                    onChange={(e) => setEditingName(e)}
                                    placeholder="Enter new file name..."
                                    className="xl:text-base text-xs w-full"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setEditingName("");
                                    }}
                                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
            />
        </>
    );
}