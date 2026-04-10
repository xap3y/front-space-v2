"use client";

import React, {ReactNode} from "react";
import MediaInput from "@/components/tools/MediaInput";
import ToolResult from "@/components/tools/ToolResult";
import ToolCard from "@/components/tools/ToolCard";
import HoverDiv from "@/components/HoverDiv";

type ToolDescriptor<T extends string> = {
    key: T;
    label: string;
    icon: string;
    description: string;
};

type ToolWorkspaceProps<T extends string> = {
    title: string;
    subtitle: string;
    accept: Record<string, string[]>;
    maxSize?: number;
    mediaLabel: string;
    mediaHint: string;
    file: File | null;
    onFile: (file: File) => void;
    onClear: () => void;
    processing: boolean;
    tools: ToolDescriptor<T>[];
    activeTool: T;
    onToolSelect: (tool: T) => void;
    progress: number;
    resultUrl: string | null;
    resultFilename: string;
    error: string | null;
    optionsContent: ReactNode;
    processLabel: string;
    onProcess: () => void;
    onImageDimensions?: (width: number, height: number) => void;
};

export default function ToolWorkspace<T extends string>({
    title,
    subtitle,
    accept,
    maxSize,
    mediaLabel,
    mediaHint,
    file,
    onFile,
    onClear,
    processing,
    tools,
    activeTool,
    onToolSelect,
    progress,
    resultUrl,
    resultFilename,
    error,
    optionsContent,
    processLabel,
    onProcess,
    onImageDimensions,
}: ToolWorkspaceProps<T>) {
    const activeToolData = tools.find((tool) => tool.key === activeTool);

    return (
        <div className="text-neutral-200 font-sans xl:pb-0 pb-24">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
                <p className="text-neutral-500 text-xs sm:text-sm mt-1">{subtitle}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
                <div className="space-y-4">
                    <MediaInput
                        accept={accept}
                        maxSize={maxSize}
                        onFile={onFile}
                        file={file}
                        onClear={onClear}
                        label={mediaLabel}
                        hint={mediaHint}
                        disabled={processing}
                        onImageDimensions={onImageDimensions}
                    />

                    <div>
                        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                            Select Tool
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {tools.map((tool) => (
                                <HoverDiv
                                    key={tool.key}
                                    onClick={() => onToolSelect(tool.key)}
                                    disabled={processing}
                                    className={`text-left p-3 transition-all active:scale-[0.98] disabled:opacity-50 ${
                                        activeTool === tool.key
                                            ? "border-emerald-500 bg-emerald-500/5"
                                            : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700"
                                    }`}
                                    inputClassName={activeTool === tool.key ? "!border-yellow-500/50" : ""}
                                >
                                    <div className="text-lg mb-1">{tool.icon}</div>
                                    <div className="text-xs font-bold text-white">{tool.label}</div>
                                    <div className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                                        {tool.description}
                                    </div>
                                </HoverDiv>
                            ))}
                        </div>
                    </div>

                    <ToolResult
                        processing={processing}
                        progress={progress}
                        resultUrl={resultUrl}
                        resultFilename={resultFilename}
                        error={error}
                    />
                </div>

                <div className="space-y-4">
                    <ToolCard
                        title={activeToolData?.label || ""}
                        description={activeToolData?.description || ""}
                    >
                        {optionsContent}

                        <button
                            onClick={onProcess}
                            disabled={!file || processing}
                            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all transform active:scale-[0.98] select-none ${
                                !file || processing
                                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20"
                            }`}
                        >
                            {processing ? "Processing..." : processLabel}
                        </button>
                    </ToolCard>
                </div>
            </div>
        </div>
    );
}
