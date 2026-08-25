"use client";

import {PointerEvent, useEffect, useMemo, useRef, useState} from "react";

type Crop = {x: number; y: number; width: number; height: number};

export default function InteractiveCrop({file, crop, onChange}: {
    file: File;
    crop: Crop;
    onChange: (crop: Crop) => void;
}) {
    const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
    const imageRef = useRef<HTMLImageElement>(null);
    const [natural, setNatural] = useState({width: 1, height: 1});
    const dragStart = useRef<{x: number; y: number} | null>(null);

    useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

    const point = (event: PointerEvent<HTMLDivElement>) => {
        const rect = imageRef.current!.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(natural.width, (event.clientX - rect.left) * natural.width / rect.width)),
            y: Math.max(0, Math.min(natural.height, (event.clientY - rect.top) * natural.height / rect.height)),
        };
    };

    return (
        <section className="box-primary overflow-hidden rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-white">Interactive crop</h2>
                    <p className="text-[11px] text-zinc-500">Drag across the image to select the exact output area.</p>
                </div>
                <span className="rounded-lg border border-zinc-800 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
                    {Math.round(crop.width)} × {Math.round(crop.height)} px
                </span>
            </div>
            <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black/50 p-2">
                <div
                    className="relative max-h-[38vh] max-w-full cursor-crosshair select-none touch-none"
                    onPointerDown={(event) => {
                        if (!imageRef.current) return;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        const start = point(event);
                        dragStart.current = start;
                        onChange({x: start.x, y: start.y, width: 1, height: 1});
                    }}
                    onPointerMove={(event) => {
                        if (!dragStart.current || !imageRef.current) return;
                        const end = point(event);
                        onChange({
                            x: Math.min(dragStart.current.x, end.x),
                            y: Math.min(dragStart.current.y, end.y),
                            width: Math.max(1, Math.abs(end.x - dragStart.current.x)),
                            height: Math.max(1, Math.abs(end.y - dragStart.current.y)),
                        });
                    }}
                    onPointerUp={() => { dragStart.current = null; }}
                    onPointerCancel={() => { dragStart.current = null; }}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Crop preview"
                        draggable={false}
                        onLoad={(event) => setNatural({
                            width: event.currentTarget.naturalWidth,
                            height: event.currentTarget.naturalHeight,
                        })}
                        className="block max-h-[38vh] max-w-full object-contain"
                    />
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div
                            className="absolute border-2 border-emerald-400 bg-emerald-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,.62)]"
                            style={{
                                left: `${crop.x / natural.width * 100}%`,
                                top: `${crop.y / natural.height * 100}%`,
                                width: `${crop.width / natural.width * 100}%`,
                                height: `${crop.height / natural.height * 100}%`,
                            }}
                        >
                            <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-sm bg-emerald-300"/>
                            <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-sm bg-emerald-300"/>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
