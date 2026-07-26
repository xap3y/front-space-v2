/**
 * useActiveClientSocket
 *
 * Opens a persistent WebSocket connection to /ws/active on the backend.
 * Sends the auth token (if logged in) and current page, so the admin
 * dashboard can see all live browser sessions.
 *
 * Handles:
 *  - reconnection with exponential back-off
 *  - page-change heartbeats (call `reportPage(path)` on route changes)
 *  - server-pushed commands: toast, redirect, close, logout
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getApiUrl } from "@/lib/core";

function buildWsUrl(apiUrl: string, token: string | null, page: string): string {
    // Convert http(s):// → ws(s)://
    const base = apiUrl.replace(/^http/, "ws");
    const params = new URLSearchParams({ page });
    if (token) params.set("token", token);
    return `${base}/ws/active?${params.toString()}`;
}

export function useActiveClientSocket(token: string | null, initialPage: string) {
    const router = useRouter();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectDelay = useRef(1000);
    const unmountedRef = useRef(false);
    const currentPage = useRef(initialPage);

    const connect = useCallback(() => {
        if (unmountedRef.current) return;

        const apiUrl = getApiUrl();
        const url = buildWsUrl(apiUrl, token, currentPage.current);

        let ws: WebSocket;
        try {
            ws = new WebSocket(url);
        } catch {
            return;
        }

        wsRef.current = ws;

        ws.onopen = () => {
            reconnectDelay.current = 1000; // reset back-off
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data) as Record<string, unknown>;
                const type = msg.type as string;

                if (type === "toast") {
                    const toastType = (msg.toastType as string) || "info";
                    const pos = (msg.position as any) || "top-right";
                    const message = msg.message as string ?? "Message from admin";

                    if (toastType === "success") toast.success(message, { position: pos, autoClose: 6000 });
                    else if (toastType === "error") toast.error(message, { position: pos, autoClose: 6000 });
                    else if (toastType === "warning") toast.warning(message, { position: pos, autoClose: 6000 });
                    else toast.info(message, { position: pos, autoClose: 6000 });
                } else if (type === "redirect") {
                    const route = msg.route as string;
                    if (route) router.push(route);
                } else if (type === "logout") {
                    // Clear cookies and hard-redirect to login
                    document.cookie = "auth_token=; Max-Age=0; path=/";
                    document.cookie = "session_token=; Max-Age=0; path=/";
                    toast.warning("You have been logged out by an administrator.", {
                        position: "bottom-right",
                        autoClose: 5000,
                    });
                    setTimeout(() => window.location.href = "/login", 1200);
                } else if (type === "close") {
                    ws.close();
                    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;flex-direction:column;gap:20px;"><h1>Connection Closed by Administrator</h1><p>You have been disconnected.</p></div>';
                }
            } catch {
                // ignore unparseable messages
            }
        };

        ws.onclose = () => {
            if (unmountedRef.current) return;
            // Exponential back-off reconnect (max 30s)
            const delay = reconnectDelay.current;
            reconnectDelay.current = Math.min(delay * 2, 30000);
            setTimeout(connect, delay);
        };

        ws.onerror = () => {
            ws.close();
        };
    }, [token, router]);

    useEffect(() => {
        unmountedRef.current = false;
        connect();
        return () => {
            unmountedRef.current = true;
            wsRef.current?.close();
        };
    }, [connect]);

    /** Call this whenever the Next.js route changes */
    const reportPage = useCallback((page: string) => {
        currentPage.current = page;
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "pageUpdate", page }));
        }
    }, []);

    return { reportPage };
}
