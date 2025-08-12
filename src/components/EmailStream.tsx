'use client';

import { useEmailWebSocket } from '@/hooks/useEmailWebSocket';
import { format } from 'date-fns';
import {useEffect, useMemo, useState} from 'react';

interface Props {
    email: string;
    apiKey: string;
    forceId: number;
    disconnectBo?: boolean;
}

export function EmailStream({ email, apiKey, forceId, disconnectBo }: Props) {
    const { messages, connected, disconnect } = useEmailWebSocket(email, apiKey, forceId);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (disconnectBo) {
            disconnect()
        }
    })

    useEffect(() => {
        if (!selectedId && messages.length > 0) {
            setSelectedId(messages[0].id);
        }
    }, [messages, selectedId]);

    const selectedMessage = useMemo(
        () => messages.find(m => m.id === selectedId) || null,
        [messages, selectedId]
    );

    const HEIGHT = 560;

    return (
        <div className="grid gap-5 md:flex" style={{ height: `${HEIGHT}px` }}>
            {/* INBOX LIST */}
            <div className="md:min-w-96 md:col-span-5 flex flex-col rounded-lg border border-white/10 bg-[#181a1f] min-h-[320px] overflow-hidden">
                <div className="p-3 border-b border-white/10 flex items-center justify-between text-xs uppercase tracking-wide bg-[#1e2025]">
                    <span className="font-semibold text-gray-200 select-none">Inbox</span>
                    <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium select-none ${
                            connected
                                ? 'bg-green-500/15 text-green-400 border border-green-400/30'
                                : 'bg-gray-500/15 text-gray-400 border border-gray-400/20'
                        }`}

                        data-tooltip-id="my-tooltip" data-tooltip-content={connected ? 'New emails will display automatically, no need to refresh ' : 'Reconnect to receive new emails'}
                    >
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
                </div>
                <ul className="flex-1 overflow-auto">
                    {messages.length === 0 && (
                        <li className="p-6 text-xs text-gray-500 text-center select-none">
                            Waiting for messages...
                        </li>
                    )}
                    {messages.map((m) => {
                        const active = selectedId === m.id;
                        return (
                            <li
                                key={m.id}
                                onClick={() => setSelectedId(m.id)}
                                className={`
                  group cursor-pointer px-4 py-3 text-xs relative
                  transition-colors
                  ${active ? 'bg-[#272b33]' : 'hover:bg-[#22262d]'}
                  border-b border-white/20 last:border-b-0
                `}
                            >
                                {active && (
                                    <span className="absolute left-0 top-0 h-full w-[3px] bg-telegram rounded-r-sm" />
                                )}
                                <p className="font-medium truncate pr-2 text-gray-100 group-hover:text-white">
                                    {m.subject || '(no subject)'}
                                </p>
                                <p className="text-gray-400 truncate mt-0.5 pr-2">
                                    {m.from}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    {m.date ? format(new Date(m.date), 'yyyy-MM-dd HH:mm:ss') : ''}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* MESSAGE VIEWER */}
            <div className="md:w-full rounded-lg border border-white/10 bg-[#181a1f] min-h-[320px] flex flex-col overflow-hidden">
                <div className="select-none p-3 border-b border-white/10 text-xs uppercase tracking-wide font-semibold text-gray-200 bg-[#1e2025]">
                    Message
                </div>
                <div className="flex-1 overflow-auto p-5 text-sm">
                    {!selectedMessage && messages.length > 0 && (
                        <p className="text-gray-500 text-xs">Select a message.</p>
                    )}
                    {messages.length === 0 && (
                        <p className="text-gray-500 text-xs select-none">No messages yet.</p>
                    )}
                    {selectedMessage && (
                        <MessageDetail m={selectedMessage} />
                    )}
                </div>
            </div>
        </div>
    );
}

function MessageDetail({ m }: { m: any }) {
    const styledHtml = useMemo(() => {
        if (!m.html) return null;
        const styleBlock = `
      <style>
        :root { color-scheme: dark; }
        body {
          background: transparent !important;
          color: #e5e7eb !important;
          font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Open Sans','Helvetica Neue',sans-serif;
          font-size: 14px;
          line-height: 1.5;
          padding: 8px 12px;
        }
        p, td, span, div, li, a, strong, em {
          color: #e5e7eb !important;
        }
        a { color: #38bdf8 !important; text-decoration: none; }
        a:hover { text-decoration: underline; }
        img { max-width: 100%; height: auto; }
        pre, code { background: #111418; color: #f1f5f9 !important; padding: 4px 6px; border-radius: 4px; }
      </style>
    `;
        if (/<html/i.test(m.html)) {
            return m.html.replace(/<head[^>]*>/i, (match: string) => `${match}${styleBlock}`) || (styleBlock + m.html);
        }
        return `<!DOCTYPE html><html><head>${styleBlock}</head><body>${m.html}</body></html>`;
    }, [m.html]);

    return (
        <div className="space-y-5">
            <div className="space-y-1">
                <p className="font-semibold text-lg leading-tight text-white">
                    {m.subject || '(no subject)'}
                </p>
                <p className="text-xs text-gray-400">
                    <span className="text-gray-500">From:</span> {m.from}
                </p>
                {m.to && (
                    <p className="text-xs text-gray-400">
                        <span className="text-gray-500">To:</span> {m.to}
                    </p>
                )}
                {m.date && (
                    <p className="text-[10px] text-gray-500">{m.date}</p>
                )}
            </div>

            {styledHtml ? (
                <iframe
                    className="w-full min-h-[400px] bg-[#111418] border border-white/10 rounded-md shadow-inner"
                    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                    srcDoc={styledHtml}
                    title="html-body"
                />
            ) : (
                <pre className="text-xs leading-relaxed whitespace-pre-wrap text-gray-200 bg-[#111418] border border-white/10 rounded-md p-4 shadow-inner">
          {m.text || m.content || '(empty body)'}
        </pre>
            )}
        </div>
    );
}