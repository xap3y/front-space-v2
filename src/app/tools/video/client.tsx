"use client";

import React, { useState, useCallback } from "react";
import { NumberInput, SelectInput, TextInput, CheckboxInput } from "@/components/tools/ToolInputs";
import { processMedia } from "@/lib/tools-api";
import ToolWorkspace from "@/components/tools/ToolWorkspace";
import VideoTimeline from "@/components/tools/VideoTimeline";
import VideoEffectPreview from "@/components/tools/VideoEffectPreview";
import MainStringInput from "@/components/MainStringInput";
import {FaArrowsLeftRight, FaBackward, FaBoxArchive, FaFilm, FaForward, FaGaugeHigh, FaImage, FaMusic, FaRotate, FaScissors, FaVolumeHigh, FaVolumeXmark} from "react-icons/fa6";
import {FaRulerCombined, FaSyncAlt} from "react-icons/fa";

const VIDEO_ACCEPT = {
    "video/*": [".mp4", ".webm", ".mkv", ".avi", ".mov", ".flv", ".wmv", ".m4v", ".ts"],
    "audio/*": [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"],
};

const secondsToTimestamp = (seconds: number) => {
    const value = Math.max(0, Math.floor(seconds));
    return [Math.floor(value / 3600), Math.floor(value % 3600 / 60), value % 60]
        .map(part => String(part).padStart(2, "0")).join(":");
};

const secondsToTimestampMilliseconds = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const whole = Math.floor(safe);
    const milliseconds = Math.round((safe - whole) * 1000);
    return `${secondsToTimestamp(whole)}.${String(milliseconds).padStart(3, "0")}`;
};

const timestampToSeconds = (timestamp: string) => {
    const parts = timestamp.split(":").map(Number);
    if (parts.some(Number.isNaN)) return 0;
    return (parts.at(-3) || 0) * 3600 + (parts.at(-2) || 0) * 60 + (parts.at(-1) || 0);
};

type Tool =
    | "trim"
    | "compress"
    | "convert"
    | "resize"
    | "extract-audio"
    | "volume"
    | "speed"
    | "rotate"
    | "gif"
    | "thumbnail"
    | "mute"
    | "stabilize"
    | "reverse"
    | "fps";

const TOOLS = [
    { key: "trim", label: "Trim / Cut", icon: <FaScissors/>, description: "Cut video between timestamps" },
    { key: "compress", label: "Compress", icon: <FaBoxArchive/>, description: "Reduce file size with quality control" },
    { key: "convert", label: "Convert", icon: <FaSyncAlt/>, description: "Change container format" },
    { key: "resize", label: "Resize", icon: <FaArrowsLeftRight/>, description: "Scale video resolution" },
    { key: "extract-audio", label: "Extract Audio", icon: <FaMusic/>, description: "Rip audio track from video" },
    { key: "volume", label: "Volume", icon: <FaVolumeHigh/>, description: "Boost or reduce audio volume" },
    { key: "speed", label: "Speed", icon: <FaForward/>, description: "Speed up or slow down playback" },
    { key: "rotate", label: "Rotate", icon: <FaRotate/>, description: "Rotate or flip video" },
    { key: "gif", label: "To GIF", icon: <FaFilm/>, description: "Convert video segment to animated GIF" },
    { key: "thumbnail", label: "Thumbnail", icon: <FaImage/>, description: "Extract frame as image" },
    { key: "mute", label: "Mute", icon: <FaVolumeXmark/>, description: "Remove all audio from video" },
    { key: "stabilize", label: "Stabilize", icon: <FaRulerCombined/>, description: "Reduce camera shake" },
    { key: "reverse", label: "Reverse", icon: <FaBackward/>, description: "Play video backwards" },
    { key: "fps", label: "Change FPS", icon: <FaGaugeHigh/>, description: "Convert framerate (24, 30, 60...)" },
] satisfies {key: Tool; label: string; icon: React.ReactNode; description: string}[];

