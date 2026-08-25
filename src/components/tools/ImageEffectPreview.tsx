"use client";

import {useEffect, useMemo} from "react";

export default function ImageEffectPreview({file, tool, brightness, contrast, saturation, blur, sharpen, rotation, flip}: {
    file: File;
    tool: string;
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sharpen: number;
    rotation: number;
    flip: string;
}) {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    useEffect(() => () => URL.revokeObjectURL(url), [url]);

    let filter = "none";
    let transform = "none";
    if (tool === "brightness") filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
    if (tool === "blur") filter = `blur(${Math.min(blur, 18)}px)`;
    if (tool === "grayscale") filter = "grayscale(1)";
    if (tool === "sharpen") filter = `contrast(${100 + sharpen * 4}%) saturate(${100 + sharpen * 2}%)`;
    if (tool === "rotate") transform = `rotate(${rotation}deg) scale(.82)`;
    if (tool === "flip") transform = flip === "horizontal" ? "scaleX(-1)" : flip === "vertical" ? "scaleY(-1)" : "scale(-1)";

    return (
        <section className="box-primary rounded-xl p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div><h2 className="text-xs font-semibold text-white">Live preview</h2><p className="text-[10px] text-zinc-500">Final output may vary slightly after processing.</p></div>
                {tool === "sharpen" && <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] text-amber-300">Approximation</span>}
            </div>
            <div className="flex h-[clamp(180px,30vh,340px)] items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-black/60 p-2">
                <img src={url} alt={`${tool} preview`} className="max-h-full max-w-full object-contain transition-[filter,transform] duration-150" style={{filter, transform}}/>
            </div>
        </section>
    );
}
