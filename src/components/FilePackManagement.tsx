"use client";

import Pagination from "@/components/ui/Pagination";

import {useEffect, useState} from "react";
import {FaEye, FaKey} from "react-icons/fa6";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv, {DeleteButton, SaveButton} from "@/components/HoverDiv";
import {getApiUrl} from "@/lib/core";
import {errorToast, okToast} from "@/lib/client";

interface ViewLog {
    id: number;
    time: string;
    viewer: {uid: number; username: string; avatar?: string} | null;
    ip?: string;
    userAgent?: string;
}

interface Props {
    packId: string;
    apiKey?: string;
    protectedPack: boolean;
    admin?: boolean;
    onUpdate: () => void;
}

export default function FilePackManagement({packId, apiKey, protectedPack, admin = false, onUpdate}: Props) {
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [logsOpen, setLogsOpen] = useState(false);
    const [logs, setLogs] = useState<ViewLog[]>([]);
    const [page, setPage] = useState(0);
    const [pages, setPages] = useState(1);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(false);

    const request = async (suffix: string, options?: RequestInit) => {
        const response = await fetch(`${getApiUrl()}/v1/files/packs/${packId}/${suffix}`, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? {"X-API-Key": apiKey} : {})
            }
        });
        const body = await response.json();
        if (!response.ok || body.error) {
            throw new Error(body.message || "Request failed");
        }
        return body.message;
    };

    const save = async (value: string) => {
        setBusy(true);
        try {
            await request("password", {method: "PUT", body: JSON.stringify({password: value})});
            setPassword("");
            setPasswordOpen(false);
            okToast(value ? "Pack password saved" : "Pack password removed");
            onUpdate();
        } catch (error: any) {
            errorToast(error.message);
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        if (!logsOpen) {
            return;
        }
        let active = true;
        setLoading(true);
        request(`views${admin ? "/admin" : ""}?page=${page}`)
            .then(result => {
                if (active) {
                    setLogs(result.content);
                    setPages(Math.max(1, result.totalPages));
                }
            })
            .catch(error => errorToast(error.message))
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [logsOpen, page, packId, apiKey, admin]);

    return (
        <div className="my-2 space-y-2 text-xs">
            <div className="flex gap-2">
                <HoverDiv type="INFO" className="px-2 py-1" icon={<FaKey />} onClick={() => setPasswordOpen(!passwordOpen)}>
                    {protectedPack ? "Change password" : "Set password"}
                </HoverDiv>
                <HoverDiv type="INFO" className="px-2 py-1" icon={<FaEye />} onClick={() => setLogsOpen(!logsOpen)}>
                    View history
                </HoverDiv>
            </div>
            {passwordOpen && (
                <div className="flex flex-wrap items-center gap-2">
                    <MainStringInput type="password" value={password} onChange={setPassword} placeholder="New pack password" className="w-52" />
                    <SaveButton className="px-2 py-1" disabled={busy || !password} onClick={() => save(password)}>Save</SaveButton>
                    {protectedPack && (
                        <DeleteButton className="px-2 py-1" disabled={busy} onClick={() => save("")}>Remove password</DeleteButton>
                    )}
                </div>
            )}
            {logsOpen && (
                <div className="space-y-2 rounded border border-zinc-800 p-2">
                    {loading ? <p className="animate-pulse text-zinc-500">Loading views…</p> : logs.length === 0 ? <p className="text-zinc-500">No views recorded yet.</p> : logs.map(log => (
                        <div key={log.id} className="flex flex-wrap items-center gap-2 border-b border-zinc-800/50 pb-1">
                            {log.viewer && (
                                log.viewer.avatar ? (
                                    <img src={log.viewer.avatar} alt="" className="h-5 w-5 rounded-full" />
                                ) : (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px]">
                                        {log.viewer.username.slice(0, 2).toUpperCase()}
                                    </span>
                                )
                            )}
                            <span>{log.viewer?.username ?? "Anonymous"}</span>
                            <time className="text-zinc-500">{new Date(log.time).toLocaleString()}</time>
                            {log.ip && <span className="break-all text-zinc-400">IP: {log.ip}</span>}
                            {log.userAgent && <span className="break-all text-zinc-400">UA: {log.userAgent}</span>}
                        </div>
                    ))}
                    <Pagination
                        page={page + 1}
                        pages={pages}
                        disabled={loading}
                        onChange={(nextPage) => setPage(nextPage - 1)}
                    />
                </div>
            )}
        </div>
    );
}
