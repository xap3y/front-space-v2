'use client';

// @ts-ignore
import { EmbedVisualizer } from 'embed-visualizer';
import 'embed-visualizer/dist/index.css';

import {useParams, useRouter} from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {DiscordTranscript, DiscordMessage, DiscordAttachment, StickerEntry} from '@/types/discord';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReportFinder from "@/app/mc/report/client";
import {hexToInt} from "@/lib/clientFuncs";
import {useTrUser} from "@/hooks/useTrUser";
import {getDiscordTranscriptClient} from "@/lib/client";
import LoadingPage from "@/components/LoadingPage";

// ... (rest of components stay the same)

const parseDiscordEmojis = (text: string) => {
    return text
        .replace(/<a:([a-zA-Z0-9_]+):(\d+)>/g, '![$1](https://cdn.discordapp.com/emojis/$2.gif?size=44)')
        .replace(/<:([a-zA-Z0-9_]+):(\d+)>/g, '![$1](https://cdn.discordapp.com/emojis/$2.png?size=44)');
};

const markdownComponents = {
    p: ({ node, ...props }: any) => <span {...props} />,
    a: ({ node, ...props }: any) => <a {...props} className="text-[#00b0f4] hover:underline" target="_blank" />,
    code: ({ node, className, children, ...props }: any) => (
        <code className="bg-[#2b2d31] rounded px-1 py-0.5 font-mono text-sm" {...props}>{children}</code>
    ),
    pre: ({ node, ...props }: any) => (
        <pre className="bg-[#2b2d31] border border-[#1e1f22] rounded p-2 overflow-x-auto mt-1 mb-1 block" {...props} />
    ),
    img: ({ node, ...props }: any) => (
        <img {...props} className="inline-block h-[1.375rem] w-[1.375rem] object-contain align-text-bottom mx-[1px]" />
    )
};

const Spoiler = ({ content }: { content: string }) => {
    const [visible, setVisible] = useState(false);

    return (
        <span
            onClick={(e) => {
                e.stopPropagation();
                setVisible(true);
            }}
            className={`rounded px-1 py-0.5 transition-colors cursor-pointer ${
                visible
                    ? 'bg-zinc-800/20 text-inherit'
                    : 'bg-[#1e1f22] text-transparent hover:bg-[#242629] select-none'
            }`}
        >
            <span className={visible ? '' : 'pointer-events-none'}>
                <MarkdownErrorBoundary fallback={content}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {content}
                    </ReactMarkdown>
                </MarkdownErrorBoundary>
            </span>
        </span>
    );
};

class MarkdownErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: string }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("Markdown rendering error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return <span>{this.props.fallback}</span>;
        }
        return this.props.children;
    }
}

const FormattedText = ({ content }: { content: string }) => {
    const parsedContent = parseDiscordEmojis(content);
    const parts = parsedContent.split(/(\|\|[\s\S]+?\|\|)/g);

    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('||') && part.endsWith('||')) {
                    const innerContent = part.slice(2, -2);
                    return <Spoiler key={i} content={innerContent} />;
                }

                return (
                    <MarkdownErrorBoundary key={i} fallback={part}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {part}
                        </ReactMarkdown>
                    </MarkdownErrorBoundary>
                );
            })}
        </span>
    );
};

const UserAvatar = ({ username, url }: { username: string; url?: string }) => {
    if (url) {
        return (
            <img
                src={url}
                alt={username.slice(0, 1)}
                className="h-10 w-10 rounded-full bg-zinc-800 object-cover"
            />
        );
    }
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2] text-sm font-semibold text-white">
            {username.slice(0, 2).toUpperCase()}
        </div>
    );
};

