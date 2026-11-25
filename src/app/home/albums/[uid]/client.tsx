"use client";

import Link from "next/link";
import {useCallback, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {FaArrowLeft, FaLock, FaPlus} from "react-icons/fa6";
import {FaExternalLinkAlt} from "react-icons/fa";
import {Badge, Button, CopyButton, DeleteButton, EmptyState, Field, SecretField, Panel, SaveButton, Skeleton, Toolbar} from "@/components/ui";
import {AlbumGrid} from "@/components/AlbumGrid";
import AlbumMediaPicker from "@/components/AlbumMediaPicker";
import {useUser} from "@/hooks/useUser";
import {usePage} from "@/context/PageContext";
import {albumRequest, getAlbumShareUrl} from "@/lib/albums";
import {copyToClipboard, errorToast, okToast} from "@/lib/client";
import type {AlbumItem, AlbumView} from "@/types/album";

const ignorePasswordManagers = {"data-1p-ignore": true, "data-lpignore": "true", "data-bwignore": "true"};

export default function AlbumManageClient() {
    const {uid} = useParams<{uid: string}>();
    const {setPage} = usePage();
    const {user, loadingUser} = useUser();
    const router = useRouter();
    const [album, setAlbum] = useState<AlbumView | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [password, setPassword] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [busy, setBusy] = useState<"details" | "password" | "delete" | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const base = `/${encodeURIComponent(uid)}`;

    const apply = useCallback((view: AlbumView) => {
        setAlbum(view);
        setName(view.name);
        setDescription(view.description ?? "");
    }, []);

    useEffect(() => {
        setPage("albums");
        if (loadingUser) return;
        if (!user) {
            router.push(`/login?after=/home/albums/${uid}`);
            return;
        }
        albumRequest<AlbumView>(`${base}/view`, "POST", {})
            .then(apply)
            .catch(err => setError(err.message));
    }, [user, loadingUser, uid, base, apply, setPage, router]);

    const run = async (kind: NonNullable<typeof busy>, action: () => Promise<void>) => {
        setBusy(kind);
        try {
            await action();
        } catch (err: any) {
            errorToast(err.message);
        } finally {
            setBusy(null);
        }
    };

    const saveDetails = () => run("details", async () => {
        await albumRequest(base, "PATCH", {name, description});
        setAlbum(previous => previous && {...previous, name: name.trim(), description: description.trim() || null});
        okToast("Album saved");
    });

    const savePassword = (value: string) => run("password", async () => {
        await albumRequest(`${base}/password`, "PUT", {password: value});
        setAlbum(previous => previous && {...previous, passwordProtected: !!value});
        setPassword("");
        okToast(value ? "Password saved" : "Password removed");
    });

    const addItems = async (ids: string[]) => {
        try {
            apply(await albumRequest<AlbumView>(`${base}/items`, "PUT", {imageIds: ids}));
            okToast(ids.length === 1 ? "1 item added" : `${ids.length} items added`);
            return true;
        } catch (err: any) {
            errorToast(err.message);
            return false;
        }
    };

    const removeItem = async (item: AlbumItem) => {
        setRemovingId(item.uniqueId);
        try {
            apply(await albumRequest<AlbumView>(`${base}/items/${encodeURIComponent(item.uniqueId)}`, "DELETE"));
        } catch (err: any) {
            errorToast(err.message);
        } finally {
            setRemovingId(null);
        }
    };

    const deleteAlbum = () => {
        if (!confirm("Delete this album? Your uploaded files are kept.")) return;
        run("delete", async () => {
            await albumRequest(base, "DELETE");
            okToast("Album deleted");
            router.push("/home/albums");
        });
    };

    if (error || (album && !album.canEdit)) {
        return (
            <div className="mx-auto max-w-md p-4 pt-16">
                <EmptyState title="Album unavailable" description={error ?? "You cannot manage this album."}
                            action={<Button onClick={() => router.push("/home/albums")}>Back to albums</Button>}/>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:p-6">
                <Skeleton width={200} height={24}/>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[0, 1, 2, 3].map(index => <div key={index} className="aspect-square animate-pulse rounded-md bg-zinc-900"/>)}
                </div>
            </div>
        );
    }

    const shareUrl = getAlbumShareUrl(album.uniqueId);
    const dirty = name.trim() !== album.name || description.trim() !== (album.description ?? "");

    return (
        <div className="mx-auto w-full max-w-7xl space-y-5 p-3 pb-16 sm:p-6">
            <Link href="/home/albums" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200">
                <FaArrowLeft className="h-3 w-3"/> All albums
            </Link>

            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="break-words text-xl font-bold text-white md:text-2xl">{album.name}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge>{album.items.length} {album.items.length === 1 ? "item" : "items"}</Badge>
                        {album.passwordProtected
                            ? <Badge tone="warning"><FaLock className="mr-1 h-2.5 w-2.5"/>Password protected</Badge>
                            : <Badge tone="success">Anyone with the link</Badge>}
                    </div>
                </div>
                <Toolbar>
                    <CopyButton onClick={() => copyToClipboard(shareUrl)}>Copy link</CopyButton>
                    <Button icon={<FaExternalLinkAlt/>} onClick={() => window.open(`/album/${album.uniqueId}`, "_blank", "noopener")}>Open</Button>
                    <Button variant="primary" icon={<FaPlus/>} onClick={() => setPickerOpen(true)}>Add media</Button>
                </Toolbar>
            </header>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section aria-label="Album items">
                    {album.items.length === 0 ? (
                        <EmptyState title="This album is empty" description="Add images and videos from your uploads."
                                    action={<Button variant="primary" icon={<FaPlus/>} onClick={() => setPickerOpen(true)}>Add media</Button>}/>
                    ) : (
                        <AlbumGrid items={album.items} onRemove={removeItem} removingId={removingId}
                                   columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"/>
                    )}
                </section>

                <aside className="space-y-4">
                    <Panel title="Details">
                        {/* Separate from the password form so browsers don't treat the name as a login username. */}
                        <form className="space-y-3" autoComplete="off" onSubmit={event => event.preventDefault()}>
                            <Field label="Name" value={name} onChange={setName} placeholder="e.g. Summer trip 2026" maxLength={100}
                                   name="album-name" autoComplete="off" {...ignorePasswordManagers}/>
                            <Field label="Description" value={description} onChange={setDescription} multiline rows={3}
                                   maxLength={1000} inputClassName="!h-auto !py-2" placeholder="What is this album about?" hint="Optional, shown on the shared page."/>
                            <div className="flex justify-end">
                                <SaveButton size="small" loading={busy === "details"} disabled={!dirty || !name.trim()} onClick={saveDetails}>
                                    Save
                                </SaveButton>
                            </div>
                        </form>
                    </Panel>

                    <Panel title="Access">
                        <div className="space-y-3">
                            {/* MainStringInput suffixes are decorative (pointer-events-none), so the button sits beside the field. */}
                            <div className="flex items-end gap-2">
                                <div className="min-w-0 flex-1">
                                    <Field label="Share link" value={shareUrl} readOnly onFocus={event => event.currentTarget.select()}/>
                                </div>
                                <CopyButton iconOnly aria-label="Copy share link" title="Copy share link" onClick={() => copyToClipboard(shareUrl)}/>
                            </div>
                            <form className="space-y-3" autoComplete="off" onSubmit={event => event.preventDefault()}>
                            <SecretField label={album.passwordProtected ? "Change password" : "Password"} value={password}
                                   onChange={setPassword} maxLength={100} placeholder="••••••" name="album-secret"
                                   hint={album.passwordProtected ? "Visitors must enter the password to see the album." : "Optional, at least 3 characters."}/>
                            <div className="flex flex-wrap justify-end gap-2">
                                {album.passwordProtected && (
                                    <DeleteButton size="small" loading={busy === "password" && !password} onClick={() => savePassword("")}>
                                        Remove password
                                    </DeleteButton>
                                )}
                                <SaveButton size="small" loading={busy === "password" && !!password} disabled={password.length < 3}
                                            onClick={() => savePassword(password)}>
                                    {album.passwordProtected ? "Change" : "Set password"}
                                </SaveButton>
                            </div>
                            </form>
                        </div>
                    </Panel>

                    <Panel title="Delete album">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-zinc-500">Uploaded files stay in your gallery.</p>
                            <DeleteButton size="small" loading={busy === "delete"} onClick={deleteAlbum}>Delete</DeleteButton>
                        </div>
                    </Panel>
                </aside>
            </div>

            <AlbumMediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)}
                              existingIds={album.items.map(item => item.uniqueId)} onAdd={addItems}/>
        </div>
    );
}
