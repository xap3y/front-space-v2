"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { okToast, errorToast } from "@/lib/client";
import {UserInvitor} from "@/types/user";

type Props = {
    apiKey: string;
    createdAt: string;
    invitor: UserInvitor | null | undefined;
    storageUsed: number;
}

export default function ApiKeyClient({ apiKey, createdAt, invitor, storageUsed }: Props) {
    const [shown, setShown] = useState(false);
    const masked = "*".repeat(apiKey.length);

    const copy = () => {
        if (!shown) return;
        navigator.clipboard.writeText(apiKey);
        okToast("Copied");
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
                    <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition"
                        onClick={() => setShown((s) => !s)}
                    >
                        {shown ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </button>
                </div>
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