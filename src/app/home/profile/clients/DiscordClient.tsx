"use client";

import { FaDiscord } from "react-icons/fa";
import { FaLink, FaXmark } from "react-icons/fa6";
import { revokeUserDiscordConnection } from "@/lib/apiGetters";
import { okToast, errorToast } from "@/lib/client";
import { useState } from "react";
import {UserInvitor} from "@/types/user";
import {DiscordConnection} from "@/types/discord";

type Props = {
    discordConnection: DiscordConnection | null;
    fallbackHandle: string;
}

export default function DiscordClient({ discordConnection, fallbackHandle }: Props) {
    const [conn, setConn] = useState(discordConnection);

    const revoke = async () => {
        if (!conn) return;
        const res = await revokeUserDiscordConnection(conn.discordId);
        if (res) {
            setConn(null);
            okToast("Discord connection revoked", 1000);
        } else {
            errorToast("Cannot revoke discord connection", 1000);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <FaDiscord className="text-xl" />
                <p className="text-xl md:text-2xl font-bold">Discord</p>
            </div>

            {conn ? (
                <div className="flex items-center gap-3">
                    <img
                        src={`https://cdn.discordapp.com/avatars/${conn.discordId}/${conn.avatar}.png`}
                        className="rounded-full w-8 h-8 sm:w-10 sm:h-10 border border-white/20"
                    />
                    <div className="flex flex-col">
                        <span className="text-lg md:text-xl font-bold">{conn.username}</span>
                        <span className="text-[10px] text-gray-400">({conn.discordId})</span>
                    </div>
                    <FaXmark
                        onClick={revoke}
                        className="text-red-500 w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:scale-105 transition"
                    />
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <p className="text-lg md:text-xl text-gray-300">Not connected</p>
                    <a
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition"
                        href={fallbackHandle}
                    >
                        <FaLink className="text-xl" />
                    </a>
                </div>
            )}
        </div>
    );
}