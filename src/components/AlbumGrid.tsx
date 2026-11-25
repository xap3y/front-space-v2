"use client";

import {useEffect, useState} from "react";
import {FaChevronLeft, FaChevronRight, FaLock, FaPlay, FaXmark} from "react-icons/fa6";
import {FaExternalLinkAlt} from "react-icons/fa";
import {Button, DeleteButton} from "@/components/ui";
import {isVideoFile} from "@/lib/core";
import type {AlbumItem} from "@/types/album";

export type AlbumGridProps = {
    items: AlbumItem[];
    onRemove?: (item: AlbumItem) => void;
    removingId?: string | null;
    /** Tailwind grid-cols classes; defaults suit a full-width page. */
    columns?: string;
};

/** Media grid with an image/video lightbox. Protected items link to their own page to unlock. */
export function AlbumGrid({items, onRemove, removingId, columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}: AlbumGridProps) {
    const viewable = items.filter(item => !item.locked);
    const [active, setActive] = useState<number | null>(null);
    const current = active === null ? null : viewable[active];
    const step = (delta: number) => setActive(index => index === null ? null : (index + delta + viewable.length) % viewable.length);

    useEffect(() => {
        if (active === null) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActive(null);
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [active, viewable.length]);

    return (
        <>
            <div className={`grid gap-2 sm:gap-3 ${columns}`}>
                {items.map(item => {
                    const video = isVideoFile(item.type);
                    return (
                        <div key={item.uniqueId} className="group relative aspect-square overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                            {item.locked ? (
                                <a href={item.portalUrl} target="_blank" rel="noreferrer"
                                   className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center text-[11px] text-zinc-500 hover:text-zinc-200">
                                    <FaLock className="h-5 w-5 text-amber-300"/>
                                    Protected · open to unlock
                                </a>
                            ) : (
                                <div role="button" tabIndex={0} aria-label={`View ${item.description || item.uniqueId}`}
                                     onClick={() => setActive(viewable.indexOf(item))}
                                     onKeyDown={event => event.key === "Enter" && setActive(viewable.indexOf(item))}
                                     className="h-full w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400">
                                    {video && !item.posterUrl ? (
                                        <video src={`${item.rawUrl}#t=0.1`} muted playsInline preload="metadata"
                                               className="pointer-events-none h-full w-full object-cover"/>
                                    ) : (
                                        <img src={video ? item.posterUrl! : item.rawUrl} alt={item.description || item.uniqueId} loading="lazy"
                                             className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/>
                                    )}
                                    {video && (
                                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <span className="rounded-full bg-black/60 p-3"><FaPlay className="h-4 w-4 translate-x-px"/></span>
                                        </span>
                                    )}
                                </div>
                            )}
                            {onRemove && (
                                <div className="absolute right-1.5 top-1.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                                    <DeleteButton size="small" aria-label="Remove from album" title="Remove from album"
                                                  loading={removingId === item.uniqueId}
                                                  onClick={() => onRemove(item)}/>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {current && active !== null && (
                <div role="dialog" aria-modal="true" aria-label="Media preview"
                     className="fixed inset-0 z-[100] flex flex-col bg-black/95">
                    <div className="flex items-center justify-between gap-2 p-3 text-xs text-zinc-400">
                        <span className="tabular-nums">{active + 1} / {viewable.length}</span>
                        <div className="flex gap-2">
                            <Button size="small" iconOnly aria-label="Open original" icon={<FaExternalLinkAlt/>}
                                    onClick={() => window.open(current.portalUrl, "_blank", "noopener")}/>
                            <Button size="small" iconOnly aria-label="Close preview" icon={<FaXmark/>} onClick={() => setActive(null)}/>
                        </div>
                    </div>
                    <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-16"
                         onClick={event => event.target === event.currentTarget && setActive(null)}>
                        {isVideoFile(current.type) ? (
                            <video key={current.uniqueId} src={current.rawUrl} poster={current.posterUrl ?? undefined}
                                   controls autoPlay playsInline className="max-h-full max-w-full"/>
                        ) : (
                            <img key={current.uniqueId} src={current.rawUrl} alt={current.description || current.uniqueId}
                                 className="max-h-full max-w-full object-contain"/>
                        )}
                        {viewable.length > 1 && (
                            <>
                                <Button iconOnly aria-label="Previous" icon={<FaChevronLeft/>} onClick={() => step(-1)}
                                        className="absolute left-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex"/>
                                <Button iconOnly aria-label="Next" icon={<FaChevronRight/>} onClick={() => step(1)}
                                        className="absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex"/>
                            </>
                        )}
                    </div>
                    {(current.description || viewable.length > 1) && (
                        <div className="flex items-center justify-between gap-3 border-t border-zinc-900 p-3">
                            {viewable.length > 1 && <Button iconOnly aria-label="Previous" icon={<FaChevronLeft/>} onClick={() => step(-1)} className="sm:hidden"/>}
                            <p className="min-w-0 flex-1 truncate text-center text-xs text-zinc-300">{current.description}</p>
                            {viewable.length > 1 && <Button iconOnly aria-label="Next" icon={<FaChevronRight/>} onClick={() => step(1)} className="sm:hidden"/>}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
