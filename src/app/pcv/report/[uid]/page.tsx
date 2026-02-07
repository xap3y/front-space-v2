'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { getDiscordTranscript } from '@/lib/apiGetters';
import { DiscordTranscript } from '@/types/discord';
// @ts-ignore
import { EmbedVisualizer } from 'embed-visualizer'
import 'embed-visualizer/dist/index.css'

export default function Page() {
    const { uid } = useParams<{ uid: string }>();
    const [data, setData] = useState<DiscordTranscript | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!uid) return;
        setLoading(true);
        setError(null);
        setNotFound(false);
        getDiscordTranscript(uid)
            .then((res) => {
                if (!res) {
                    setNotFound(true);
                } else {
                    setData(res.data as DiscordTranscript);
                }
            })
            .catch((e) => setError(e?.message || 'Failed to load transcript'))
            .finally(() => setLoading(false));
    }, [uid]);

    const title = useMemo(() => `Transcript ${uid}`, [uid]);

    return (
        <div className="box-primary mx-auto mt-10 w-full max-w-6xl space-y-4 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">{title}</h1>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">UID: {uid}</span>
                </div>
                {data?.generatedAt && (
                    <div className="text-xs text-zinc-400">
                        Generated at: <span className="text-zinc-200">{data.generatedAt}</span>
                    </div>
                )}
            </div>

            {/* States */}
            {loading && (
                <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">Loading transcript…</div>
            )}
            {error && (
                <div className="rounded border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">Error: {error}</div>
            )}
            {notFound && (
                <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                    Transcript not found for UID <span className="font-mono">{uid}</span>.
                </div>
            )}

            {/* Messages */}
            {data && !loading && !error && (
                <div className="rounded border border-zinc-800 bg-primary p-3 sm:p-4">
                    <div className="flex flex-col gap-4">
                        {data.messages.length === 0 && (
                            <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                                No messages in this transcript.
                            </div>
                        )}

                        {data.messages.map((m) => (
                            <div key={m.id} className="flex items-start gap-3">
                                {/* Avatar circle (initials fallback) */}
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold uppercase text-zinc-200">
                                    {m.author?.slice(0, 2) || '?'}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1 border-b border-zinc-900 pb-3">
                                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                                        <span className="font-semibold text-zinc-100">{m.author}</span>
                                        <span className="text-xs text-zinc-500">{m.timestamp}</span>
                                        <span className="text-[11px] text-zinc-500">#{m.channelId}</span>
                                    </div>

                                    {m.content ? (
                                        <div className="whitespace-pre-wrap text-sm text-zinc-200">{m.content}</div>
                                    ) : (
                                        <div className="text-sm italic text-zinc-500">No text content</div>
                                    )}

                                    {/* Attachments */}
                                    {m.attachments?.length ? (
                                        <div className="text-xs text-zinc-300 space-y-1">
                                            <div className="font-semibold text-zinc-200">Attachments</div>
                                            <ul className="space-y-1">
                                                {m.attachments.map((a) => (
                                                    <li key={a.url} className="flex items-center gap-2">
                                                        <a
                                                            href={a.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="break-all text-blue-400 underline"
                                                        >
                                                            {a.filename}
                                                        </a>
                                                        <span className="text-zinc-500">({a.size} bytes)</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}

                                    {/* Embeds */}
                                    {m.embeds?.length ? (
                                        <div className="space-y-2">
                                            {m.embeds.map((e, idx) => (
                                                <EmbedVisualizer
                                                    key={`embed-${m.id}-${idx}`}
                                                    embed={{
                                                        embed: {
                                                            title: e.title,
                                                            timestamp: e.timestamp || undefined,
                                                            description: e.description || undefined,
                                                            url: e.url || undefined,
                                                            ...(e.fields
                                                                ? {
                                                                    fields: e.fields.map((f) => ({
                                                                          name: f.name,
                                                                          value: f.value,
                                                                          inline: f.inline || false,
                                                                      })),
                                                                  }
                                                                : {}),
                                                        }
                                                    }}
                                                    onError={(e: any) =>
                                                        console.error("Error while parsing embed:", e)
                                                    }
                                                />
                                                /*<div
                                                    key={idx}
                                                    className={clsx(
                                                        'rounded border p-3 text-sm',
                                                        e.color ? '' : 'border-zinc-800 bg-[#1c1f2b]'
                                                    )}
                                                    style={
                                                        e.color
                                                            ? { borderColor: e.color, backgroundColor: 'rgba(255,255,255,0.02)' }
                                                            : undefined
                                                    }
                                                >
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {e.title && <div className="font-semibold text-zinc-100">{e.title}</div>}
                                                        {e.timestamp && <div className="text-xs text-zinc-500">{e.timestamp}</div>}
                                                    </div>
                                                    {e.description && (
                                                        <div className="mt-1 whitespace-pre-wrap text-zinc-200">{e.description}</div>
                                                    )}
                                                    {e.url && (
                                                        <div className="mt-1 text-xs">
                                                            <a
                                                                className="break-all text-blue-400 underline"
                                                                href={e.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                {e.url}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {(e.author || e.footer) && (
                                                        <div className="mt-1 flex flex-col gap-1 text-xs text-zinc-400">
                                                            {e.author && <div>Author: {e.author}</div>}
                                                            {e.footer && <div>Footer: {e.footer}</div>}
                                                        </div>
                                                    )}
                                                    {e.fields?.length ? (
                                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                            {e.fields.map((f, fIdx) => (
                                                                <div
                                                                    key={fIdx}
                                                                    className={clsx(
                                                                        'rounded border border-zinc-800 bg-[#0f1117] p-2 text-xs',
                                                                        f.inline && 'sm:col-span-1'
                                                                    )}
                                                                >
                                                                    <div className="font-semibold text-zinc-100">{f.name}</div>
                                                                    <div className="whitespace-pre-wrap text-zinc-200">{f.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>*/
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}