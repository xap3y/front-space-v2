"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToolResultProps = {
    processing: boolean;
    progress?: number; // 0-100
    resultUrl: string | null;
    resultFilename: string;
    error: string | null;
    onDownload?: () => void;
};

export default function ToolResult({
                                       processing,
                                       progress,
                                       resultUrl,
                                       resultFilename,
                                       error,
                                       onDownload,
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
                        className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 text-sm">✓</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-emerald-400">Done!</p>
                                    <p className="text-[10px] text-neutral-500 truncate">{resultFilename}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-4 py-2 rounded-lg transition active:scale-[0.97]"
                            >
                                Download
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}