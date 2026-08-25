"use client";

import {useEffect, useMemo, useRef} from "react";

export default function VideoEffectPreview({file, tool, rotation, timestamp, fps, onDuration}: {
    file: File;
    tool: string;
    rotation: string;
    timestamp: number;
    fps: number;
    onDuration?: (duration: number) => void;
}) {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => () => URL.revokeObjectURL(url), [url]);
    useEffect(() => {
        if (tool === "thumbnail" && videoRef.current && Number.isFinite(timestamp)) videoRef.current.currentTime = timestamp;
    }, [timestamp, tool]);

    const degrees = rotation === "90" ? 90 : rotation === "180" ? 180 : rotation === "270" ? 270 : 0;
    const transform = tool === "rotate"
        ? rotation === "hflip" ? "scaleX(-1)" : rotation === "vflip" ? "scaleY(-1)" : `rotate(${degrees}deg) scale(${degrees === 90 || degrees === 270 ? .68 : .9})`
        : "none";

    return (
        <section className="box-primary rounded-xl p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div><h2 className="text-xs font-semibold text-white">Live preview</h2><p className="text-[10px] text-zinc-500">Preview locally before starting the export.</p></div>
                {tool === "fps" && <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-300">Target {fps} FPS</span>}
            </div>
            <div className="flex h-[clamp(190px,32vh,360px)] items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-black/70 p-2">
                <video ref={videoRef} src={url} controls={tool !== "thumbnail"} muted={tool === "thumbnail"} playsInline preload="metadata" onLoadedMetadata={event => { onDuration?.(event.currentTarget.duration || 0); if (tool === "thumbnail") event.currentTarget.currentTime = Math.min(timestamp, event.currentTarget.duration || timestamp); }} className="max-h-full max-w-full object-contain transition-transform duration-150" style={{transform}}/>
            </div>
        </section>
    );
}
