"use client";

import {useCallback, useEffect, useState} from "react";
import {FaPlus, FaRotateRight} from "react-icons/fa6";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv, {DeleteButton} from "@/components/HoverDiv";
import {getApiUrl} from "@/lib/core";
import {errorToast, okToast} from "@/lib/client";

type Rule = {id: number; address: string};

async function request<T>(path = "", options?: RequestInit): Promise<T> {
    const response = await fetch(getApiUrl() + "/v1/admin/settings/ip-mapper" + path, {
        ...options,
        credentials: "include",
        cache: "no-store",
        headers: {Accept: "application/json", "Content-Type": "application/json"},
    });
    const body = await response.json();
    if (!response.ok || body.error) {
        throw new Error(body.message || "IP mapper request failed");
    }
    return body.message as T;
}

export default function IpMapperSettings() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            setRules(await request<Rule[]>());
            setError("");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load IP rules");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const mutate = async (rule?: Rule) => {
        if (rule && !window.confirm(`Stop masking ${rule.address}?`)) {
            return;
        }
        setBusy(true);
        try {
            await request(rule ? `/${rule.id}` : "", {
                method: rule ? "DELETE" : "POST",
                ...(rule ? {} : {body: JSON.stringify({address: address.trim()})}),
            });
            if (!rule) {
                setAddress("");
            }
            await reload();
            okToast(rule ? "IP masking removed" : "IP address will now appear as ****");
        } catch (error) {
            errorToast(error instanceof Error ? error.message : "Failed to save IP rule");
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="box-primary space-y-3 p-3 md:p-4">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold">IP mapper</h2>
                    <p className="mt-1 text-[11px] text-zinc-500">
                        Listed IPv4 / IPv6 addresses appear as <code>****</code> in histories, sessions and API metadata,
                        even for OWNER. Original records remain unchanged. Only this settings list shows the actual addresses.
                    </p>
                </div>
                <HoverDiv
                    type="INFO"
                    icon={<FaRotateRight />}
                    onClick={reload}
                    disabled={loading || busy}
                    aria-label="Refresh IP rules"
                    className="h-7 w-7 shrink-0 text-[10px]"
                />
            </header>
            <form
                className="flex max-w-lg gap-2"
                onSubmit={event => {
                    event.preventDefault();
                    if (!busy && address.trim()) {
                        void mutate();
                    }
                }}
            >
                <MainStringInput
                    value={address}
                    onChange={setAddress}
                    placeholder="IPv4 or IPv6 address"
                    aria-label="IP address to mask"
                    maxLength={45}
                    className="min-w-0 flex-1"
                    inputClassName="px-2.5 py-1.5 text-xs"
                />
                <HoverDiv
                    type="SAVE"
                    icon={<FaPlus />}
                    disabled={busy || loading || !address.trim()}
                    onClick={() => mutate()}
                    className="px-2.5 py-1 text-xs"
                >
                    Add IP
                </HoverDiv>
            </form>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            {loading ? (
                <div className="h-9 animate-pulse rounded-md bg-white/5" />
            ) : rules.length ? (
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {rules.map(rule => (
                        <div key={rule.id} className="flex min-w-0 items-center gap-2 rounded-md border border-zinc-800 px-2 py-1.5">
                            <code className="min-w-0 flex-1 truncate text-[11px] text-zinc-400" title={rule.address}>{rule.address}</code>
                            <span className="text-[10px] text-zinc-600">→ ****</span>
                            <DeleteButton
                                disabled={busy}
                                onClick={() => mutate(rule)}
                                aria-label={`Remove masking for ${rule.address}`}
                                className="h-6 w-6 shrink-0 text-[10px]"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[11px] text-zinc-600">No IP addresses are masked.</p>
            )}
            <p className="text-[10px] text-zinc-600">Applies to new API responses, including old log entries. Refresh already-open pages after changes.</p>
        </section>
    );
}
