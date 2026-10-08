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
                          collapsed = false,
                      }: {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    collapsed?: boolean;
}) {
    return (
        <section className={clsx("flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow", className)}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/60 px-3 py-3">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{title}</div>
                    {subtitle ? <div className="truncate text-xs text-zinc-400">{subtitle}</div> : null}
                </div>
                {actions ? <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
            {!collapsed && <div className="p-3">{children}</div>}
        </section>
    );
}
