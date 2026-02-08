'use client';

// @ts-ignore
import { EmbedVisualizer } from 'embed-visualizer';
import 'embed-visualizer/dist/index.css';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getDiscordTranscript } from '@/lib/apiGetters';
import {DiscordTranscript, DiscordMessage, DiscordAttachment, StickerEntry} from '@/types/discord';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReportFinder from "@/app/mc/report/client";
import {hexToInt} from "@/lib/clientFuncs";

// --- Components ---

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
                    ? 'bg-zinc-800/20 text-inherit' // Revealed
                    : 'bg-[#1e1f22] text-transparent hover:bg-[#242629] select-none' // Hidden
            }`}
        >
      {/* We render Markdown INSIDE the spoiler so formatting like **bold** works */}
            <span className={visible ? '' : 'pointer-events-none'}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Force inline rendering (no <p> tags inside the spoiler span)
                p: ({ node, ...props }) => <span {...props} />,
                a: ({ node, ...props }) => <a {...props} className="text-[#00b0f4] hover:underline" />,
                code: ({ node, className, children, ...props }) => (
                    <code className="bg-[#2b2d31] rounded px-1 py-0.5 font-mono text-sm" {...props}>{children}</code>
                ),
            }}
        >
          {content}
        </ReactMarkdown>
      </span>
    </span>
    );
};

const FormattedText = ({ content }: { content: string }) => {
    // Regex to capture text between || delimiters
    const parts = content.split(/(\|\|[\s\S]+?\|\|)/g);

    return (
        <span>
      {parts.map((part, i) => {
          if (part.startsWith('||') && part.endsWith('||')) {
              // Extract content inside ||...||
              const innerContent = part.slice(2, -2);
              return <Spoiler key={i} content={innerContent} />;
          }

          // Regular text
          return (
              <ReactMarkdown
                  key={i}
                  remarkPlugins={[remarkGfm]}
                  components={{
                      // Use span instead of p to keep flow inline
                      p: ({ node, ...props }) => <span {...props} />,
                      a: ({ node, ...props }) => <a {...props} className="text-[#00b0f4] hover:underline" target="_blank" />,
                      code: ({ node, className, children, ...props }) => (
                          <code className="bg-[#2b2d31] rounded px-1 py-0.5 font-mono text-sm" {...props}>{children}</code>
                      ),
                      pre: ({ node, ...props }) => (
                          <pre className="bg-[#2b2d31] border border-[#1e1f22] rounded p-2 overflow-x-auto mt-1 mb-1 block" {...props} />
                      )
                  }}
              >
                  {part}
              </ReactMarkdown>
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

const AttachmentDisplay = ({ attachment }: { attachment: DiscordAttachment }) => {
    const isImage = attachment.contentType?.startsWith('image/') ||
        attachment.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    if (isImage) {
        return (
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block max-w-sm">
                <img
                    src={attachment.safeUrl ? attachment.safeUrl : attachment.url}
                    alt={attachment.filename}
                    className="rounded-lg border border-zinc-900 bg-zinc-950 object-contain max-h-[300px] max-w-[300px]"
                    loading="lazy"
                />
            </a>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded bg-[#2b2d31] p-3 border border-[#1e1f22] max-w-md">
            <div className="text-3xl">📄</div>
            <div className="flex flex-col overflow-hidden">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-400 hover:underline">
                    {attachment.filename || 'Attachment'}
                </a>
                <span className="text-xs text-zinc-400">{attachment.size ? Math.round(attachment.size / 1024) + ' KB' : ''}</span>
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

    useEffect(() => {
        if (!uid) return;
        setLoading(true);
        getDiscordTranscript(uid)
            .then((res) => {
                if (!res) setError('Transcript not found');
                else setData(res.data as DiscordTranscript);
            })
            .catch((e) => setError(e?.message || 'Failed to load transcript'))
            .finally(() => setLoading(false));
    }, [uid]);

    // Grouping & Sorting Logic
    const groupedMessages = useMemo(() => {
        if (!data?.messages) return [];

        // 1. Create a shallow copy and REVERSE it so it reads Oldest -> Newest
        const sortedMessages = [...data.messages].reverse();

        // 2. Map through to determine grouping
        return sortedMessages.reduce((acc: DiscordMessage[], curr, index) => {
            const prev = sortedMessages[index - 1];

            // Check if same author and within 5 minutes
            const isSameAuthor = prev && prev.author.username === curr.author.username;

            // Calculate time difference (if needed for strict grouping)
            // const timeDiff = prev ? new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime() : 0;
            // const isNear = timeDiff < 5 * 60 * 1000;

            // @ts-ignore
            curr.isCompact = isSameAuthor; // && isNear;
            acc.push(curr);
            return acc;
        }, []);
    }, [data]);

    if (loading) return <div className="p-10 text-xl text-center text-zinc-400">Loading transcript...</div>;
    if (error) return (
        <>
            <div className="p-10 text-center text-red-400 text-xl absolute mx-auto w-full">{error}</div>

            <ReportFinder />
        </>
    );

    return (
        <>
            <div className="min-h-screen bg-[#313338] font-sans text-zinc-200">

                {/* Header Bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#26272d] bg-[#313338] px-4 py-3 shadow-sm">
                    <div>
                        <h1 className="flex items-center gap-2 font-bold text-white">
                            <span className="text-zinc-400">#</span>
                            {data?.channelName || 'transcript'}
                        </h1>
                        <p className="text-xs text-zinc-400">UID: {uid}</p>
                    </div>
                    <div className="text-xs text-zinc-500">
                        Generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                </div>

                {/* Message List */}
                <div className="mx-auto flex max-w-[100vw] flex-col py-4">
                    {groupedMessages.map((m: any) => (
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

                                {/* Attachments (Check for null) */}
                                {(m.attachments || []).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(m.attachments || []).map((a: DiscordAttachment) => (
                                            <AttachmentDisplay key={a.url} attachment={a} />
                                        ))}
                                    </div>
                                )}

                                {/* Attachments (Check for null) */}
                                {(m.stickers || []).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 max-w-36 max-h-36">
                                        {(m.stickers || []).map((sticker: StickerEntry) => (
                                            <div key={sticker.url}>
                                                <img src={sticker.url} alt="" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Embeds (Check for null) */}
                                {(m.embeds || []).length > 0 && (
                                    <div className="grid max-w-[520px] gap-2 z-50">
                                        {(m.embeds || []).map((e: any, idx: number) => (
                                            <EmbedVisualizer
                                                key={`embed-${m.id}-${idx}`}
                                                embed={{
                                                    embed: {
                                                        title: e.title,
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
                    ))}
                </div>
            </div>
        </>
    );
}