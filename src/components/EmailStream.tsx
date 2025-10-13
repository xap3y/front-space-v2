'use client';

import { useEmailWebSocket } from '@/hooks/useEmailWebSocket';
import { format } from 'date-fns';
import { DOMPurify } from 'dompurify';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {FaArrowLeft, FaTrash} from "react-icons/fa6";
import SwipeableListItem from '@/components/SwipeableItemList';

let purify: DOMPurify | null = null;
const SANITIZE_HTML = true;

interface Props {
    email: string;
    apiKey: string;
    forceId: number;
    desktopHeightPx?: number;
    disconnectBo?: boolean;
    isExpired?: boolean;
}

export function EmailStream({ email, apiKey, forceId, disconnectBo, desktopHeightPx = 560, isExpired = false }: Props) {
    const { messages, connected, disconnect, removeMessage } = useEmailWebSocket(email, apiKey, forceId);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const isMdUp = useMediaQuery('(min-width: 1280px)');
    const [mobileMode, setMobileMode] = useState<'list' | 'detail'>('list');

    useEffect(() => {
        if (SANITIZE_HTML && typeof window !== 'undefined' && !purify) {
            import('dompurify').then(mod => {
                purify = mod.default;
            }).catch(() => { /* ignore */ });
        }
    }, []);

    useEffect(() => {
        if (disconnectBo) {
            console.log("DISCONNECT BO", disconnectBo)
            disconnect()
        }
    })

    useEffect(() => {
        if (isMdUp) {
            setMobileMode(prev => prev); // no-op; you can force 'list' if you prefer
        } else {
            if (!selectedId) {
                setMobileMode('list');
            }
        }
    }, [isMdUp, selectedId]);

    const selectedMessage = useMemo(
        () => messages.find(m => m.id === selectedId) || null,
        [messages, selectedId]
    );

    const handleSelect = useCallback((id: string) => {
        setSelectedId(id);
        if (!isMdUp) {
            setMobileMode('detail');
        }
    }, [isMdUp]);

    const handleBack = useCallback(() => {
        setSelectedId(null)
        if (!isMdUp) {
            setMobileMode('list');
        }
    }, [isMdUp, setSelectedId]);

    useEffect(() => {
        console.log("connected changed", connected)
    }, [connected])

    return (
        <div
            className={` p-0 xl:p-6
        flex flex-col xl:flex-row gap-5 w-full
        overflow-x-hidden rounded-b-lg
      `}
        >
            {/* INBOX LIST */}
            <div className={`flex flex-col
          w-full
          xl:w-[250px] xl:flex-none
          xl:rounded-lg rounded-none border border-white/10 bg-secondary
          overflow-hidden min-h-64
          ${!isMdUp && mobileMode === 'detail' ? 'hidden' : ''}
          min-w-0`}>
                <div className="p-3 border-b border-white/10 flex items-center justify-between text-xs uppercase tracking-wide bg-primary1">
                    <span className="font-semibold text-gray-200 select-none">Inbox</span>
                    <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium select-none ${
                            connected
                                ? 'bg-green-500/15 text-green-400 border border-green-400/30'
                                : isExpired ?
                                    'bg-red-500/15 text-red-400 border border-red-400/30':
                                    'bg-gray-500/15 text-gray-400 border border-gray-400/20'
                        }`}

                        data-tooltip-id="my-tooltip" data-tooltip-content={connected ? 'New emails will display automatically, no need to refresh ' : 'Reconnect to receive new emails'}
                    >
            {connected ? 'LIVE' : isExpired ? 'EXPIRED' : 'OFFLINE'}
          </span>
                </div>
                <ul className="flex-1 overflow-auto bg-primary0">
                    {messages.length === 0 && (
                        <li className="p-6 text-xs text-gray-500 text-center select-none">
                            Waiting for messages...
                        </li>
                    )}
                    {messages.map((m) => {
                        const active = selectedId === m.id;
                        return (
                            <SwipeableListItem
                                key={m.id}
                                active={active}
                                disabled={isMdUp}               // swipe only on mobile
                                onDelete={() => removeMessage(m.id)}
                                onClick={() => handleSelect(m.id)}
                            >
                                {active && isMdUp && (
                                    <span className="absolute left-0 top-0 h-full w-[3px] bg-telegram rounded-r-sm" />
                                )}
                                <p className="font-medium truncate pr-2 text-gray-100 group-hover:text-white">
                                    {m.subject || '(no subject)'}
                                </p>
                                <p className="text-gray-400 truncate mt-0.5 pr-2">{m.from}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    {m.date ? format(new Date(m.date), 'yyyy-MM-dd HH:mm:ss') : ''}
                                </p>
                            </SwipeableListItem>
                        );
                    })}
                </ul>
            </div>

            {/* MESSAGE VIEWER */}
            <div className={`flex flex-col w-full
          xl:rounded-lg rounded-none border border-white/10 bg-primary0
          overflow-hidden
          ${!isMdUp && mobileMode === 'list' ? 'hidden' : ''}
          min-w-0`}>
                <div className="p-3 gap-4 flex items-center border-b border-white/10 text-xs uppercase tracking-wide font-semibold text-gray-200 bg-primary1">
                    {!isMdUp && (
                        <button
                            onClick={handleBack}
                            className="gap-2 inline-flex items-center text-[10px] px-2 py-1 rounded-md bg-[#24272d] hover:bg-[#2c3036] border border-white/10 text-gray-300"
                            aria-label="Back to inbox"
                        >
                            <FaArrowLeft />
                            Inbox
                        </button>
                    )}
                    <span className="select-none">Message</span>
                </div>
                <div className="flex-1 overflow-auto text-sm">
                    {!selectedMessage && messages.length > 0 && (
                        <p className="text-gray-500 text-xs">Select a message.</p>
                    )}
                    {messages.length === 0 && (
                        <p className="text-gray-500 text-xs select-none p-6">Empty</p>
                    )}
                    {selectedMessage && (
                        <MessageDetail message={selectedMessage} sanitizeHtml={SANITIZE_HTML} />
                    )}
                </div>
            </div>
        </div>
    );
}

function MessageDetail({
                           message,
                           sanitizeHtml
                       }: {
    message: any;
    sanitizeHtml: boolean;
}) {
    const sanitizedHtml = useMemo(() => {
        const raw = message.html || message.content || message.text || '';
        if (!raw) return '';
        if (sanitizeHtml && purify) {
            return purify.sanitize(raw, {
                USE_PROFILES: { html: true },
                FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'link'],
                FORBID_ATTR: ['onerror', 'onclick', 'onload']
            });
        }
        return raw;
    }, [message.html, message.content, message.text, sanitizeHtml]);

    return (
        <div className="space-y-5 xl:p-5 p-0">
            <div className="space-y-1 xl:p-0 p-5">
                <p className="font-semibold md:text-lg text-base leading-tight text-white">
                    {message.subject || '(no subject)'}
                </p>
                <p className="text-xs text-gray-400">
                    <span className="text-gray-500">From:</span> {message.from}
                </p>
                {message.to && (
                    <p className="text-xs text-gray-400">
                        <span className="text-gray-500">To:</span> {message.to}
                    </p>
                )}
                {message.date && (
                    <p className="text-[10px] text-gray-500">{message.date}</p>
                )}
            </div>

            {sanitizedHtml ? (
                /*<iframe
                    className="w-full min-h-[400px] h-full bg-[#111418] border border-white/10 rounded-md shadow-inner"
                    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                    srcDoc={styledHtml}
                    title="html-body"
                />*/
                <div
                    className="w-full min-h-[200px] text-xs bg-[#111418] xl:border border-none border-white/10 xl:rounded-md rounded-none shadow-inner shrink-0"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
            ) : (
                <pre className="text-xs leading-relaxed whitespace-pre-wrap text-gray-200 bg-[#111418] border border-white/10 rounded-md p-4 shadow-inner">
          {message.text || message.content || '(empty body)'}
        </pre>
            )}
        </div>
    );
}

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia(query);
        const handler = () => setMatches(mq.matches);
        handler();
        mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
        };
    }, [query]);

    return matches;
}