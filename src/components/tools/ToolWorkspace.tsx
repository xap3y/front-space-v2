"use client";

import React, {ReactNode, useEffect, useState} from "react";
import MediaInput from "@/components/tools/MediaInput";
import ToolResult from "@/components/tools/ToolResult";
import ToolCard from "@/components/tools/ToolCard";
import HoverDiv from "@/components/HoverDiv";
import {useUser} from "@/hooks/useUser";
import {errorToast, okToast, uploadImageBucket} from "@/lib/client";

type ToolDescriptor<T extends string> = {
    key: T;
    label: string;
    icon: ReactNode;
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
    editorContent?: ReactNode;
    processLabel: string;
    onProcess: () => void;
    onImageDimensions?: (width: number, height: number) => void;
    onDismissResult: () => void;
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
    editorContent,
    processLabel,
    onProcess,
    onImageDimensions,
    onDismissResult,
}: ToolWorkspaceProps<T>) {
    const activeToolData = tools.find((tool) => tool.key === activeTool);
    const {user} = useUser();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    useEffect(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadedUrl(null);
    }, [resultUrl]);

    const uploadResult = async () => {
        if (!resultUrl || !user?.apiKey || !resultFilename || uploading) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const response = await fetch(resultUrl);
            const blob = await response.blob();
            const outputFile = new File([blob], resultFilename, {type: blob.type || "application/octet-stream"});
            const formData = new FormData();
            formData.append("file", outputFile);
            formData.append("apiKey", user.apiKey);
            formData.append("source", "PORTAL");
            const uploaded = await uploadImageBucket(formData, user.apiKey, null, setUploadProgress);
            setUploadedUrl(uploaded.urlSet.portalUrl);
            okToast("Result uploaded to your Space account", 1800);
        } catch (error) {
            errorToast(error instanceof Error ? error.message : "Failed to upload processed result", 2500);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="pb-16 font-sans text-neutral-200 xl:pb-0">
            <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                <p className="text-neutral-500 text-xs sm:text-sm mt-1">{subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-3">
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

                    {editorContent}

                    <ToolResult
                        processing={processing}
                        progress={progress}
                        resultUrl={resultUrl}
                        resultFilename={resultFilename}
                        error={error}
                        onClose={onDismissResult}
                        onUpload={uploadResult}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        uploadedUrl={uploadedUrl}
                    />

                    <div>
                        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Select Tool
                        </h2>
                        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                            {tools.map((tool) => (
                                <HoverDiv
                                    key={tool.key}
                                    onClick={() => onToolSelect(tool.key)}
                                    disabled={processing}
                                    title={tool.description}
                                    className={`min-h-16 p-2 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                                        activeTool === tool.key
                                            ? "border-emerald-500 bg-emerald-500/5"
                                            : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700"
                                    }`}
                                    inputClassName={activeTool === tool.key ? "!border-yellow-500/50" : ""}
                                >
                                    <div className="mb-1 text-sm text-emerald-300">{tool.icon}</div>
                                    <div className="truncate whitespace-nowrap text-[10px] font-bold text-white">{tool.label}</div>
                                </HoverDiv>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="space-y-3 xl:sticky xl:top-0 xl:self-start">
                    <ToolCard
                        title={activeToolData?.label || ""}
                        description={activeToolData?.description || ""}
                    >
                        {optionsContent}

                        <HoverDiv
                            onClick={onProcess}
                            disabled={!file || processing}
                            className={`w-full select-none rounded-lg py-3 text-sm font-bold tracking-wide !shadow-none active:!scale-100 ${
                                !file || processing
                                    ? "cursor-not-allowed !border-zinc-800 !bg-zinc-900 !text-zinc-600"
                                    : "!border-zinc-800 !bg-primary1 !text-zinc-100 hover:!border-zinc-700 active:!bg-emerald-600 active:!text-white"
                            }`}
                        >
                            {processing ? "Processing..." : processLabel}
                        </HoverDiv>
                    </ToolCard>
                </div>
            </div>
        </div>
    );
}