export default function VideoToolsClient() {
    const [file, setFile] = useState<File | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>("trim");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFilename, setResultFilename] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Trim
    const [trimStart, setTrimStart] = useState("00:00:00");
    const [trimEnd, setTrimEnd] = useState("00:00:30");

    // Compress
    const [videoBitrate, setVideoBitrate] = useState(2000);
    const [audioBitrate, setAudioBitrate] = useState(128);
    const [compressCrf, setCompressCrf] = useState(23);

    // Convert
    const [videoFormat, setVideoFormat] = useState("mp4");

    // Resize
    const [videoWidth, setVideoWidth] = useState(1920);
    const [videoHeight, setVideoHeight] = useState(1080);
    const [videoResizeMode, setVideoResizeMode] = useState("fit");

    // Extract audio
    const [audioFormat, setAudioFormat] = useState("mp3");
    const [audioQuality, setAudioQuality] = useState(192);

    // Volume
    const [volumeLevel, setVolumeLevel] = useState(150);

    // Speed
    const [speedFactor, setSpeedFactor] = useState(2);
    const [speedAudio, setSpeedAudio] = useState(true);

    // Rotate
    const [videoRotation, setVideoRotation] = useState("90");

    // GIF
    const [gifStart, setGifStart] = useState("00:00:00");
    const [gifDuration, setGifDuration] = useState(5);
    const [gifWidth, setGifWidth] = useState(480);
    const [gifFps, setGifFps] = useState(15);

    // Thumbnail
    const [thumbTimestamp, setThumbTimestamp] = useState("5.000");
    const [thumbFormat, setThumbFormat] = useState("jpg");
    const [videoDuration, setVideoDuration] = useState(60);

    // FPS
    const [targetFps, setTargetFps] = useState(30);

    // Stabilize
    const [stabilizeStrength, setStabilizeStrength] = useState(10);

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

    const getToolOptions = (): Record<string, string | number | boolean> => {
        switch (activeTool) {
            case "trim":
                return { start: trimStart, end: trimEnd };
            case "compress":
                return { videoBitrate, audioBitrate, crf: compressCrf };
            case "convert":
                return { format: videoFormat };
            case "resize":
                return { width: videoWidth, height: videoHeight, mode: videoResizeMode };
            case "extract-audio":
                return { format: audioFormat, bitrate: audioQuality };
            case "volume":
                return { level: volumeLevel };
            case "speed":
                return { factor: speedFactor, adjustAudio: speedAudio };
            case "rotate":
                return { rotation: videoRotation };
            case "gif":
                return { start: gifStart, duration: gifDuration, width: gifWidth, fps: gifFps };
            case "thumbnail":
                return { timestamp: secondsToTimestampMilliseconds(Number(thumbTimestamp) || 0), format: thumbFormat };
            case "mute":
                return {};
            case "stabilize":
                return { strength: stabilizeStrength };
            case "reverse":
                return {};
            case "fps":
                return { fps: targetFps };
            default:
                return {};
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
                `video/${activeTool}`,
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
            case "trim":
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <TextInput label="Start Time" value={trimStart} onChange={setTrimStart} placeholder="00:00:00" disabled={disabled} />
                        <TextInput label="End Time" value={trimEnd} onChange={setTrimEnd} placeholder="00:00:30" disabled={disabled} />
                    </div>
                );
            case "compress":
                return (
                    <>
                        <NumberInput label="CRF (lower = better)" value={compressCrf} onChange={setCompressCrf} min={0} max={51} disabled={disabled} />
                        <NumberInput label="Video Bitrate" value={videoBitrate} onChange={setVideoBitrate} min={100} max={50000} suffix="kbps" disabled={disabled} />
                        <NumberInput label="Audio Bitrate" value={audioBitrate} onChange={setAudioBitrate} min={32} max={320} suffix="kbps" disabled={disabled} />
                    </>
                );
            case "convert":
                return (
                    <SelectInput
                        label="Output Format"
                        value={videoFormat}
                        onChange={setVideoFormat}
                        options={[
                            { label: "MP4 (H.264)", value: "mp4" },
                            { label: "WebM (VP9)", value: "webm" },
                            { label: "MKV", value: "mkv" },
                            { label: "AVI", value: "avi" },
                            { label: "MOV", value: "mov" },
                            { label: "TS", value: "ts" },
                        ]}
                        disabled={disabled}
                    />
                );
            case "resize":
                return (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <NumberInput label="Width" value={videoWidth} onChange={setVideoWidth} min={1} max={7680} suffix="px" disabled={disabled} />
                            <NumberInput label="Height" value={videoHeight} onChange={setVideoHeight} min={1} max={4320} suffix="px" disabled={disabled} />
                        </div>
                        <SelectInput
                            label="Mode"
                            value={videoResizeMode}
                            onChange={setVideoResizeMode}
                            options={[
                                { label: "Fit (keep aspect, pad)", value: "fit" },
                                { label: "Fill (stretch)", value: "fill" },
                                { label: "Cover (crop to fit)", value: "cover" },
                            ]}
                            disabled={disabled}
                        />
                    </>
                );
            case "extract-audio":
                return (
                    <>
                        <SelectInput
                            label="Audio Format"
                            value={audioFormat}
                            onChange={setAudioFormat}
                            options={[
                                { label: "MP3", value: "mp3" },
                                { label: "WAV", value: "wav" },
                                { label: "AAC", value: "aac" },
                                { label: "OGG", value: "ogg" },
                                { label: "FLAC", value: "flac" },
                            ]}
                            disabled={disabled}
                        />
                        <NumberInput label="Bitrate" value={audioQuality} onChange={setAudioQuality} min={32} max={320} suffix="kbps" disabled={disabled} />
                    </>
                );
            case "volume":
                return (
                    <NumberInput label="Volume Level" value={volumeLevel} onChange={setVolumeLevel} min={0} max={500} suffix="%" disabled={disabled} />
                );
            case "speed":
                return (
                    <>
                        <NumberInput label="Speed Factor" value={speedFactor} onChange={setSpeedFactor} min={0.25} max={4} step={0.25} suffix="×" disabled={disabled} />
                        <CheckboxInput label="Adjust audio pitch" checked={speedAudio} onChange={setSpeedAudio} disabled={disabled} />
                    </>
                );
            case "rotate":
                return (
                    <div className="grid grid-cols-[minmax(0,1fr)_130px] items-end gap-2">
                        <NumberInput label="Angle" value={Number(videoRotation) || 90} onChange={value => setVideoRotation(String(value))} min={90} max={270} step={90} suffix="°" disabled={disabled}/>
                        <SelectInput label="Preset" value={videoRotation} onChange={setVideoRotation} options={[
                            {label: "90° CW", value: "90"}, {label: "180°", value: "180"}, {label: "90° CCW", value: "270"}, {label: "Flip H", value: "hflip"}, {label: "Flip V", value: "vflip"},
                        ]} disabled={disabled}/>
                    </div>
                );
            case "gif":
                return (
                    <>
                        <TextInput label="Start Time" value={gifStart} onChange={setGifStart} placeholder="00:00:00" disabled={disabled} />
                        <NumberInput label="Duration" value={gifDuration} onChange={setGifDuration} min={1} max={30} suffix="s" disabled={disabled} />
                        <NumberInput label="Width" value={gifWidth} onChange={setGifWidth} min={100} max={1920} suffix="px" disabled={disabled} />
                        <NumberInput label="FPS" value={gifFps} onChange={setGifFps} min={5} max={30} disabled={disabled} />
                    </>
                );
            case "thumbnail":
                return (
                    <>
                        <NumberInput label="Frame position" value={Math.min(Number(thumbTimestamp) || 0, videoDuration)} onChange={value => setThumbTimestamp(value.toFixed(3))} min={0} max={Math.max(.001, videoDuration)} step={0.001} suffix="s" disabled={disabled}/>
                        <div>
                            <label className="mb-1 block text-[10px] font-semibold uppercase text-neutral-500">Exact time</label>
                            <MainStringInput type="number" min={0} max={videoDuration} step="0.001" value={thumbTimestamp} onChange={value => setThumbTimestamp(value)} suffix="seconds" disabled={disabled} className="bg-neutral-950" inputClassName="py-2 font-mono text-sm"/>
                            <p className="mt-1 text-[9px] text-zinc-600">Milliseconds are supported, for example 5.125.</p>
                        </div>
                        <SelectInput
                            label="Format"
                            value={thumbFormat}
                            onChange={setThumbFormat}
                            options={[
                                { label: "JPEG", value: "jpg" },
                                { label: "PNG", value: "png" },
                                { label: "WebP", value: "webp" },
                            ]}
                            disabled={disabled}
                        />
                    </>
                );
            case "mute":
                return <p className="text-[11px] text-neutral-500">No options — removes all audio tracks.</p>;
            case "stabilize":
                return (
                    <NumberInput label="Stabilization Strength" value={stabilizeStrength} onChange={setStabilizeStrength} min={1} max={30} disabled={disabled} />
                );
            case "reverse":
                return <p className="text-[11px] text-neutral-500">No options — reverses the entire video with audio.</p>;
            case "fps":
                return (
                    <SelectInput
                        label="Target FPS"
                        value={String(targetFps)}
                        onChange={(v) => setTargetFps(Number(v))}
                        options={[
                            { label: "24 fps (Film)", value: "24" },
                            { label: "25 fps (PAL)", value: "25" },
                            { label: "30 fps (Standard)", value: "30" },
                            { label: "48 fps", value: "48" },
                            { label: "60 fps (Smooth)", value: "60" },
                            { label: "120 fps", value: "120" },
                        ]}
                        disabled={disabled}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <ToolWorkspace
            title="Video Tools"
            subtitle="Trim, compress, convert, and edit videos with ffmpeg"
            accept={VIDEO_ACCEPT}
            mediaLabel="Drop your video here"
            mediaHint="or click to browse • paste with Ctrl+V • MP4, WebM, MKV, AVI..."
            file={file}
            onFile={handleFile}
            onClear={handleClear}
            processing={processing}
            tools={TOOLS}
            activeTool={activeTool}
            onToolSelect={(tool) => {
                setActiveTool(tool);
                clearResult();
            }}
            progress={progress}
            resultUrl={resultUrl}
            resultFilename={resultFilename}
            error={error}
            onDismissResult={clearResult}
            editorContent={activeTool === "trim" && file ? (
                <VideoTimeline
                    file={file}
                    start={timestampToSeconds(trimStart)}
                    end={timestampToSeconds(trimEnd)}
                    onChange={(start, end) => {
                        setTrimStart(secondsToTimestamp(start));
                        setTrimEnd(secondsToTimestamp(end));
                        clearResult();
                    }}
                />
            ) : file ? (
                <VideoEffectPreview
                    file={file}
                    tool={activeTool}
                    rotation={videoRotation}
                    timestamp={timestampToSeconds(thumbTimestamp)}
                    fps={targetFps}
                    onDuration={setVideoDuration}
                />
            ) : undefined}
            optionsContent={renderToolOptions()}
            processLabel="Process Video"
            onProcess={handleProcess}
        />
    );
}
