'use client';

import { getApiUrl } from '@/lib/core';
import {useCallback, useEffect, useRef, useState} from 'react';

interface RawWsMessage {
    messageId?: string;
    from?: string;
    subject?: string;
    text?: string;
    content?: string;
    html?: string;
    to?: string;
    date?: string;
}

export interface InboxMessage {
    id: string;
    serverId?: string;
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

        ws.onopen = () => {
            setConnected(true)
            console.log('WebSocket connected');
            console.log("MESSAGES IDS: " + getMessagesId())

            let ids = getMessagesId();
            if (ids == null || ids.length === 0) {
                ids = ['']
            }

            fetch(getApiUrl() + `/v1/email/getmissing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({ mail: email, messageIds: ids })
            }).then(async (res) => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch missing messages: ${res.statusText}`);
                }

                try {
                    const response = await res.json();
                    console.log('Missing messages response:', response);

                    // check if response is an array
                    if (Array.isArray(response)) {
                        response.forEach((msg: RawWsMessage) => {
                            pushNewMessage(msg);
                        });
                    } else {
                        console.warn('Unexpected response format:', response);
                    }
                } catch (e) {
                    // IGNORE
                }
            })
        };
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);
        ws.onmessage = (ev) => {
            try {
                const raw: RawWsMessage = JSON.parse(ev.data);
                pushNewMessage(raw);
            } catch (e) {
                console.error('Invalid WS message', e);
            }
        };

        return () => {
            ws.close();
        };
    }, [email, apiKey, forceId, persist]);

    const pushNewMessage = useCallback((raw: RawWsMessage) => {
        if (raw.messageId && messages.some(m => m.serverId === raw.messageId)) {
            console.log('Duplicate WS message received, ignoring:', raw.messageId);
            return;
        }

        console.log('Received WS message:', raw);

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
                serverId: raw.messageId,
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
    }, [messages, persist]);

    const removeMessage = useCallback((id: string) => {
        setMessages(prev => {
            const updated = prev.filter(m => m.id !== id);
            persist(updated);
            return updated;
        });
    }, [persist]);

    const getMessagesId = useCallback((): string[] => {
        return messages.map(m => m.serverId || m.id);
    }, [messages]);

    function disconnect() {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }

    return { messages, connected, disconnect, removeMessage, getMessagesId, clear: () => clearInboxStorage(email) };
}