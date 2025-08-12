'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

interface RawWsMessage {
    from?: string;
    subject?: string;
    text?: string;
    content?: string;
    html?: string;
    to?: string;
    date?: string;
    // ... any other fields your server sends
}

export interface InboxMessage {
    id: string;        // local stable id
    from: string;
    subject: string;
    text?: string;
    content?: string;
    html?: string;
    to?: string;
    date?: string;
    _receivedTs: number;
    _fp: string;       // fingerprint for dedupe
}

const MAX_MESSAGES = 30;

function storageKey(email: string) {
    return `tm_inbox_${email.toLowerCase()}`;
}

export function clearInboxStorage(email: string) {
    try {
        localStorage.removeItem(storageKey(email));
    } catch {
        /* ignore */
    }
}

export function useEmailWebSocket(email: string, apiKey: string, forceId: number) {
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!email) return;
        try {
            const raw = localStorage.getItem(storageKey(email));
            if (raw) {
                const parsed: InboxMessage[] = JSON.parse(raw);
                setMessages(parsed);
            } else {
                setMessages([]);
            }
        } catch {
            setMessages([]);
        }
    }, [email, forceId]);

    const persist = useCallback((msgs: InboxMessage[]) => {
        try {
            localStorage.setItem(storageKey(email), JSON.stringify(msgs));
        } catch {
            // Could log quota errors
        }
    }, [email]);

    useEffect(() => {

        console.log("CALLED " + email + " " + apiKey + " " + forceId);

        if (!email || !apiKey) return;
        console.log("ENDED")

        /*const base = process.env.NEXT_PUBLIC_WS_BASE_URL ||
            (typeof window !== 'undefined'
                ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
                : '');*/


        const base = process.env.NEXT_PUBLIC_EMAIL_WEBSOCKET_URL
        const url = `${base}?email=${encodeURIComponent(email)}&apiKey=${encodeURIComponent(apiKey)}`;

        console.log('Connecting to WS:', url);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);
        ws.onmessage = (ev) => {
            try {
                const raw: RawWsMessage = JSON.parse(ev.data);

                // Build a fingerprint to prevent duplicates if server resends
                const fpParts = [
                    raw.from || '',
                    raw.subject || '',
                    raw.date || '',
                    (raw.text || raw.content || raw.html || '').slice(0, 40)
                ];
                const fingerprint = fpParts.join('|');

                setMessages(prev => {
                    if (prev.some(m => m._fp === fingerprint)) {
                        return prev;
                    }
                    const newMsg: InboxMessage = {
                        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
                        from: raw.from || '(unknown)',
                        subject: raw.subject || '(no subject)',
                        text: raw.text || raw.content,
                        content: raw.content,
                        html: raw.html,
                        to: raw.to,
                        date: raw.date,
                        _receivedTs: Date.now(),
                        _fp: fingerprint
                    };
                    const updated = [newMsg, ...prev].slice(0, MAX_MESSAGES);
                    persist(updated);
                    return updated;
                });
            } catch (e) {
                console.error('Invalid WS message', e);
            }
        };

        return () => {
            ws.close();
        };
    }, [email, apiKey, forceId, persist]);

    function disconnect() {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }

    return { messages, connected, disconnect, clear: () => clearInboxStorage(email) };
}