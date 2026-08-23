"use client";

import HoverDiv from "@/components/HoverDiv";

import {useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {FaCamera, FaCloudArrowUp, FaXmark} from "react-icons/fa6";
import {errorToast, okToast} from "@/lib/client";
import {getApiUrl} from "@/lib/core";
import {responseErrorMessage} from "@/lib/apiError";

type Props = { avatar?: string; username: string; apiKey: string };

export default function AvatarClient({avatar, username, apiKey}: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [currentAvatar, setCurrentAvatar] = useState(avatar || "/images/default-avatar.svg");
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const choose = (next?: File) => {
        if (!next) return;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(next.type)) return errorToast("Use a JPEG, PNG, WebP, or GIF image");
        if (next.size > 5 * 1024 * 1024) return errorToast("Profile pictures must be 5 MB or smaller");
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setFile(next);
        setPreview(URL.createObjectURL(next));
    };

    const close = () => {
        if (uploading) return;
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setFile(null); setPreview(null); setOpen(false);
    };

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData(); form.append("file", file);
            const response = await fetch(getApiUrl() + "/v1/user/me/avatar", {method: "POST", headers: {"x-api-key": apiKey}, body: form});
            if (!response.ok) throw new Error(await responseErrorMessage(response, "Could not update profile picture"));
            const payload = await response.json();
            const nextAvatar = payload?.message?.avatar;
            if (typeof nextAvatar !== "string") throw new Error("The server returned an invalid profile picture URL");
            setCurrentAvatar(nextAvatar);
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
            setFile(null); setPreview(null); setOpen(false);
            okToast("Profile picture updated"); router.refresh();
        } catch (error) {
            errorToast(error instanceof Error ? error.message : "Could not update profile picture", 2500);
        } finally { setUploading(false); }
    };

    return <>
        <HoverDiv type="INFO" onClick={() => setOpen(true)} className="group relative block rounded-full border-0 bg-transparent p-0" aria-label="Change profile picture">
            <img src={currentAvatar} alt={`${username}'s avatar`} className="h-28 w-28 rounded-full border-2 border-white/10 object-cover shadow-2xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100"><FaCamera className="h-6 w-6" /></span>
            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#101014] bg-blue-600 text-white"><FaCamera className="h-3.5 w-3.5" /></span>
        </HoverDiv>
        {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={close}>
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700 bg-[#101014] shadow-2xl" onMouseDown={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h2 className="font-semibold">Change profile picture</h2><p className="text-xs text-zinc-500">JPEG, PNG, WebP or GIF · max 5 MB</p></div><HoverDiv type="INFO" icon={<FaXmark/>} onClick={close} disabled={uploading} className="h-9 w-9 rounded-lg p-0 text-zinc-400" aria-label="Close"/></div>
                <div className="space-y-4 p-5">
                    <HoverDiv type="INFO" onClick={() => inputRef.current?.click()} onDragOver={e => {e.preventDefault(); setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0])}} className={`min-h-56 w-full flex-col rounded-xl border-dashed p-6 ${dragging ? "border-blue-400 bg-blue-500/10" : "bg-black/20"}`}>
                        {preview ? <img src={preview} alt="Avatar preview" className="h-36 w-36 rounded-full object-cover shadow-xl" /> : <><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400"><FaCloudArrowUp className="h-6 w-6" /></span><span className="font-medium text-zinc-200">Drop your image here</span><span className="mt-1 text-xs text-zinc-500">or click to choose from your computer</span></>}
                    </HoverDiv>
                    <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => choose(e.target.files?.[0])} />
                    <div className="flex justify-end gap-2"><HoverDiv type="INFO" onClick={close} disabled={uploading} className="rounded-lg px-4 py-2 text-sm">Cancel</HoverDiv><HoverDiv type="SAVE" icon={<FaCloudArrowUp/>} onClick={upload} disabled={!file || uploading} className="rounded-lg px-4 py-2 text-sm font-semibold">{uploading ? "Uploading…" : "Save picture"}</HoverDiv></div>
                </div>
            </div>
        </div>}
    </>;
}
