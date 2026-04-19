'use client';

import { useEmailWebSocket } from '@/hooks/useEmailWebSocket';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { FaArrowLeft } from 'react-icons/fa6';
import { MdOutlineWifiOff, MdSignalCellularAlt, MdContentCopy, MdClose } from 'react-icons/md';
import SwipeableListItem from '@/components/SwipeableItemList';
import { TempMail } from '@/hooks/useTempMail';
// @ts-ignore
import DOMPurify from 'dompurify';

let purify: any = null;
const SANITIZE_HTML = true;

interface Props {
    email: TempMail;
    apiKey: string;
    forceId: number;
    desktopHeightPx?: number;
    disconnectBo?: boolean;
    isExpired?: boolean;
    refetchCallback?: () => void;
}

interface StatusIndicatorProps {
    connected: boolean;
    isExpired: boolean;
    isWsExpired: boolean;
    emailStatus: string;
    tooltipText: string;
    connectedAt?: Date;
}

interface MessageDetailProps {
    message: any;
    sanitizeHtml: boolean;
    onClose: () => void;
}

// ============================================================================
// COPY TO CLIPBOARD UTILITY
// ============================================================================
function useCopyToClipboard() {
    const [copied, setCopied] = useState<string | null>(null);

    const copy = useCallback((text: string, id: string = 'default') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        });
    }, []);

    return { copy, copied };
}

// ============================================================================
// DURATION TRACKER HOOK
// ============================================================================
function useConnectionDuration(connected: boolean, startTime?: Date) {
    const [duration, setDuration] = useState<string>('');

    useEffect(() => {
        if (!connected || !startTime) return;

        const updateDuration = () => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            if (hours > 0) {
                setDuration(`${hours}h ${minutes % 60}m`);
            } else if (minutes > 0) {
                setDuration(`${minutes}m ${seconds % 60}s`);
            } else {
                setDuration(`${seconds}s`);
            }
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);
        return () => clearInterval(interval);
    }, [connected, startTime]);

    return duration;
}

// ============================================================================
// STATUS INDICATOR COMPONENT
// ============================================================================
function StatusIndicator({
                             connected,
                             isExpired,
                             isWsExpired,
                             emailStatus,
                             tooltipText,
                             connectedAt,
                         }: StatusIndicatorProps) {
    const duration = useConnectionDuration(connected, connectedAt);

    const getStatusStyles = () => {
        if (connected) {
            return {
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-400',
                border: 'border-emerald-500/20',
                label: 'LIVE',
                icon: MdSignalCellularAlt,
            };
        }
        if (isExpired || isWsExpired || emailStatus === 'SUSPENDED') {
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-400',
                border: 'border-red-500/20',
                label: isExpired || isWsExpired ? 'EXPIRED' : emailStatus,
                icon: MdOutlineWifiOff,
            };
        }
        return {
            bg: 'bg-gray-500/10',
            text: 'text-gray-400',
            border: 'border-gray-500/20',
            label: emailStatus !== 'OPEN' ? emailStatus : 'OFFLINE',
            icon: MdOutlineWifiOff,
        };
    };

    const status = getStatusStyles();
    const IconComponent = status.icon;
    const finalTooltip = connected && duration ? `${tooltipText} (${duration})` : tooltipText;

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={finalTooltip}
        >
            <IconComponent className="w-3 h-3" />
            {status.label}
        </div>
    );
}

// ============================================================================
// INBOX LIST COMPONENT
// ============================================================================
interface InboxListProps {
    messages: any[];
    selectedId: string | null;
    connected: boolean;
    isExpired: boolean;
    isWsExpired: boolean;
    emailStatus: string;
    desktopHeightPx: number;
    isMdUp: boolean;
    mobileMode: 'list' | 'detail';
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    tooltipText: string;
    connectedAt?: Date;
}

