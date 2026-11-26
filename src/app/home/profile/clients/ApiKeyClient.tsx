"use client";

import HoverDiv from "@/components/HoverDiv";

import { useState } from "react";
import { FaDownload, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { getUser } from "@/lib/auth";
import { okToast, errorToast } from "@/lib/client";
import type { UserInvitor } from "@/types/user";

type Props = {
    apiKey: string;
    createdAt: string;
    invitor: UserInvitor | null | undefined;
    storageUsed: number;
}

const shareXTemplates = [
    {filename: "space-img.sxcu", label: "Images"},
    {filename: "space-text.sxcu", label: "Pastes"},
    {filename: "space-url.sxcu", label: "Short URLs"},
];

export default function ApiKeyClient({ apiKey, createdAt, invitor, storageUsed }: Props) {
    const [shown, setShown] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const masked = "*".repeat(apiKey.length);

    const copy = () => {
        if (!shown) return;
        navigator.clipboard.writeText(apiKey);
        okToast("Copied");
    };

    const downloadShareX = async (filename: string) => {
        setDownloading(filename);
        try {
            const [user, response] = await Promise.all([
                getUser(),
                fetch(`/static/${filename}`, {credentials: "omit"}),
            ]);
            if (!user?.apiKey) {
                errorToast("Sign in again to download a ShareX configuration");
                return;
            }
            if (!response.ok) {
                throw new Error("ShareX template unavailable");
            }

            const template = await response.json() as {Headers?: Record<string, string>};
            const configuration = {
                ...template,
                Headers: {...template.Headers, "X-API-Key": user.apiKey},
            };
            const file = new Blob([JSON.stringify(configuration, null, 2)], {type: "application/json"});
            const url = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            errorToast("Could not download the ShareX configuration");
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm md:text-base font-semibold">API Key</p>
                <div className="flex items-center gap-3">
                    <b
                        className={`${shown ? "cursor-pointer text-sky-400" : "select-none"} truncate max-w-[160px] sm:max-w-[240px]`}
                        onClick={copy}
                        title={shown ? apiKey : masked}
                    >
                        {shown ? apiKey : masked}
                    </b>
                    <HoverDiv
                        type="INFO"
                        className="h-8 w-8 rounded-md p-0"
                        onClick={() => setShown((s) => !s)}
                    >
                        {shown ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </HoverDiv>
                </div>
            </div>

            <div className="space-y-2 rounded-md border border-zinc-800 p-3">
                <p className="text-sm font-semibold">ShareX downloads</p>
                <div className="flex flex-wrap gap-2">
                    {shareXTemplates.map(({filename, label}) => (
                        <HoverDiv
                            key={filename}
                            type="INFO"
                            className="h-8 px-2.5 text-xs"
                            aria-label={`Download ShareX configuration for ${label.toLowerCase()}`}
                            aria-busy={downloading === filename}
                            disabled={downloading !== null}
                            icon={downloading === filename
                                ? <FaSpinner className="motion-safe:animate-spin" aria-hidden="true" />
                                : <FaDownload aria-hidden="true" />}
                            onClick={() => void downloadShareX(filename)}
                        >
                            {label}
                        </HoverDiv>
                    ))}
                </div>
                <p className="text-xs text-zinc-500">Each .sxcu file includes your API key.</p>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm md:text-base font-semibold">Joined</p>
                <p className="text-sm md:text-base">{new Date(createdAt).toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm md:text-base font-semibold">Invited by</p>
                <p className="text-sm md:text-base">{invitor?.username ?? "N/A"}</p>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm md:text-base font-semibold">Storage used</p>
                <p className="text-sm md:text-base">{Math.round(storageUsed / 1024 / 1024)} MB</p>
            </div>
        </div>
    );
}
