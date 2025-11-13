"use client";

import { useEffect, useRef, useState } from "react";
import { ActiveVIP, Code, VIPPackage, WsEnvelope } from "@/types/playcore";
import { errorToast } from "@/lib/client";

export type Callback = () => void | Promise<void>;

type Props = {
    apiBaseUrl: string;
    uid: string;
    setCodes: React.Dispatch<React.SetStateAction<Code[]>>;
    setVipPackages: React.Dispatch<React.SetStateAction<VIPPackage[]>>;
    setActiveVips: React.Dispatch<React.SetStateAction<ActiveVIP[]>>;
    callBacks?: Record<string, Callback>;
    onError?: (message: string, payload?: unknown) => void;
};

type Status = "idle" | "connecting" | "open" | "closed" | "error";

function toWsUrl(httpUrl: string): string {
    try {
        const u = new URL(httpUrl);
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        return u.toString();
    } catch {
        return httpUrl.replace(/^http/i, "ws");
    }
}

export function usePCVRealtime({
                                   apiBaseUrl,
                                   uid,
                                   setCodes,
                                   setVipPackages,
                                   setActiveVips,
                                   callBacks,
                                   onError,
                               }: Props) {
    const [status, setStatus] = useState<Status>("idle");
    const [lastError, setLastError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const callbacksRef = useRef<Props["callBacks"] | undefined>(undefined);
    useEffect(() => {
        callbacksRef.current = callBacks;
    }, [callBacks]);

    const onErrorRef = useRef<Props["onError"] | undefined>(undefined);
    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const invokeCallbacksFor = (keys: string[]) => {
        if (!callbacksRef.current) return;
        const seen = new Set<string>();
        for (const k of keys) {
            if (!k || seen.has(k)) continue;
            seen.add(k);
            const cb = callbacksRef.current[k];
            if (typeof cb === "function") {
                try {
                    cb();
                } catch (e) {
                    console.error(`Callback for "${k}" threw an error:`, e);
                }
            }
        }
    };

    const connect = () => {
        if (!uid) return;
        setLastError(null);
        setStatus("connecting");

        const wsUrl = toWsUrl(`${apiBaseUrl}/ws/playcore/out?uniqueId=${uid}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setStatus("open");

        ws.onmessage = (ev) => {
            const triggerKeys: string[] = [];
            if (typeof ev.data === "string") triggerKeys.push(ev.data);

            try {
                const msg: WsEnvelope | string | Record<string, unknown> = JSON.parse(ev.data);

                if (typeof msg === "string") triggerKeys.push(msg);

                if (msg && typeof msg === "object") {
                    const t = (msg as any).type;
                    const e = (msg as any).event;
                    const m = (msg as any).message;
                    const c = (msg as any).content;
                    if (typeof t === "string") triggerKeys.push(t);
                    if (typeof e === "string") triggerKeys.push(e);
                    if (typeof m === "string") triggerKeys.push(m);
                    if (typeof c === "string") triggerKeys.push(c);
                }

                if (msg && typeof msg === "object" && "type" in msg) {
                    const typed = msg as WsEnvelope;

                    if (typed.type === "CODE") {
                        setCodes((prev) => {
                            const incoming = typed.data;
                            const byId = incoming.uniqueId;
                            let idx = -1;
                            if (byId) idx = prev.findIndex((c) => c.uniqueId === byId);
                            if (idx === -1) idx = prev.findIndex((c) => c.code === incoming.code);
                            if (idx !== -1) {
                                const updated = [...prev];
                                updated[idx] = { ...prev[idx], ...incoming };
                                return updated;
                            }
                            return [incoming, ...prev];
                        });
                    } else if (typed.type === "VIP") {
                        setVipPackages((prev) => {
                            const incoming = typed.data;
                            const idx = prev.findIndex((v) => v.name === incoming.name);
                            if (idx !== -1) {
                                const updated = [...prev];
                                updated[idx] = { ...prev[idx], ...incoming };
                                return updated;
                            }
                            return [incoming, ...prev];
                        });
                    } else if (typed.type === "ACTIVE_VIP") {
                        setActiveVips((prev) => {
                            const incoming = typed.data;
                            const idx = prev.findIndex(
                                (a) => a.playerUniqueId === incoming.playerUniqueId && a.packageName === incoming.packageName
                            );
                            if (idx !== -1) {
                                const updated = [...prev];
                                updated[idx] = { ...prev[idx], ...incoming };
                                return updated;
                            }
                            return [incoming, ...prev];
                        });
                    } else if (typed.type === "DELETE") {
                        const subtype = (typed as any).data?.type;
                        const u = (typed as any).data?.uniqueId;
                        if (subtype === "CODE") {
                            setCodes((prev) => prev.filter((c) => c.uniqueId !== u && c.code !== u));
                        } else if (subtype === "VIP") {
                            setVipPackages((prev) => prev.filter((v) => v.name !== u && v.group !== u));
                        } else if (subtype === "ACTIVE_VIP") {
                            setActiveVips((prev) => prev.filter((a) => a.playerUniqueId !== u && a.packageName !== u));
                        }
                    } else if (typed.type === "ERROR") {
                        const message =
                            (typed as any)?.data?.message ??
                            (typed as any)?.message ??
                            "Unknown error";
                        if (onErrorRef.current) onErrorRef.current(String(message), typed);
                        else errorToast(String(message));
                        triggerKeys.push("ERROR");
                    }
                }
            } catch {
                // ignore malformed frames
            }

            invokeCallbacksFor(triggerKeys);
        };

        ws.onerror = () => {
            setStatus("error");
            setLastError("WebSocket error");
            onErrorRef.current?.("WebSocket error");
        };

        ws.onclose = () => setStatus("closed");
    };

    const reconnect = () => {
        try {
            wsRef.current?.close();
        } catch {}
        connect();
    };

    const close = () => {
        try {
            wsRef.current?.close();
        } catch {}
    };

    useEffect(() => {
        connect();
        return () => {
            try {
                wsRef.current?.close();
            } catch {}
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBaseUrl, uid]);

    return {
        status,
        isOpen: status === "open",
        lastError,
        reconnect,
        close,
    };
}