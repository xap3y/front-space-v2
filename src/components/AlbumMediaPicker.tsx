"use client";

import {useEffect, useState} from "react";
import {FaCheck, FaLock, FaPlay, FaPlus} from "react-icons/fa6";
import {Button, Pagination} from "@/components/ui";
import Dialog from "@/components/ui/Dialog";
import {getApiUrl, isVideoFile} from "@/lib/core";
import {errorToast} from "@/lib/client";
import type {ImageListResponse, UploadedImagePage} from "@/types/image";

type Props = {
    open: boolean;
    onClose: () => void;
    existingIds: string[];
    onAdd: (ids: string[]) => Promise<boolean>;
};

const PAGE_SIZE = 24;

function Thumb({image}: {image: UploadedImagePage}) {
    const protectedItem = image.requiresPassword || !image.public;
    const video = isVideoFile(image.type);
    const src = protectedItem ? null : video ? image.urls.posterUrl : image.urls.rawUrl;
    return (
        <>
            {src
                ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover"/>
                : <span className="text-[10px] uppercase text-zinc-500">{image.type}</span>}
            {(video || protectedItem) && (
                <span className="absolute bottom-1 left-1 flex gap-1">
                    {video && <span className="rounded bg-black/70 p-1"><FaPlay className="h-2.5 w-2.5"/></span>}
                    {protectedItem && <span className="rounded bg-black/70 p-1 text-amber-300"><FaLock className="h-2.5 w-2.5"/></span>}
                </span>
            )}
        </>
    );
}

/** Dialog with a paged grid of the current user's uploads and multi-select. */
export default function AlbumMediaPicker({open, onClose, existingIds, onAdd}: Props) {
    const [page, setPage] = useState(0);
    const [data, setData] = useState<ImageListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        let active = true;
        setLoading(true);
        fetch(`${getApiUrl()}/v1/user/me/images/pageable?page=${page}&size=${PAGE_SIZE}&excludeProfilePictures=true`, {
            credentials: "include",
            headers: {"Accept": "application/json"},
        })
            .then(async response => {
                const body = await response.json();
                if (!response.ok || body.error) throw new Error(body.message || "Failed to load uploads");
                if (active) setData(body.message as ImageListResponse);
            })
            .catch(error => errorToast(error.message))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [page, open]);

    const close = () => {
        setSelected([]);
        onClose();
    };

    const toggle = (id: string) =>
        setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);

    const add = async () => {
        setAdding(true);
        const ok = await onAdd(selected);
        setAdding(false);
        if (ok) close();
    };

    return (
        <Dialog open={open} onClose={close} size="lg" title="Add media to album" footer={
            <>
                <span className="mr-auto text-xs text-zinc-400">
                    {selected.length === 0 ? "Select uploads to add" : `${selected.length} selected`}
                </span>
                {data && data.totalPages > 1 && (
                    // Pagination's own top border and spacing are for page bottoms; strip them in the footer.
                    <div className="[&_nav]:m-0 [&_nav]:w-auto [&_nav]:border-0 [&_nav]:p-0">
                        <Pagination page={page + 1} pages={data.totalPages} disabled={loading} onChange={next => setPage(next - 1)}/>
                    </div>
                )}
                {selected.length > 0 && <Button size="small" onClick={() => setSelected([])}>Clear</Button>}
                <Button variant="primary" size="small" icon={<FaPlus/>} loading={adding}
                        disabled={selected.length === 0} onClick={add}>
                    Add to album
                </Button>
            </>
        }>
            {loading && !data ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                    {Array.from({length: 12}, (_, index) => (
                        <div key={index} className="aspect-square animate-pulse rounded-md bg-zinc-900"/>
                    ))}
                </div>
            ) : !data || data.images.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-500">You have no uploads yet.</p>
            ) : (
                <>
                    <div className={`grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6 ${loading ? "opacity-50" : ""}`}>
                        {data.images.map(image => {
                            const inAlbum = existingIds.includes(image.uniqueId);
                            const isSelected = selected.includes(image.uniqueId);
                            return (
                                <div key={image.uniqueId} role="checkbox" aria-checked={isSelected || inAlbum}
                                     aria-disabled={inAlbum || undefined} tabIndex={inAlbum ? -1 : 0}
                                     aria-label={`${image.uniqueId}.${image.type}${inAlbum ? " (already in album)" : ""}`}
                                     title={inAlbum ? "Already in this album" : `${image.uniqueId}.${image.type}`}
                                     onClick={() => !inAlbum && toggle(image.uniqueId)}
                                     onKeyDown={event => {
                                         if (!inAlbum && (event.key === " " || event.key === "Enter")) {
                                             event.preventDefault();
                                             toggle(image.uniqueId);
                                         }
                                     }}
                                     className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-zinc-900 outline-none ring-offset-2 ring-offset-[#0a0a0a] focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                                         inAlbum ? "cursor-not-allowed opacity-35"
                                             : isSelected ? "cursor-pointer ring-2 ring-blue-500" : "cursor-pointer hover:opacity-80"
                                     }`}>
                                    <Thumb image={image}/>
                                    {(isSelected || inAlbum) && (
                                        <span className={`absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white ${inAlbum ? "bg-zinc-600" : "bg-blue-600"}`}>
                                            <FaCheck className="h-2.5 w-2.5"/>
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </Dialog>
    );
}