function InboxList({
                       messages,
                       selectedId,
                       connected,
                       isExpired,
                       isWsExpired,
                       emailStatus,
                       desktopHeightPx,
                       isMdUp,
                       mobileMode,
                       onSelect,
                       onDelete,
                       tooltipText,
                       connectedAt,
                   }: InboxListProps) {
    return (
        <div
            className={`flex flex-col w-full xl:w-[280px] xl:flex-none box-primary xl:rounded-lg xl:border-x-4 xl:border-b-4 border-b-0 border-x-0 rounded-none ${
                !isMdUp && mobileMode === 'detail' ? 'hidden' : ''
            } min-w-0`}
            style={{ height: isMdUp ? desktopHeightPx : 'auto' }}
        >
            {/* HEADER */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/2.5">
                <h2 className="font-semibold text-xs text-gray-300 select-none">
                    INBOX
                </h2>
                <StatusIndicator
                    connected={connected}
                    isExpired={isExpired}
                    isWsExpired={isWsExpired}
                    emailStatus={emailStatus}
                    tooltipText={tooltipText}
                    connectedAt={connectedAt}
                />
            </div>

            {/* MESSAGE LIST */}
            <ul className="flex-1 overflow-y-auto divide-y divide-white/5">
                {messages.length === 0 ? (
                    <li className="p-8 flex items-center justify-center text-center">
                        <p className="text-xs text-gray-500 select-none">
                            Waiting for messages...
                        </p>
                    </li>
                ) : (
                    messages.map((message) => {
                        const isActive = selectedId === message.id;
                        return (
                            <SwipeableListItem
                                key={message.id}
                                active={isActive}
                                disabled={isMdUp}
                                onDelete={() => onDelete(message.id)}
                                onClick={() => onSelect(message.id)}
                            >
                                {isActive && isMdUp && (
                                    <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-100 truncate">
                                        {message.subject || '(no subject)'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {message.from}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1.5">
                                        {message.date
                                            ? format(new Date(message.date), 'MMM dd, HH:mm')
                                            : ''}
                                    </p>
                                </div>
                            </SwipeableListItem>
                        );
                    })
                )}
            </ul>
        </div>
    );
}

// ============================================================================
// MESSAGE DETAIL COMPONENT
// ============================================================================
function MessageDetail({ message, sanitizeHtml, onClose }: MessageDetailProps) {
    const { copy, copied } = useCopyToClipboard();

    const sanitizedHtml = useMemo(() => {
        const raw = message.html || message.content || message.text || '';
        if (!raw) return '';
        if (sanitizeHtml && purify) {
            return purify.sanitize(raw, {
                USE_PROFILES: { html: true },
                FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'link'],
                FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
            });
        }
        return raw;
    }, [message.html, message.content, message.text, sanitizeHtml]);

    return (
        <div className="space-y-4">
            {/* MESSAGE HEADER */}
            <div className="space-y-2 xl:px-5 xl:pt-5 px-5 pt-4 relative pr-10">
                <h1 className="font-semibold text-lg md:text-xl leading-tight text-white">
                    {message.subject || '(no subject)'}
                </h1>
                <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2 group">
                        <div className="flex items-center gap-2.5 group">
                            <span className="text-gray-400 flex-shrink-0">From:</span>
                            <p className="text-gray-300 font-mono flex-1 truncate">
                                {message.from}
                            </p>
                        </div>
                    
                        <button
                            onClick={() => copy(message.from, 'from')}
                            className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-300 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                            title="Copy from address"
                        >
                            <MdContentCopy className="w-3 h-3" />
                            {copied === 'from' && <span className="text-xs max-h-3">Copied</span>}
                        </button>
                    </div>
                    {message.to && (
                        <p>
                            <span className="text-gray-400">To:</span> {message.to}
                        </p>
                    )}
                    {message.date && (
                        <p className="pt-1">
                            {format(new Date(message.date), 'PPpp')}
                        </p>
                    )}
                </div>

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-0 inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
                    aria-label="Close message"
                    title="Close message"
                >
                    <MdClose className="w-4 h-4" />
                </button>
            </div>

            {/* MESSAGE CONTENT */}
            <div className="xl:px-5 xl:pb-5 px-5 pb-4">
                {sanitizedHtml ? (
                    <div
                        className="w-full min-h-[300px] text-sm leading-relaxed bg-white/2.5 p-4 border border-white/10 rounded overflow-auto"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                ) : (
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap text-gray-300 bg-white/2.5 border border-white/10 rounded p-4 overflow-auto max-h-[600px] font-mono">
                        {message.text || message.content || '(empty body)'}
                    </pre>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MESSAGE VIEWER COMPONENT
// ============================================================================
interface MessageViewerProps {
    selectedMessage: any;
    messages: any[];
    isMdUp: boolean;
    mobileMode: 'list' | 'detail';
    onBack: () => void;
}

function MessageViewer({
                           selectedMessage,
                           messages,
                           isMdUp,
                           mobileMode,
                           onBack,
                       }: MessageViewerProps) {
    return (
        <div
            className={`flex flex-col w-full box-primary ${
                !isMdUp && mobileMode === 'list' ? 'hidden' : ''
            } min-w-0`}
        >
            {/* HEADER */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-white/2.5">
                {!isMdUp && (
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                        aria-label="Back to inbox"
                    >
                        <FaArrowLeft className="w-3 h-3" />
                        Back
                    </button>
                )}
                <h2 className="font-semibold text-xs text-gray-300 select-none">
                    MESSAGE
                </h2>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-auto">
                {!selectedMessage && messages.length > 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm select-none">
                            Select a message to view
                        </p>
                    </div>
                )}
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm select-none">Empty inbox</p>
                    </div>
                )}
                {selectedMessage && (
                    <MessageDetail
                        message={selectedMessage}
                        sanitizeHtml={SANITIZE_HTML}
                        onClose={onBack}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// HOOKS
// ============================================================================
function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia(query);
        const handler = () => setMatches(mq.matches);
        handler();
        mq.addEventListener
            ? mq.addEventListener('change', handler)
            : mq.addListener(handler);
        return () => {
            mq.removeEventListener
                ? mq.removeEventListener('change', handler)
                : mq.removeListener(handler);
        };
    }, [query]);

    return matches;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function EmailStream({
                                email,
                                apiKey,
                                forceId,
                                disconnectBo,
                                desktopHeightPx = 560,
                                isExpired = false,
                                refetchCallback,
                            }: Props) {
    const {
        messages,
        connected,
        disconnect,
        removeMessage,
        isWsExpired,
    } = useEmailWebSocket(email.email, apiKey, forceId, refetchCallback);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [connectedAt, setConnectedAt] = useState<Date | undefined>(undefined);
    const isMdUp = useMediaQuery('(min-width: 1280px)');
    const [mobileMode, setMobileMode] = useState<'list' | 'detail'>('list');

    // Initialize DOMPurify
    useEffect(() => {
        if (SANITIZE_HTML && typeof window !== 'undefined' && !purify) {
            import('dompurify')
                .then((mod) => {
                    purify = mod.default;
                })
                .catch(() => {
                    /* ignore */
                });
        }
    }, []);

    // Handle disconnect
    useEffect(() => {
        if (disconnectBo) {
            disconnect();
        }
    }, [disconnectBo, disconnect]);

    // Track connection time
    useEffect(() => {
        if (connected && !connectedAt) {
            setConnectedAt(new Date());
        } else if (!connected) {
            setConnectedAt(undefined);
        }
    }, [connected, connectedAt]);

    // Handle responsive mode
    useEffect(() => {
        if (!isMdUp && !selectedId) {
            setMobileMode('list');
        }
    }, [isMdUp, selectedId]);

    const selectedMessage = useMemo(
        () => messages.find((m) => m.id === selectedId) || null,
        [messages, selectedId]
    );

    const handleSelect = useCallback(
        (id: string) => {
            setSelectedId(id);
            if (!isMdUp) {
                setMobileMode('detail');
            }
        },
        [isMdUp]
    );

    const handleBack = useCallback(() => {
        setSelectedId(null);
        setMobileMode('list');
    }, []);

    const tooltipText = connected
        ? 'New emails arrive instantly'
        : email.status === 'OPEN'
            ? 'Reconnect to receive emails'
            : 'Cannot receive emails in current status';

    return (
        <div className="p-0 xl:p-6 flex flex-col xl:flex-row gap-5 w-full overflow-x-hidden rounded-b-lg">
            {/* INBOX LIST */}
            <InboxList
                messages={messages}
                selectedId={selectedId}
                connected={connected}
                isExpired={isExpired}
                isWsExpired={isWsExpired}
                emailStatus={email.status}
                desktopHeightPx={desktopHeightPx}
                isMdUp={isMdUp}
                mobileMode={mobileMode}
                onSelect={handleSelect}
                onDelete={removeMessage}
                tooltipText={tooltipText}
                connectedAt={connectedAt}
            />

            {/* MESSAGE VIEWER */}
            <MessageViewer
                selectedMessage={selectedMessage}
                messages={messages}
                isMdUp={isMdUp}
                mobileMode={mobileMode}
                onBack={handleBack}
            />
        </div>
    );
}