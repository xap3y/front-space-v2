"use client";

import {useEffect, useMemo, useRef, useState} from "react";

const formatTime = (seconds: number) => {
    const value = Math.max(0, Math.floor(seconds));
    return [Math.floor(value / 3600), Math.floor(value % 3600 / 60), value % 60]
        .map(part => String(part).padStart(2, "0")).join(":");
};

export default function VideoTimeline({file, start, end, onChange}: {
    file: File;
    start: number;
    end: number;
    onChange: (start: number, end: number, duration: number) => void;
}) {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    useEffect(() => () => URL.revokeObjectURL(url), [url]);
    const seek = (value: number) => {
        setCurrent(value);
        if (videoRef.current) videoRef.current.currentTime = value;
    };

    return (
        <section className="box-primary overflow-hidden rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-white">Trim timeline</h2>
                    <p className="text-[11px] text-zinc-500">Drag either edge, then click the timeline to preview a frame.</p>
                </div>
                <span className="font-mono text-[11px] text-emerald-300">{formatTime(start)} — {formatTime(end)}</span>
            </div>
            <video
                ref={videoRef}
                src={url}
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                    const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
                    setDuration(nextDuration);
                    onChange(0, nextDuration, nextDuration);
                }}
                onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
                className="mx-auto h-[clamp(190px,32vh,350px)] w-full rounded-xl bg-black object-contain"
            />
            <div className="mt-4 rounded-xl border border-zinc-800 bg-black/40 p-3">
                <div className="relative h-10">
                    <div className="absolute left-0 right-0 top-4 h-2 rounded-full bg-zinc-800"/>
                    {duration > 0 && <div className="absolute top-4 h-2 rounded-full bg-emerald-500/60" style={{left: `${start / duration * 100}%`, right: `${100 - end / duration * 100}%`}}/>}
                    <input aria-label="Trim start" type="range" min={0} max={duration || 1} step={0.05} value={start} onChange={event => { const value = Math.min(Number(event.target.value), end - .05); onChange(value, end, duration); seek(value); }} className="timeline-range absolute inset-0 w-full appearance-none bg-transparent"/>
                    <input aria-label="Trim end" type="range" min={0} max={duration || 1} step={0.05} value={end} onChange={event => { const value = Math.max(Number(event.target.value), start + .05); onChange(start, value, duration); seek(value); }} className="timeline-range absolute inset-0 w-full appearance-none bg-transparent"/>
                </div>
                <input aria-label="Preview position" type="range" min={0} max={duration || 1} step={0.05} value={current} onChange={event => seek(Number(event.target.value))} className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white"/>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-500"><span>{formatTime(start)}</span><span>{formatTime(current)}</span><span>{formatTime(end)}</span></div>
            </div>
            <style jsx>{`.timeline-range{pointer-events:none}.timeline-range::-webkit-slider-thumb{pointer-events:auto;appearance:none;width:18px;height:28px;border-radius:6px;background:#34d399;border:3px solid #07130f;cursor:ew-resize}.timeline-range::-moz-range-thumb{pointer-events:auto;width:14px;height:24px;border-radius:6px;background:#34d399;border:3px solid #07130f;cursor:ew-resize}`}</style>
        </section>
    );
}
