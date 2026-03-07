"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MediaInput from "@/components/tools/MediaInput";
import ToolResult from "@/components/tools/ToolResult";
import ToolCard from "@/components/tools/ToolCard";
import { NumberInput, SelectInput, TextInput, CheckboxInput } from "@/components/tools/ToolInputs";
import { processMedia } from "@/lib/tools-api";
import HoverDiv from "@/components/HoverDiv";

const IMAGE_ACCEPT = {
    "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff", ".avif", ".svg"],
};

const IMAGE_MAX_SIZE = 20 * 1024 * 1024; // 20MB

type Tool =
    | "resize"
    | "compress"
    | "convert"
    | "crop"
    | "rotate"
    | "flip"
    | "blur"
    | "sharpen"
    | "grayscale"
    | "brightness"
    | "watermark"
    | "strip-metadata";

const TOOLS: { key: Tool; label: string; icon: string; description: string }[] = [
    { key: "resize", label: "Resize", icon: "↔", description: "Scale to exact dimensions or percentage" },
    { key: "compress", label: "Compress", icon: "📦", description: "Reduce file size with quality control" },
    { key: "convert", label: "Convert", icon: "🔄", description: "Change format (PNG, JPG, WebP, AVIF...)" },
    { key: "crop", label: "Crop", icon: "✂️", description: "Crop to specific region or aspect ratio" },
    { key: "rotate", label: "Rotate", icon: "🔁", description: "Rotate by any angle" },
    { key: "flip", label: "Flip", icon: "🪞", description: "Mirror horizontally or vertically" },
    { key: "blur", label: "Blur", icon: "💨", description: "Apply gaussian blur effect" },
    { key: "sharpen", label: "Sharpen", icon: "🔍", description: "Enhance edges and details" },
    { key: "grayscale", label: "Grayscale", icon: "⬛", description: "Convert to black & white" },
    { key: "brightness", label: "Brightness & Contrast", icon: "☀️", description: "Adjust brightness, contrast, saturation" },
    { key: "watermark", label: "Watermark", icon: "💧", description: "Add text overlay to image" },
    { key: "strip-metadata", label: "Strip Metadata", icon: "🧹", description: "Remove EXIF data and metadata" },
];

