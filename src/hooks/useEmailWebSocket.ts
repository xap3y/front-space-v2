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
    _fp: string;
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

export function useEmailWebSocket(email: string, apiKey: string, forceId: number, refetchCallback?: () => void) {
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [connected, setConnected] = useState(false);
    const [isWsExpired, setIsWsExpired] = useState(false);
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

        if (!email) return;

        // Build URL - cookie will be sent automatically by browser
        let url: string;
        const base = process.env.NEXT_PUBLIC_EMAIL_WEBSOCKET_URL;

        if (apiKey && apiKey.trim()) {
            // Private mode: use API key
            url = `${base}?email=${encodeURIComponent(email)}&apiKey=${encodeURIComponent(apiKey)}`;
        } else {
            // Public mode: just send email, cookie will be sent automatically
            url = `${base}?email=${encodeURIComponent(email)}`;
        }

        console.log('Connecting to WS:', url);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true)
            console.log('WebSocket connected');

            let ids = getMessagesId();
            if (ids == null || ids.length === 0) {
                ids = ['']
            }

            // Determine headers for getmissing request
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (apiKey && apiKey.trim()) {
                headers['x-api-key'] = apiKey;
            }

            fetch(getApiUrl() + `/v1/email/getmissing`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ mail: email, messageIds: ids }),
                credentials: 'include', // Send cookies automatically
            }).then(async (res) => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch missing messages: ${res.statusText}`);
                }

                try {
                    if (res.status === 204) {
                        console.log('No missing messages');
                        return;
                    }
                    const response = await res.json();
                    console.log('Missing messages response:', response);

                    if (Array.isArray(response)) {
                        response.forEach((msg: RawWsMessage) => {
                            pushNewMessage(msg);
                        });
                    } else {
                        console.warn('Unexpected response format:', response);
                    }
                } catch (e) {
                    console.error('Failed to parse response:', e);
                }
            }).catch(err => {
                console.error('Failed to fetch missing messages:', err);
            });
        };

        ws.onclose = (e) => {
            console.log('WebSocket disconnected');
            console.log(e.reason)
            if (e.reason && e.reason.includes("expired")) {
                setIsWsExpired(true);
            }
            setConnected(false);
        }

        ws.onerror = (e) => {
            console.error('WebSocket error', e);
            setConnected(false);
        }

        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                if (data.error === true && data.close === true && refetchCallback != null) {
                    setTimeout(() => {
                        refetchCallback();
                    }, 400);
                    return;
                }
                const raw: RawWsMessage = data;
                pushNewMessage(raw);
            } catch (e) {
                console.error('Invalid WS message', e);
            }
        };

        return () => {
            ws.close();
        };
    }, [email, apiKey, forceId]);

    const pushNewMessage = useCallback((raw: RawWsMessage) => {
        if (raw.messageId && messages.some(m => m.serverId === raw.messageId)) {
            console.log('Duplicate WS message received, ignoring:', raw.messageId);
            return;
        }

        console.log('Received WS message:', raw);

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

    return { messages, connected, disconnect, isWsExpired, removeMessage, getMessagesId, clear: () => clearInboxStorage(email) };
}