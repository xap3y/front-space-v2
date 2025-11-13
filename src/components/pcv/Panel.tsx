"use client";

import React from "react";

function clsx(...arr: Array<string | false | null | undefined>) {
    return arr.filter(Boolean).join(" ");
}

export function Panel({
                          title,
                          subtitle,
                          actions,
                          children,
                          className,
                      }: {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={clsx("flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow", className)}>
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/60 px-3 py-2">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{title}</div>
                    {subtitle ? <div className="truncate text-xs text-zinc-400">{subtitle}</div> : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
            <div className="p-3">{children}</div>
        </section>
    );
}