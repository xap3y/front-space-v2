"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {FaLock, FaPlay, FaPlus} from "react-icons/fa6";
import {MdPhotoLibrary} from "react-icons/md";
import {Badge, Button, CopyButton, EmptyState, Field, SecretField} from "@/components/ui";
import Dialog from "@/components/ui/Dialog";
import {useUser} from "@/hooks/useUser";
import {usePage} from "@/context/PageContext";
import {hasPermission} from "@/lib/permissions";
import {albumRequest, getAlbumShareUrl} from "@/lib/albums";
import {copyToClipboard, errorToast, okToast} from "@/lib/client";
import {isVideoFile} from "@/lib/core";
import type {AlbumSummary} from "@/types/album";

const ignorePasswordManagers = {"data-1p-ignore": true, "data-lpignore": "true", "data-bwignore": "true"};

function Cover({album}: {album: AlbumSummary}) {
    const posterless = album.coverUrl && isVideoFile(album.coverType ?? "") && !album.coverUrl.includes("/poster/");
    if (!album.coverUrl) return <MdPhotoLibrary className="h-10 w-10 text-zinc-700"/>;
    if (posterless) {
        return <video src={`${album.coverUrl}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover"/>;
    }
    return (
        <img src={album.coverUrl} alt="" loading="lazy"
             className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/>
    );
}

export default function AlbumsPageClient() {
    const {setPage} = usePage();
    const {user, loadingUser} = useUser();
    const router = useRouter();
    const [albums, setAlbums] = useState<AlbumSummary[] | null>(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [password, setPassword] = useState("");

    const allowed = hasPermission(user, "CREATE_ALBUMS");

    useEffect(() => {
        setPage("albums");
        if (loadingUser) return;
        if (!user) {
            router.push("/login?after=/home/albums");
            return;
        }
        if (!allowed) return;
        albumRequest<AlbumSummary[]>("/my")
            .then(setAlbums)
            .catch(error => errorToast(error.message));
    }, [user, loadingUser, allowed, setPage, router]);

    const create = async () => {
        setBusy(true);
        try {
            const album = await albumRequest<AlbumSummary>("", "POST", {name, description, password: password || null});
            okToast("Album created");
            router.push(`/home/albums/${album.uniqueId}`);
        } catch (error: any) {
            errorToast(error.message);
            setBusy(false);
        }
    };

    if (!loadingUser && user && !allowed) {
        return (
            <div className="mx-auto max-w-md p-4 pt-16">
                <EmptyState title="Albums are not available" description="Your account does not have permission to create albums."/>
            </div>
        );
    }

    const canCreate = !!name.trim() && (password.length === 0 || password.length >= 3);

    return (
        <div className="mx-auto w-full max-w-7xl space-y-5 p-3 pb-16 sm:p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white md:text-2xl">Albums</h1>
                    <p className="mt-1 text-xs text-zinc-500">Group your uploads and share them with a single link.</p>
                </div>
                <Button variant="primary" icon={<FaPlus/>} onClick={() => setCreating(true)}>New album</Button>
            </header>

            {albums === null ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {[0, 1, 2, 3].map(index => (
                        <div key={index} className="overflow-hidden rounded-md border border-zinc-800 bg-[#0a0a0a]">
                            <div className="aspect-[4/3] animate-pulse bg-zinc-900"/>
                            <div className="h-16"/>
                        </div>
                    ))}
                </div>
            ) : albums.length === 0 ? (
                <EmptyState title="No albums yet" description="Create an album, add your images and videos, and share one link."
                            action={<Button variant="primary" icon={<FaPlus/>} onClick={() => setCreating(true)}>New album</Button>}/>
            ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {albums.map(album => (
                        <article key={album.uniqueId} className="group relative overflow-hidden rounded-md border border-zinc-800 bg-[#0a0a0a] transition-colors hover:border-zinc-600">
                            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-zinc-900">
                                <Cover album={album}/>
                                {album.coverUrl && isVideoFile(album.coverType ?? "") && (
                                    <span className="absolute bottom-2 left-2 rounded bg-black/70 p-1.5"><FaPlay className="h-2.5 w-2.5"/></span>
                                )}
                            </div>
                            <div className="flex items-start justify-between gap-2 p-3">
                                <div className="min-w-0">
                                    {/* Stretched link: the whole card opens the album. */}
                                    <Link href={`/home/albums/${album.uniqueId}`} className="block truncate text-sm font-semibold text-zinc-100 after:absolute after:inset-0">
                                        {album.name}
                                    </Link>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <Badge>{album.itemCount} {album.itemCount === 1 ? "item" : "items"}</Badge>
                                        {album.passwordProtected && <Badge tone="warning"><FaLock className="mr-1 h-2.5 w-2.5"/>Password</Badge>}
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <CopyButton size="small" iconOnly aria-label={`Copy link to ${album.name}`} title="Copy share link"
                                                onClick={() => copyToClipboard(getAlbumShareUrl(album.uniqueId))}/>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <Dialog open={creating} onClose={() => setCreating(false)} title="New album" footer={
                <>
                    <Button size="small" onClick={() => setCreating(false)}>Cancel</Button>
                    <Button variant="primary" size="small" icon={<FaPlus/>} loading={busy} disabled={!canCreate} onClick={create}>
                        Create album
                    </Button>
                </>
            }>
                {/* Separate forms: browsers treat a text input in the same form as a password input as a login username. */}
                <form className="space-y-3" autoComplete="off" onSubmit={event => event.preventDefault()}>
                    <Field label="Name" value={name} onChange={setName} placeholder="e.g. Summer trip 2026" maxLength={100} autoFocus
                           name="album-name" autoComplete="off" {...ignorePasswordManagers}/>
                    <Field label="Description" value={description} onChange={setDescription} multiline rows={3}
                           maxLength={1000} inputClassName="!h-auto !py-2" placeholder="What is this album about?" hint="Optional, shown on the shared page."/>
                </form>
                <form className="mt-3" autoComplete="off" onSubmit={event => event.preventDefault()}>
                    <SecretField label="Password" value={password} onChange={setPassword} maxLength={100}
                           placeholder="Leave empty for a public link" name="album-secret"
                           error={password.length > 0 && password.length < 3 ? "At least 3 characters." : undefined}
                           hint="Optional. Visitors will need it to open the album."/>
                </form>
            </Dialog>
        </div>
    );
}