const formatAttachmentSize = (size: number) => {
    if (!Number.isFinite(size) || size < 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
        const kilobytes = size / 1024;
        return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const TEXT_PREVIEW_LINE_LIMIT = 8;
const TEXT_PREVIEW_CHAR_LIMIT = 1200;

const AttachmentDisplay = ({ attachment }: { attachment: DiscordAttachment }) => {
    const attachmentUrl = attachment.safeUrl || attachment.url;
    const downloadUrl = attachment.safeUrl
        ? `${attachment.safeUrl}${attachment.safeUrl.includes('?') ? '&' : '?'}download=true`
        : attachment.url;
    const isImage = attachment.contentType?.startsWith('image/') === true ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename || '');
    const isVideo = attachment.contentType?.startsWith('video/') === true ||
        /\.(mp4|webm|mov|mkv)$/i.test(attachment.filename || '');
    const isAudio = attachment.contentType?.startsWith('audio/') === true ||
        /\.(mp3|ogg|wav|m4a|flac)$/i.test(attachment.filename || '');
    const isText = attachment.contentType?.startsWith('text/plain') === true ||
        /\.txt$/i.test(attachment.filename || '');
    const sizeText = formatAttachmentSize(attachment.size);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [textLoading, setTextLoading] = useState(false);
    const [textError, setTextError] = useState(false);
    const [textExpanded, setTextExpanded] = useState(false);

    useEffect(() => {
        if (!isText) return;

        const controller = new AbortController();
        setTextLoading(true);
        setTextError(false);
        setTextContent(null);
        setTextExpanded(false);

        fetch(attachmentUrl, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`Failed to load attachment (${response.status})`);
                return response.text();
            })
            .then(setTextContent)
            .catch((error) => {
                if (error?.name !== 'AbortError') setTextError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setTextLoading(false);
            });

        return () => controller.abort();
    }, [attachmentUrl, isText]);

    const textPreview = useMemo(() => {
        if (textContent === null) return { content: '', expandable: false };

        const lines = textContent.split(/\r?\n/);
        const lineLimited = lines.slice(0, TEXT_PREVIEW_LINE_LIMIT).join('\n');
        const content = lineLimited.slice(0, TEXT_PREVIEW_CHAR_LIMIT);
        return {
            content,
            expandable: lines.length > TEXT_PREVIEW_LINE_LIMIT || lineLimited.length > TEXT_PREVIEW_CHAR_LIMIT,
        };
    }, [textContent]);

    if (isImage) {
        return (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="block max-w-sm">
                <img
                    src={attachmentUrl}
                    alt={attachment.filename}
                    className="rounded-lg border border-zinc-900 bg-zinc-950 object-contain max-h-[300px] max-w-[300px]"
                    loading="lazy"
                />
            </a>
        );
    }

    if (isVideo) {
        return (
            <video
                src={attachmentUrl}
                controls
                preload="metadata"
                className="max-h-[360px] max-w-full rounded-lg border border-zinc-900 bg-zinc-950"
            >
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">{attachment.filename}</a>
            </video>
        );
    }

    if (isAudio) {
        return (
            <div className="flex max-w-md flex-col gap-2 rounded border border-[#1e1f22] bg-[#2b2d31] p-3">
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="truncate text-blue-400 hover:underline">
                    {attachment.filename || 'Audio attachment'}
                </a>
                <audio src={attachmentUrl} controls preload="metadata" className="max-w-full" />
            </div>
        );
    }

    if (isText) {
        const visibleText = textExpanded ? textContent : textPreview.content;

        return (
            <div className="w-full max-w-[640px] overflow-hidden rounded-md border border-[#1e1f22] bg-[#2b2d31]">
                <div className="flex items-center gap-3 border-b border-[#1e1f22] px-3 py-2.5">
                    <div className="text-2xl" aria-hidden="true">📄</div>
                    <div className="flex min-w-0 flex-col">
                        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium text-blue-400 hover:underline">
                            {attachment.filename || 'Text attachment'}
                        </a>
                        {sizeText && <span className="text-xs text-zinc-400">{sizeText}</span>}
                    </div>
                </div>

                {textLoading ? (
                    <div className="space-y-2 p-3 animate-pulse">
                        <div className="h-3 w-5/6 rounded bg-zinc-600/60" />
                        <div className="h-3 w-3/4 rounded bg-zinc-600/60" />
                        <div className="h-3 w-2/3 rounded bg-zinc-600/60" />
                    </div>
                ) : textError ? (
                    <div className="px-3 py-4 text-sm text-zinc-400">
                        Preview unavailable. Open the attachment to view it.
                    </div>
                ) : (
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-5 text-[#dbdee1]">
                        {visibleText || 'This text file is empty.'}
                    </pre>
                )}

                {textContent !== null && textPreview.expandable && (
                    <button
                        type="button"
                        onClick={() => setTextExpanded((expanded) => !expanded)}
                        className="w-full border-t border-[#1e1f22] px-3 py-2 text-left text-xs font-medium text-blue-400 transition-colors hover:bg-[#35373c] hover:text-blue-300"
                        aria-expanded={textExpanded}
                    >
                        {textExpanded ? 'Collapse' : 'Expand'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded bg-[#2b2d31] p-3 border border-[#1e1f22] max-w-md">
            <div className="text-3xl">📄</div>
            <div className="flex flex-col overflow-hidden">
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="truncate text-blue-400 hover:underline">
                    {attachment.filename || 'Attachment'}
                </a>
                {sizeText && <span className="text-xs text-zinc-400">{sizeText}</span>}
            </div>
        </div>
    );
};

// --- Main Page ---

export default function ReportPageClient() {
    const { uid } = useParams<{ uid: string }>();
    const [data, setData] = useState<DiscordTranscript | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ref, setRef] = useState<string | null>(null);
    const router = useRouter();

    const { user, loadingUser } = useTrUser();

    useEffect(() => {
        if (loading) return;
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam) {
            setRef(refParam);
            router.replace(`/mc/report/${uid}`, { scroll: false });
        }
    }, [uid, router, setRef, loading]);

    // Check authentication - redirect if not logged in
    useEffect(() => {
        if (loadingUser) return; // Still loading, don't redirect yet

        if (!user) {
            router.replace('/mc/report/login?errortoast=no-login&after=' + uid);
        }
    }, [user, loadingUser, uid, router]);

    // Fetch transcript - only when user is ready
    useEffect(() => {
        // Only proceed if we have a UID and a confirmed User
        if (!uid || loadingUser || !user) return;

        let isMounted = true;
        setLoading(true);

        getDiscordTranscriptClient(uid, user.apiKey)
            .then((res) => {
                if (!isMounted) return;
                if (!res) {
                    setError('Transcript not found');
                } else {
                    setData(res.message as DiscordTranscript);
                }
            })
            .catch((e) => {
                if (!isMounted) return;
                setError(e?.message || 'Failed to load transcript');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [uid, user, loadingUser]);

    // Grouping & Sorting Logic
    const groupedMessages = useMemo(() => {
        if (!data?.messages) return [];

        const sortedMessages = [...data.messages].reverse();

        return sortedMessages.reduce((acc: DiscordMessage[], curr, index) => {
            const prev = sortedMessages[index - 1];
            const isSameAuthor = prev && prev.author.username === curr.author.username;

            // @ts-ignore
            curr.isCompact = isSameAuthor;
            acc.push(curr);
            return acc;
        }, []);
    }, [data]);

    if (loadingUser) return <LoadingPage />; // Still loading user
    if (!user) return null; // Redirect is happening, don't render

    return (
        <>
            <div className="min-h-screen bg-[#313338] font-sans text-zinc-200">

                {/* Header Bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#26272d] bg-[#313338] px-4 py-3 shadow-sm">
                    <div>
                        <h1 className="flex items-center gap-2 font-bold text-white">
                            <span className="text-zinc-400">#</span>
                            {loading ? (
                                <span className="h-4 w-32 bg-zinc-700 rounded animate-pulse inline-block" />
                            ) : data?.channelName || 'transcript'}
                        </h1>
                        <p className="text-xs text-zinc-400">UID: {uid}</p>
                    </div>
                    <div className="text-xs text-zinc-500">
                        {loading ? (
                            <span className="h-3.5 w-24 bg-zinc-700 rounded animate-pulse inline-block" />
                        ) : (
                            `Generated: ${data?.generatedAt ? new Date(data.generatedAt).toLocaleDateString() : 'Unknown'}`
                        )}
                    </div>
                </div>

                {/* Message List */}
                <div className="mx-auto flex max-w-[100vw] flex-col py-4">
                    {loading ? (
                        Array.from({ length: 12 }).map((_, idx) => (
                            <div key={idx} className="flex px-4 py-2 hover:bg-[#2e3035] animate-pulse items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-24 bg-zinc-700 rounded" />
                                        <div className="h-3 w-16 bg-zinc-800 rounded" />
                                    </div>
                                    <div className="h-3.5 bg-zinc-700 rounded w-5/6" />
                                    <div className="h-3.5 bg-zinc-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : error ? (
                        <div className="max-w-lg w-full mx-auto px-4 py-10">
                            <div className="p-6 text-center text-red-400 text-lg font-semibold bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                                {error}
                            </div>
                            <ReportFinder />
                        </div>
                    ) : (
                        groupedMessages.map((m: any) => (
                        <div
                            key={m.id}
                            className={`group flex px-4 pr-4 hover:bg-[#2e3035] ${
                                m.isCompact ? 'py-0.5 mt-0' : 'mt-[17px] py-0.5'
                            }`}
                        >
                            {/* Avatar / Gutter */}
                            <div className="w-[50px] flex-shrink-0 cursor-pointer">
                                {!m.isCompact ? (
                                    <UserAvatar username={m.author.username} url={m.author.avatarUrl} />
                                ) : (
                                    <div className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 text-right pr-3 pt-1">
                                        {m.timestamp ? format(new Date(m.timestamp), 'h:mm aa') : ''}
                                    </div>
                                )}
                            </div>

                            {/* Content Column */}
                            <div className="min-w-0 flex-1 pl-2">
                                {/* Header (Only for non-compact) */}
                                {!m.isCompact && (
                                    <div className="flex items-center gap-2 pb-1">
                        <span className="cursor-pointer font-medium text-white hover:underline">
                            {m.author.username}
                        </span>
                                        <span className="text-xs text-zinc-400 ml-1">
                            {m.timestamp ? format(new Date(m.timestamp), "MM/dd/yyyy h:mm aa") : ''}
                        </span>
                                    </div>
                                )}

                                {/* Message Content */}
                                {m.content && (
                                    <div className={`whitespace-pre-wrap text-[15px] leading-[1.375rem] text-[#dbdee1] ${m.isCompact ? '-mt-1' : ''}`}>
                                        <FormattedText content={m.content} />
                                    </div>
                                )}

                                {/* Attachments */}
                                {(m.attachments || []).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(m.attachments || []).map((a: DiscordAttachment) => (
                                            <AttachmentDisplay key={a.id || a.safeUrl || a.url} attachment={a} />
                                        ))}
                                    </div>
                                )}

                                {/* Stickers */}
                                {(m.stickers || []).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 max-w-36 max-h-36">
                                        {(m.stickers || []).map((sticker: StickerEntry) => (
                                            <div key={sticker.url}>
                                                <img src={sticker.url} alt="" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Embeds */}
                                {(m.embeds || []).length > 0 && (
                                    <div className="grid max-w-[520px] gap-2 z-50">
                                        {(m.embeds || []).map((e: any, idx: number) => (
                                            <EmbedVisualizer
                                                key={`embed-${m.id}-${idx}`}
                                                embed={{
                                                    embed: {
                                                        title: e.title || undefined,
                                                        timestamp: e.timestamp || undefined,
                                                        description: e.description || undefined,
                                                        url: e.url || undefined,
                                                        color: hexToInt(e.color == "#00ff00" ? "#4DD011" : e.color),
                                                        image: e.image ? { url: e.image.url } : undefined,
                                                        thumbnail: e.thumbnail ? { url: e.thumbnail.url } : undefined,
                                                        author: e.author ? { name: e.author.username, url: e.author.url, icon_url: e.author.icon_url } : undefined,
                                                        footer: e.footer ? { text: e.footer.text, icon_url: e.footer.icon_url } : undefined,
                                                        ...(e.fields
                                                            ? {
                                                                fields: e.fields.map((f: any) => ({
                                                                    name: f.name,
                                                                    value: f.value,
                                                                    inline: f.inline || false,
                                                                })),
                                                            }
                                                            : {}),
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )))}
                </div>
            </div>
        </>
    );
}
