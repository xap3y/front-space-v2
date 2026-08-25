"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import HoverDiv from "@/components/HoverDiv";
import {FaArrowUpFromBracket, FaDownload, FaXmark} from "react-icons/fa6";

type ToolResultProps = {
    processing: boolean;
    progress?: number; // 0-100
    resultUrl: string | null;
    resultFilename: string;
    error: string | null;
    onDownload?: () => void;
    onClose?: () => void;
    onUpload?: () => void;
    uploading?: boolean;
    uploadProgress?: number;
    uploadedUrl?: string | null;
};

export default function ToolResult({
                                       processing,
                                       progress,
                                       resultUrl,
                                       resultFilename,
                                       error,
                                       onDownload,
                                       onClose,
                                       onUpload,
                                       uploading = false,
                                       uploadProgress = 0,
                                       uploadedUrl,
                                   }: ToolResultProps) {
    const handleDownload = () => {
        if (onDownload) {
            onDownload();
            return;
        }
        if (!resultUrl) return;
        const a = document.createElement("a");
        a.href = resultUrl;
        a.download = resultFilename;
        a.click();
    };

    const lowerName = resultFilename.toLowerCase();
    const isImage = /\.(png|jpe?g|webp|gif|avif|bmp|tiff?)$/.test(lowerName);
    const isVideo = /\.(mp4|webm|mkv|mov|avi|m4v|ts)$/.test(lowerName);
    const isAudio = /\.(mp3|wav|aac|ogg|flac|m4a)$/.test(lowerName);

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {processing && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-neutral-950/50 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-400 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-neutral-300">Processing...</p>
                                {progress !== undefined && (
                                    <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-emerald-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                )}
                            </div>
                            {progress !== undefined && (
                                <span className="text-xs font-mono text-neutral-500">{Math.round(progress)}%</span>
                            )}
                        </div>
                    </motion.div>
                )}

                {!processing && error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                    >
                        <p className="text-xs text-red-400">{error}</p>
                    </motion.div>
                )}

                {!processing && resultUrl && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="box-primary overflow-hidden rounded-2xl border-emerald-500/25 p-4"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 text-sm">✓</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-emerald-400">Your result is ready</p>
                                    <p className="text-[10px] text-neutral-500 truncate">{resultFilename}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {onUpload && (isImage || isVideo) && (
                                    <HoverDiv
                                        type="SAVE"
                                        icon={<FaArrowUpFromBracket className="h-4 w-4"/>}
                                        onClick={() => uploadedUrl ? window.open(uploadedUrl, "_blank", "noopener,noreferrer") : onUpload()}
                                        disabled={uploading}
                                        className="flex-shrink-0 px-3 py-2 text-xs font-bold"
                                    >
                                        {uploading ? `Uploading ${Math.round(uploadProgress)}%` : uploadedUrl ? "View upload" : "Upload to Space"}
                                    </HoverDiv>
                                )}
                                <HoverDiv
                                    type="SAVE"
                                    icon={<FaDownload className="h-4 w-4"/>}
                                    onClick={handleDownload}
                                    className="flex-shrink-0 px-3 py-2 text-xs font-bold"
                                >
                                    Download
                                </HoverDiv>
                                {onClose && <HoverDiv icon={<FaXmark className="h-4 w-4"/>} onClick={onClose} className="flex-shrink-0 p-2" aria-label="Close result" title="Close result"/>}
                            </div>
                        </div>
                        {(isImage || isVideo || isAudio) && (
                            <div className="mt-3 flex min-h-28 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black/50 p-2">
                                {isImage && <img src={resultUrl} alt="Processed result" className="max-h-[38vh] max-w-full rounded-lg object-contain"/>}
                                {isVideo && <video src={resultUrl} controls playsInline className="max-h-[38vh] w-full rounded-lg bg-black object-contain"/>}
                                {isAudio && <audio src={resultUrl} controls className="w-full"/>}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
