"use client";

import React, { useEffect, useState } from "react";
import { useTempMail } from "@/hooks/useTempMail";
import { EmailStream } from "@/components/EmailStream";
import { infoToast, okToast } from "@/lib/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/hooks/useUser";
import { LoadingDot } from "@/components/GlobalComponents";
import './scroll.css'
import { useIsMobile } from "@/hooks/utils";
import { MdContentCopy, MdRefresh, MdAdd } from "react-icons/md";

interface Props {
    maxWidth?: number;
}

export default function EmailPage({ maxWidth }: Props) {

    const { user, loadingUser } = useUser();
    const [apiKey, setApiKey] = useState('');
    const [creating, setCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { tempMail, createTempMail, refetchTempMailInfo, loadFromLocalStorage, setExistingTempMail } = useTempMail();
    const [wsForceRefreshId, setWsForceRefreshId] = useState(0);
    const [reloadFlag, setReloadFlag] = useState(0);

    const isMobile = useIsMobile();
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
        if (!tempMail) return;
        if (isRefreshing) return;
        setIsRefreshing(true);
        refetchTempMailInfo(tempMail.email).then(() => {
            infoToast("Refreshed");
            setIsRefreshing(false);
            setWsForceRefreshId(v => v + 1);
            setReloadFlag(v => v + 1);
        }).catch(() => {
            setIsRefreshing(false);
        });
    }

    function handleCopy() {
        navigator.clipboard.writeText(tempMail?.email || "");
        setCopied(true);
        infoToast(lang.toasts.success.copied_to_clipboard)
        setTimeout(() => setCopied(false), 2000);
    }

    useEffect(() => {
        if (user) {
            setApiKey(user.apiKey)
            loadFromLocalStorage().then((value) => {
                if (value) {
                    setExistingTempMail(value)
                }
            })
        }
    }, [user, loadingUser])

    if (loadingUser) return <></>

    const MAX_WIDTH = maxWidth ?? 1920;

    const isExpired = tempMail?.expireAt ? new Date(tempMail.expireAt) < new Date() : false;
    const isSuspended = tempMail?.status == "SUSPENDED";

    return (
        <>
            <div
                className={`w-full xl:h-auto bg-card box-primary shadow-xl flex flex-col gap-6`}
                style={{ maxWidth: MAX_WIDTH }}
            >
                <div className={`p-4 sm:p-6`}>
                    <h1 className="text-3xl tracking-tight select-none text-center font-bold">Temp Mail</h1>
                    {isMobile && (
                        <div className={"flex items-center justify-center my-4 gap-4"}>
                            <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                            <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                            <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                            <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                            <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                            <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-primary-brighter bg-primary-brighter"} />
                        </div>
                    )}
                    {tempMail && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center gap-2.5 group">
                                        <span className={`font-mono text-xl xl:text-2xl font-bold leading-tight ${isSuspended ? "text-red-600 line-through" : "text-white"} break-all select-all`}>
                                            {tempMail.email}
                                        </span>
                                        <button
                                            onClick={handleCopy}
                                            disabled={isRefreshing || isDeleting}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all opacity-50 group-hover:opacity-100"
                                            title="Copy email address"
                                            aria-label="Copy email address"
                                        >
                                            <MdContentCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Expires: <span className={`${isExpired ? "text-red-500" : "text-gray-400"}`}>
                                            {tempMail.expireAt ? new Date(tempMail.expireAt).toLocaleString() : 'never'}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex gap-2 flex-wrap xl:justify-end">
                                    <button
                                        onClick={handleRefresh}
                                        data-tooltip-id="my-tooltip"
                                        data-tooltip-content={isExpired ? 'Email is expired, create new one!' : 'Reconnect to receive new emails'}
                                        disabled={isRefreshing || isDeleting || isExpired}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                            isExpired
                                                ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                                                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-gray-200'
                                        }`}
                                    >
                                        <MdRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Reconnect
                                    </button>
                                    <button
                                        disabled={isRefreshing || isDeleting}
                                        onClick={handleReset}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-400/30 hover:text-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MdAdd className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
                                        New Address
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {tempMail && (
                    <EmailStream
                        email={tempMail}
                        apiKey={apiKey}
                        forceId={wsForceRefreshId}
                        disconnectBo={isRefreshing}
                        isExpired={isExpired}
                        refetchCallback={handleRefresh}
                    />
                )}

                {!tempMail && (
                    <div className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                        <div>
                            <label className="text-xs font-medium block mb-2 uppercase tracking-wide text-gray-300">
                                API Key
                            </label>
                            <input
                                type="password"
                                disabled={user != null}
                                className="w-full rounded-md bg-white/2.5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-colors"
                                placeholder="Paste API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        <button
                            onClick={handleCreate}
                            disabled={!apiKey || creating}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium py-2.5 rounded-md text-white transition-colors shadow-sm"
                        >
                            {creating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoadingDot size={"w-4"} />
                                    Creating...
                                </span>
                            ) : (
                                'Create Temp Email'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}