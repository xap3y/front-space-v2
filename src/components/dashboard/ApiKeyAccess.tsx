"use client";

import {ReactNode, useState} from "react";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {FiKey, FiArrowRight} from "react-icons/fi";
import {getApiUrl} from "@/lib/core";

export async function dashboardRequest<T>(key: string, path: string, signal?: AbortSignal, method = "GET", body?: unknown): Promise<T> {
    const response = await fetch(getApiUrl() + path, {
        method,
        headers: {"X-API-Key": key, Accept: "application/json", "Content-Type": "application/json"},
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.error) {
        throw new Error(typeof payload?.message === "string" ? payload.message : `Request failed (${response.status})`);
    }
    return payload.message as T;
}

export function displayDate(value?: string | null) {
    if (!value || value === "never") return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function RowsLoading() {
    return (
        <div className="divide-y divide-zinc-800 animate-pulse">
            {Array.from({length: 6}, (_, index) => (
                <div key={index} className="flex gap-8 px-4 py-5">
                    <div className="h-3 w-36 bg-zinc-800"/>
                    <div className="h-3 flex-1 bg-zinc-800/60"/>
                    <div className="h-3 w-20 bg-zinc-800"/>
                </div>
            ))}
        </div>
    );
}

export default function ApiKeyAccess({title, description, statusPath, children}: {
    title: string;
    description: string;
    statusPath: string;
    children: (key: string, logout: () => void) => ReactNode;
}) {
    const [key, setKey] = useState("");
    const [authenticatedKey, setAuthenticatedKey] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const login = async () => {
        if (!key.trim() || busy) return;
        setBusy(true);
        setError("");
        try {
            await dashboardRequest(key.trim(), statusPath);
            setAuthenticatedKey(key.trim());
            setKey("");
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Could not connect");
        } finally {
            setBusy(false);
        }
    };

    if (authenticatedKey) return children(authenticatedKey, () => setAuthenticatedKey(""));

    return (
        <main className="mx-auto max-w-md px-5 pb-16 pt-24 sm:pt-32">
            <div className="mb-8 border-b border-zinc-800 pb-5">
                <p className="mb-3 text-xs text-zinc-500">SPACE / ACCESS</p>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
            </div>
            <label className="mb-2 block text-xs text-zinc-400">API key</label>
            <MainStringInput
                type="password"
                value={key}
                onChange={setKey}
                onKeyDown={event => event.key === "Enter" && void login()}
                placeholder="Enter your dedicated API key"
                autoComplete="off"
                disabled={busy}
                className="bg-zinc-950"
            />
            {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
            <HoverDiv type="INFO" icon={busy ? <FiKey/> : <FiArrowRight/>} disabled={busy || !key.trim()}
                      onClick={() => void login()} className="mt-4 w-full px-4 py-3 text-sm">
                {busy ? "Checking key…" : "Open dashboard"}
            </HoverDiv>
            <p className="mt-4 text-xs leading-5 text-zinc-600">Your key stays in memory for this visit. Reloading or signing out clears it.</p>
        </main>
    );
}
