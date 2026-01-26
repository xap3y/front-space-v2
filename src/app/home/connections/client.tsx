"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaDiscord, FaLink, FaRotateRight } from "react-icons/fa6";
import { TelegramConnection } from "@/types/telegram";
import { DiscordConnection } from "@/types/discord";
import { FaRegTrashAlt, FaTelegramPlane } from "react-icons/fa";
import { getApiUrl } from "@/lib/core";
import {useCurrentUrl} from "@/hooks/useCurrentUrl";
import {usePathname, useSearchParams} from "next/navigation";

export default function ConnectionsClient() {
    const [loading, setLoading] = useState(true);
    const [telegram, setTelegram] = useState<TelegramConnection | null>(null);
    const [discord, setDiscord] = useState<DiscordConnection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRevoking, setIsRevoking] = useState<{ telegram: boolean; discord: boolean }>({
        telegram: false,
        discord: false,
    });
    const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
    const [fullUrl, setFullUrl] = useState("");

    const pathname = usePathname();
    const searchParams = useSearchParams();

    const fetchConnections = async () => {
        try {
            setError(null);
            setLoading(true);
            const [tgRes, dcRes] = await Promise.all([
                fetch(getApiUrl() + "/v1/telegram/@me", { credentials: "include" }),
                fetch(getApiUrl() + "/v1/discord/get/@me", { credentials: "include" }),
            ]);

            if (tgRes.ok) {
                const tgJson = await tgRes.json();
                setTelegram(tgJson.message);
            } else {
                setTelegram(null);
            }

            if (dcRes.ok) {
                const dcJson = await dcRes.json();
                setDiscord(dcJson.message);
            } else {
                setDiscord(null);
            }
        } catch (err: any) {
            setError(err?.message ?? "Unable to load connections");
        } finally {
            setLoading(false);
        }
    };

    const revokeTelegram = async () => {
        if (isRevoking.telegram) return;
        setIsRevoking((s) => ({ ...s, telegram: true }));
        try {
            await fetch(getApiUrl() + "/v1/telegram/@me/revoke", { method: "GET", credentials: "include" });
            setTelegram(null);
        } catch (err: any) {
            setError(err?.message ?? "Failed to revoke Telegram");
        } finally {
            setIsRevoking((s) => ({ ...s, telegram: false }));
        }
    };

    const revokeDiscord = async () => {
        if (isRevoking.discord) return;
        setIsRevoking((s) => ({ ...s, discord: true }));
        try {
            await fetch(getApiUrl() + "/v1/discord/get/@me", { method: "DELETE", credentials: "include" });
            setDiscord(null);
        } catch (err: any) {
            setError(err?.message ?? "Failed to revoke Discord");
        } finally {
            setIsRevoking((s) => ({ ...s, discord: false }));
        }
    };

    const connectTelegram = async () => {
        if (isConnectingTelegram) return;
        setIsConnectingTelegram(true);
        setError(null);
        try {
            const res = await fetch(getApiUrl() + "/v1/telegram/connect/request?fallback=" + fullUrl, {
                method: "GET",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Failed to start Telegram connection");
            }

            const data = await res.json();
            const url = data?.message?.url as string | undefined;

            if (!url) {
                throw new Error("Invalid Telegram connect response");
            }

            window.location.href = url;
        } catch (err: any) {
            setError(err?.message ?? "Unable to start Telegram connection");
        } finally {
            setIsConnectingTelegram(false);
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = searchParams.toString();
        const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
        setFullUrl(url);
    }, [pathname, searchParams]);

    useEffect(() => {
        fetchConnections();
    }, []);

    return (
        <section className="flex max-w-7xl w-full">
            <div className="flex-1 min-w-0 px-0 sm:px-6 lg:px-10 py-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-white/60">Connections</p>
                        <h1 className="text-3xl font-semibold leading-tight">Manage linked accounts</h1>
                    </div>
                    <button
                        onClick={fetchConnections}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10 transition"
                    >
                        <FaRotateRight className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="box-primary p-4 mb-4 text-red-400 border border-red-400/40">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="box-primary p-5 animate-pulse space-y-3">
                                <div className="h-5 w-32 bg-white/10 rounded" />
                                <div className="h-10 w-24 bg-white/10 rounded" />
                                <div className="h-10 w-full bg-white/10 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Telegram */}
                        <div className="box-primary p-5 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-sky-500/20 p-2 text-sky-300">
                                    <FaTelegramPlane className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xl font-semibold">Telegram</p>
                                    <p className="text-sm text-white/60">Link your Telegram bot, you can upload images directly into chat to upload them</p>
                                </div>
                            </div>

                            {telegram ? (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center gap-4">
                                    {telegram.avatar ? (
                                        <img
                                            src={telegram.avatar}
                                            className="h-12 w-12 rounded-full bg-white/10"
                                            alt="Telegram avatar"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold uppercase">
                                            {(telegram.full_name ?? "T")[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-semibold truncate">
                                            @{telegram.user.username}
                                        </p>
                                        <p className="text-sm text-white/60">ID: {telegram.telegram_id}</p>
                                    </div>
                                    <button
                                        onClick={revokeTelegram}
                                        disabled={isRevoking.telegram}
                                        className="inline-flex items-center gap-2 rounded-md border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10 transition disabled:opacity-60"
                                    >
                                        <FaRegTrashAlt className="h-4 w-4" />
                                        <span className={"hidden sm:block"}>{isRevoking.telegram ? "Revoking..." : "Revoke"}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <p className="text-white/70 text-sm">
                                        You are not connected to Telegram yet. Start the bot to link your account.
                                    </p>
                                    <button
                                        onClick={connectTelegram}
                                        disabled={isConnectingTelegram}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500/80 px-4 py-3 text-sm font-semibold hover:bg-sky-500 transition disabled:opacity-60"
                                    >
                                        <FaLink className="h-4 w-4" />
                                        {isConnectingTelegram ? "Opening..." : "Connect via Telegram"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Discord */}
                        <div className="box-primary p-5 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-indigo-500/20 p-2 text-indigo-300">
                                    <FaDiscord className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xl font-semibold">Discord</p>
                                    <p className="text-sm text-white/60">Authorize Discord to sync your account</p>
                                </div>
                            </div>

                            {discord ? (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center gap-4">
                                    <img
                                        src={
                                            "https://cdn.discordapp.com/avatars/" +
                                            discord.discordId +
                                            "/" +
                                            discord.avatar +
                                            ".png"
                                        }
                                        className="h-12 w-12 rounded-full bg-white/10"
                                        alt="Discord avatar"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-semibold truncate">
                                            {discord.username}
                                        </p>
                                        <p className="text-sm text-white/60">ID: {discord.discordId}</p>
                                    </div>
                                    <button
                                        onClick={revokeDiscord}
                                        disabled={isRevoking.discord}
                                        className="inline-flex items-center gap-2 rounded-md border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10 transition disabled:opacity-60"
                                    >
                                        <FaRegTrashAlt className="h-4 w-4" />
                                        <span className={"hidden sm:block"}>{isRevoking.discord ? "Revoking..." : "Revoke"}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <p className="text-white/70 text-sm">
                                        Connect Discord to unlock integrations.
                                    </p>
                                    <Link
                                        href={process.env.NEXT_PUBLIC_DISCORD_REGISTER_URL ?? "#"}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500/80 px-4 py-3 text-sm font-semibold hover:bg-indigo-500 transition"
                                    >
                                        <FaLink className="h-4 w-4" />
                                        Connect Discord
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}