export default function ImageToolsClient() {
    const [file, setFile] = useState<File | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>("resize");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFilename, setResultFilename] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Tool options
    const [resizeWidth, setResizeWidth] = useState(1920);
    const [resizeHeight, setResizeHeight] = useState(1080);
    const [resizeMode, setResizeMode] = useState("fit");
    const [maintainAspect, setMaintainAspect] = useState(true);

    const [compressQuality, setCompressQuality] = useState(80);

    const [convertFormat, setConvertFormat] = useState("webp");

    const [cropX, setCropX] = useState(0);
    const [cropY, setCropY] = useState(0);
    const [cropW, setCropW] = useState(800);
    const [cropH, setCropH] = useState(600);

    const [rotateAngle, setRotateAngle] = useState(90);

    const [flipDirection, setFlipDirection] = useState("horizontal");

    const [blurRadius, setBlurRadius] = useState(5);

    const [sharpenAmount, setSharpenAmount] = useState(2);

    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);

    const [watermarkText, setWatermarkText] = useState("Sample");
    const [watermarkPosition, setWatermarkPosition] = useState("bottomright");
    const [watermarkOpacity, setWatermarkOpacity] = useState(50);
    const [watermarkSize, setWatermarkSize] = useState(24);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    const clearResult = () => {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
        setResultFilename("");
        setError(null);
        setProgress(0);
    };

    const handleFile = useCallback((f: File) => {
        clearResult();
        setFile(f);
    }, []);

    const handleClear = () => {
        clearResult();
        setFile(null);
    };

    const handleImageDimensions = useCallback((w: number, h: number) => {
        setResizeWidth(w);
        setResizeHeight(h);
        setCropW(w);
        setCropH(h);
        setAspectRatio(w / h);
    }, []);

    const handleResizeWidth = (w: number) => {
        setResizeWidth(w);
        if (maintainAspect && aspectRatio) {
            setResizeHeight(Math.round(w / aspectRatio));
        }
    };

    const handleResizeHeight = (h: number) => {
        setResizeHeight(h);
        if (maintainAspect && aspectRatio) {
            setResizeWidth(Math.round(h * aspectRatio));
        }
    };

    const getToolOptions = (): Record<string, string | number | boolean> => {
        switch (activeTool) {
            case "resize":
                return { width: resizeWidth, height: resizeHeight, mode: resizeMode, maintainAspect };
            case "compress":
                return { quality: compressQuality };
            case "convert":
                return { format: convertFormat };
            case "crop":
                return { x: cropX, y: cropY, w: cropW, h: cropH };
            case "rotate":
                return { angle: rotateAngle };
            case "flip":
                return { direction: flipDirection };
            case "blur":
                return { radius: blurRadius };
            case "sharpen":
                return { amount: sharpenAmount };
            case "grayscale":
                return {};
            case "brightness":
                return { brightness, contrast, saturation };
            case "watermark":
                return { text: watermarkText, position: watermarkPosition, opacity: watermarkOpacity, size: watermarkSize };
            case "strip-metadata":
                return {};
            default:
                return {};
        }
    };

    const handleToggleAspect = (checked: boolean) => {
        setMaintainAspect(checked);
        if (checked && resizeWidth > 0 && resizeHeight > 0) {
            setAspectRatio(resizeWidth / resizeHeight);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        clearResult();
        setProcessing(true);
        setProgress(0);

        try {
            const options = getToolOptions();

            const result = await processMedia(
                `image/${activeTool}`,
                file,
                options,
                (pct) => setProgress(pct)
            );

            setResultUrl(result.url);
            setResultFilename(result.filename);
        } catch (err: any) {
            setError(err.message || "Processing failed. Check the file and try again.");
        } finally {
            setProcessing(false);
        }
    };

    const renderToolOptions = () => {
        const disabled = processing;

        switch (activeTool) {
            case "resize":
                return (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-neutral-500 uppercase font-semibold mb-1 block">
                                    Width <span className="text-neutral-600">px</span>
                                </label>
                                <input
                                    type="number"
                                    value={resizeWidth}
                                    onChange={(e) => handleResizeWidth(Math.max(1, Number(e.target.value)))}
                                    min={1}
                                    max={7680}
                                    disabled={disabled}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-neutral-500 uppercase font-semibold mb-1 block">
                                    Height <span className="text-neutral-600">px</span>
                                </label>
                                <input
                                    type="number"
                                    value={resizeHeight}
                                    onChange={(e) => handleResizeHeight(Math.max(1, Number(e.target.value)))}
                                    min={1}
                                    max={4320}
                                    disabled={disabled}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Quick presets */}
                        <div>
                            <label className="text-[10px] text-neutral-500 uppercase font-semibold mb-1.5 block">
                                Presets
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { label: "4K", w: 3840, h: 2160 },
                                    { label: "1080p", w: 1920, h: 1080 },
                                    { label: "720p", w: 1280, h: 720 },
                                    { label: "480p", w: 854, h: 480 },
                                    { label: "50%", w: Math.round(resizeWidth / 2), h: Math.round(resizeHeight / 2) },
                                    { label: "25%", w: Math.round(resizeWidth / 4), h: Math.round(resizeHeight / 4) },
                                ].map((p) => (
                                    <button
                                        key={p.label}
                                        onClick={() => {
                                            setResizeWidth(p.w);
                                            setResizeHeight(p.h);
                                            if (maintainAspect) setAspectRatio(p.w / p.h);
                                        }}
                                        disabled={disabled}
                                        className="rounded-lg bg-neutral-800 border border-neutral-700 px-2.5 py-1.5 text-[10px] font-bold text-neutral-400 hover:bg-neutral-700 transition disabled:opacity-40"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <SelectInput
                            label="Mode"
                            value={resizeMode}
                            onChange={setResizeMode}
                            options={[
                                { label: "Fit (keep aspect, pad)", value: "fit" },
                                { label: "Fill (stretch)", value: "fill" },
                                { label: "Cover (crop to fit)", value: "cover" },
                            ]}
                            disabled={disabled}
                        />
                        <CheckboxInput
                            label="Lock aspect ratio"
                            checked={maintainAspect}
                            onChange={handleToggleAspect}
                            disabled={disabled}
                        />
                    </>
                );
            case "compress":
                return (
                    <NumberInput label="Quality" value={compressQuality} onChange={setCompressQuality} min={1} max={100} suffix="%" disabled={disabled} />
                );
            case "convert":
                return (
                    <SelectInput
                        label="Output Format"
                        value={convertFormat}
                        onChange={setConvertFormat}
                        options={[
                            { label: "WebP", value: "webp" },
                            { label: "PNG", value: "png" },
                            { label: "JPEG", value: "jpg" },
                            { label: "AVIF", value: "avif" },
                            { label: "BMP", value: "bmp" },
                            { label: "TIFF", value: "tiff" },
                            { label: "GIF", value: "gif" },
                        ]}
                        disabled={disabled}
                    />
                );
            case "crop":
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "X Offset", value: cropX, onChange: setCropX },
                            { label: "Y Offset", value: cropY, onChange: setCropY },
                            { label: "Width", value: cropW, onChange: setCropW },
                            { label: "Height", value: cropH, onChange: setCropH },
                        ].map((item) => (
                            <div key={item.label}>
                                <label className="text-[10px] text-neutral-500 uppercase font-semibold mb-1 block">
                                    {item.label} <span className="text-neutral-600">px</span>
                                </label>
                                <input
                                    type="number"
                                    value={item.value}
                                    onChange={(e) => item.onChange(Math.max(0, Number(e.target.value)))}
                                    min={0}
                                    max={9999}
                                    disabled={disabled}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50"
                                />
                            </div>
                        ))}
                    </div>
                );
            case "rotate":
                return (
                    <NumberInput label="Angle" value={rotateAngle} onChange={setRotateAngle} min={0} max={360} suffix="°" disabled={disabled} />
                );
            case "flip":
                return (
                    <SelectInput
                        label="Direction"
                        value={flipDirection}
                        onChange={setFlipDirection}
                        options={[
                            { label: "Horizontal (mirror)", value: "horizontal" },
                            { label: "Vertical (upside down)", value: "vertical" },
                            { label: "Both", value: "both" },
                        ]}
                        disabled={disabled}
                    />
                );
            case "blur":
                return (
                    <NumberInput label="Blur Radius" value={blurRadius} onChange={setBlurRadius} min={1} max={50} disabled={disabled} />
                );
            case "sharpen":
                return (
                    <NumberInput label="Sharpen Amount" value={sharpenAmount} onChange={setSharpenAmount} min={1} max={10} disabled={disabled} />
                );
            case "grayscale":
                return (
                    <p className="text-[11px] text-neutral-500">No options — converts to grayscale.</p>
                );
            case "brightness":
                return (
                    <>
                        <NumberInput label="Brightness" value={brightness} onChange={setBrightness} min={-100} max={100} disabled={disabled} />
                        <NumberInput label="Contrast" value={contrast} onChange={setContrast} min={-100} max={100} disabled={disabled} />
                        <NumberInput label="Saturation" value={saturation} onChange={setSaturation} min={-100} max={100} disabled={disabled} />
                    </>
                );
            case "watermark":
                return (
                    <>
                        <TextInput label="Text" value={watermarkText} onChange={setWatermarkText} placeholder="Watermark text" disabled={disabled} />
                        <SelectInput
                            label="Position"
                            value={watermarkPosition}
                            onChange={setWatermarkPosition}
                            options={[
                                { label: "Bottom Right", value: "bottomright" },
                                { label: "Bottom Left", value: "bottomleft" },
                                { label: "Top Right", value: "topright" },
                                { label: "Top Left", value: "topleft" },
                                { label: "Center", value: "center" },
                            ]}
                            disabled={disabled}
                        />
                        <NumberInput label="Opacity" value={watermarkOpacity} onChange={setWatermarkOpacity} min={1} max={100} suffix="%" disabled={disabled} />
                        <NumberInput label="Font Size" value={watermarkSize} onChange={setWatermarkSize} min={8} max={200} suffix="px" disabled={disabled} />
                    </>
                );
            case "strip-metadata":
                return (
                    <p className="text-[11px] text-neutral-500">No options — strips all EXIF/metadata from the image.</p>
                );
            default:
                return null;
        }
    };

    return (
        <div className="text-neutral-200 font-sans xl:pb-0 pb-24">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Image Tools</h1>
                <p className="text-neutral-500 text-xs sm:text-sm mt-1">
                    Resize, compress, convert, and edit images with ffmpeg
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
                {/* Left — tool selector + input */}
                <div className="space-y-4">
                    {/* Media Input */}
                    <MediaInput
                        accept={IMAGE_ACCEPT}
                        maxSize={IMAGE_MAX_SIZE}
                        onFile={handleFile}
                        file={file}
                        onClear={handleClear}
                        label="Drop your image here"
                        hint="or click to browse • paste with Ctrl+V • PNG, JPG, WebP, GIF..."
                        disabled={processing}
                        onImageDimensions={handleImageDimensions}
                    />

                    {/* Tool Grid */}
                    <div>
                        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                            Select Tool
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {TOOLS.map((tool) => (
                                <HoverDiv
                                    key={tool.key}
                                    onClick={() => {
                                        setActiveTool(tool.key);
                                        clearResult();
                                    }}
                                    disabled={processing}
                                    className={`text-left p-3 transition-all active:scale-[0.99] disabled:opacity-50 ${
                                        activeTool === tool.key
                                            ? "border-emerald-500 bg-emerald-500/5"
                                            : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700"
                                    }`}

                                    inputClassName={ activeTool === tool.key ? "!border-yellow-500/50" : "" }
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

                    {/* Result */}
                    <ToolResult
                        processing={processing}
                        progress={progress}
                        resultUrl={resultUrl}
                        resultFilename={resultFilename}
                        error={error}
                    />
                </div>

                {/* Right — tool options */}
                <div className="space-y-4">
                    <ToolCard
                        title={TOOLS.find((t) => t.key === activeTool)?.label || ""}
                        description={TOOLS.find((t) => t.key === activeTool)?.description || ""}
                    >
                        {renderToolOptions()}

                        <button
                            onClick={handleProcess}
                            disabled={!file || processing}
                            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all transform active:scale-[0.98] select-none ${
                                !file || processing
                                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20"
                            }`}
                        >
                            {processing ? "Processing..." : "Process Image"}
                        </button>
                    </ToolCard>
                </div>
            </div>
        </div>
    );
}