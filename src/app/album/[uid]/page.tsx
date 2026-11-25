'use client';

import {useParams} from "next/navigation";
import {useCallback, useEffect, useState} from "react";
import {FaLock, FaPen} from "react-icons/fa6";
import LoadingPage from "@/components/LoadingPage";
import {AlbumGrid} from "@/components/AlbumGrid";
import {Button, CopyButton, EmptyState, SecretField} from "@/components/ui";
import {copyToClipboard} from "@/lib/client";
import {albumRequest, AlbumRequestError} from "@/lib/albums";
import type {AlbumView} from "@/types/album";

export default function AlbumPage() {
    const {uid} = useParams<{uid: string}>();
    const [album, setAlbum] = useState<AlbumView | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (pass?: string) => {
        setLoading(true);
        try {
            setAlbum(await albumRequest<AlbumView>(`/${encodeURIComponent(uid)}/view`, "POST", {password: pass ?? null}));
            setNeedsPassword(false);
            setError(null);
        } catch (err) {
            if (err instanceof AlbumRequestError && err.status === 401) {
                setNeedsPassword(true);
                setError(pass ? err.message : null);
            } else {
                setError(err instanceof Error ? err.message : "Failed to load album");
            }
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading && !needsPassword) return <LoadingPage/>;

    if (needsPassword) {
        return (
            <section className="flex min-h-screen w-full items-center justify-center px-4 py-8">
                <form autoComplete="off" noValidate onSubmit={event => { event.preventDefault(); if (password) load(password); }}
                      className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-800 bg-[#0a0a0a] p-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-900 bg-amber-950/40 text-amber-300">
                            <FaLock className="h-3.5 w-3.5"/>
                        </span>
                        <div>
                            <h1 className="text-sm font-semibold">Protected album</h1>
                            <p className="text-xs text-zinc-500">Enter the password to view it.</p>
                        </div>
                    </div>
                    <SecretField label="Password" value={password} onChange={setPassword} autoFocus placeholder="Album password"
                           error={error ?? undefined} name="album-secret"/>
                    <Button variant="primary" className="w-full" loading={loading} disabled={!password} onClick={() => load(password)}>
                        Open album
                    </Button>
                </form>
            </section>
        );
    }

    if (!album) {
        return (
            <div className="mx-auto max-w-md p-4 pt-24">
                <EmptyState title="Album not found" description={error ?? "The link may be wrong or the album was deleted."}/>
            </div>
        );
    }

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
            <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="break-words text-2xl font-bold sm:text-3xl">{album.name}</h1>
                    {album.description && (
                        <p className="mt-2 max-w-3xl whitespace-pre-line break-words text-sm text-zinc-400">{album.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                        {album.ownerAvatar
                            ? <img src={album.ownerAvatar} alt="" className="h-5 w-5 rounded-full"/>
                            : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[9px] uppercase text-zinc-300">{album.ownerName.slice(0, 2)}</span>}
                        <span className="text-zinc-300">{album.ownerName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{album.items.length} {album.items.length === 1 ? "item" : "items"}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={album.createdAt}>{new Date(album.createdAt).toLocaleDateString()}</time>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <CopyButton onClick={() => copyToClipboard(window.location.href)}>Copy link</CopyButton>
                    {album.canEdit && (
                        <Button icon={<FaPen/>} onClick={() => window.location.assign(`/home/albums/${album.uniqueId}`)}>Manage</Button>
                    )}
                </div>
            </header>
            {album.items.length === 0
                ? <EmptyState title="This album is empty" description="Nothing has been added yet."/>
                : <AlbumGrid items={album.items}/>}
        </main>
    );
}
