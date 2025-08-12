"use client";

import React, {useEffect, useState, useTransition} from "react";
import {TempMail, useTempMail} from "@/hooks/useTempMail";
import {EmailStream} from "@/components/EmailStream";
import {okToast} from "@/lib/client";
import {useTranslation} from "@/hooks/useTranslation";
import {FaRegCopy} from "react-icons/fa";
import {useUser} from "@/hooks/useUser";
import {LoadingDot} from "@/components/GlobalComponents";

interface Props {
    maxWidth?: number;
}

export default function EmailPage({maxWidth} : Props) {

    const { user, loadingUser } = useUser();
    const [apiKey, setApiKey] = useState('');
    const [creating, setCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { tempMail, createTempMail, resetTempMail, loadFromLocalStorage, setExistingTempMail } = useTempMail();
    const [wsForceRefreshId, setWsForceRefreshId] = useState(0); // bump to re-open socket
    const [reloadFlag, setReloadFlag] = useState(0);

    const lang = useTranslation()

    async function handleCreate() {
        setError(null);
        setCreating(true);
        try {
            await createTempMail(apiKey);
        } catch (e: any) {
            setError(e?.message || 'Failed to create.');
        } finally {
            setCreating(false);
        }
    }

    function handleReset() {
        setIsDeleting(true)
        setTimeout(() => {
            handleCreate().then(() => {
                setIsDeleting(false);
            })
        }, 200);
    }

    function handleRefresh() {
        // Clears current messages & reconnect
        // disconnects the WebSocket and forces a refresh
        if (!tempMail) return;
        if (isRefreshing) return;
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setWsForceRefreshId(v => v + 1);
            setReloadFlag(v => v + 1);
        }, 300);
    }

    useEffect(() => {
        if (user) {
            setApiKey(user.apiKey)
            const temp: TempMail | null = loadFromLocalStorage()
            if (temp) {
                setExistingTempMail(temp)
            }
        }
    }, [user, loadingUser])

    if (loadingUser) return <></>

    const MAX_WIDTH = maxWidth ?? 1024;

    return (
        <>
            <div
                className={`w-full h-auto bg-card border border-white/10 rounded-lg p-6 shadow-xl flex flex-col gap-6`}
                style={{ maxWidth: MAX_WIDTH }}
            >
                <h1 className="text-xl font-semibold tracking-tight">Temp Mail</h1>

                {!tempMail && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium block mb-1 uppercase tracking-wide text-gray-300">
                                API Key
                            </label>
                            <input
                                type="password"
                                disabled={user != null}
                                className="w-full rounded-md bg-[#1f1f23] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-telegram/40 placeholder-gray-500"
                                placeholder="Paste API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        <button
                            onClick={handleCreate}
                            disabled={!apiKey || creating}
                            className="w-full bg-telegram hover:bg-telegram-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium py-2.5 rounded-md transition-colors shadow-sm"
                        >
                            {creating ? 'Creating...' : 'Create Temp Email'}
                        </button>
                    </div>
                )}

                {tempMail && (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2 w-full">
                                <div className="flex items-center gap-3">
                <span className="font-mono text-xl md:text-2xl font-bold leading-tight text-white break-all select-all">
                  {tempMail.email}
                </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(tempMail.email)
                                            okToast(lang.toasts.success.copied_to_clipboard)
                                        }}
                                        disabled={isRefreshing || isDeleting}
                                        className="mt-1 inline-flex items-center justify-center h-8 w-8 rounded-md border border-white/15 bg-[#1f1f23] hover:bg-[#242428] text-gray-300 hover:text-white transition-colors"
                                        title="Copy email"
                                        aria-label="Copy email"
                                    >
                                        <FaRegCopy className="h-4 w-4 pb-1" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    Expires: <span className="text-gray-300">{tempMail.expireAt ? new Date(tempMail.expireAt).toLocaleString() : 'never'}</span>
                                </p>
                            </div>

                            <div className="flex gap-2 flex-wrap md:justify-end">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isDeleting}
                                    className="flex items-center text-xs bg-[#1f1f23] hover:bg-[#242428] border border-white/10 px-3 py-1.5 rounded-md transition-colors text-gray-200"
                                >
                                    Reconnect
                                    {isRefreshing &&
                                        <LoadingDot size={"w-3"} />
                                    }
                                </button>
                                <button
                                    disabled={isRefreshing || isDeleting}
                                    onClick={handleReset}
                                    className="flex items-center text-xs bg-telegram hover:bg-telegram-hover text-white px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors"
                                >
                                    New Address
                                    {isDeleting &&
                                        <LoadingDot size={"w-4 text-white"} />
                                    }
                                </button>
                            </div>
                        </div>

                        <EmailStream
                            email={tempMail.email}
                            apiKey={apiKey}
                            forceId={wsForceRefreshId}
                            disconnectBo={isRefreshing}
                        />
                    </div>
                )}
            </div>
        </>
    )
}