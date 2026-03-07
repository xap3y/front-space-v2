"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

type MediaInputProps = {
    accept: Record<string, string[]>;
    maxSize?: number;
    onFile: (file: File) => void;
    file: File | null;
    onClear: () => void;
    label?: string;
    hint?: string;
    disabled?: boolean;
    onImageDimensions?: (width: number, height: number) => void;
};

export default function MediaInput({
                                       accept,
                                       maxSize = 100 * 1024 * 1024, // 100MB default
                                       onFile,
                                       file,
                                       onClear,
                                       label = "Drop your file here",
                                       hint = "or click to browse • paste with Ctrl+V",
                                       disabled = false,
                                       onImageDimensions,
                                   }: MediaInputProps) {

    const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!file || !file.type.startsWith("image/")) {
            setDimensions(null);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
            onImageDimensions?.(img.naturalWidth, img.naturalHeight);
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            setDimensions(null);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }, [file, onImageDimensions]);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: any[]) => {
            setError(null);
            if (rejectedFiles.length > 0) {
                const err = rejectedFiles[0]?.errors?.[0]?.message || "File not accepted";
                setError(err);
                return;
            }
            if (acceptedFiles.length > 0) {
                onFile(acceptedFiles[0]);
            }
        },
        [onFile]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
        disabled,
    });

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (disabled) return;
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.kind === "file") {
                    const pastedFile = item.getAsFile();
                    if (pastedFile) {
                        setError(null);
                        onFile(pastedFile);
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [onFile, disabled]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getPreview = () => {
        if (!file) return null;
        const url = URL.createObjectURL(file);
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (isImage) {
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={url}
                    alt="Preview"
                    className="max-h-[120px] rounded-lg object-contain"
                    onLoad={() => URL.revokeObjectURL(url)}
                />
            );
        }
        if (isVideo) {
            return (
                <video
                    src={url}
                    className="max-h-[120px] rounded-lg"
                    muted
                    onLoadedData={() => URL.revokeObjectURL(url)}
                />
            );
        }
        return null;
    };

    return (
        <div ref={containerRef} className="w-full">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                                disabled
                                    ? "cursor-not-allowed opacity-50 border-neutral-800"
                                    : "cursor-pointer"
                            } ${
                                isDragActive
                                    ? "border-emerald-500 bg-emerald-500/5"
                                    : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900/30"
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                        isDragActive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-neutral-800 text-neutral-500"
                                    }`}
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-semibold ${
                                            isDragActive ? "text-emerald-400" : "text-neutral-300"
                                        }`}
                                    >
                                        {isDragActive ? "Drop it here" : label}
                                    </p>
                                    <p className="text-[11px] text-neutral-600 mt-1">{hint}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="border border-neutral-800 rounded-2xl p-4 bg-neutral-950/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">{getPreview()}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {file.name}
                                </p>
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                    {file.type || "Unknown type"} • {formatSize(file.size)}
                                    {dimensions && (
                                        <span className="ml-1">
                                            • <span className="text-neutral-400 font-mono">{dimensions.w}×{dimensions.h}</span>
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClear();
                                }}
                                disabled={disabled}
                                className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition disabled:opacity-50"
                            >
                                ✕
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-red-400 mt-2"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}