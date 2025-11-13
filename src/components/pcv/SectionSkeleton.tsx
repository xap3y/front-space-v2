"use client";

function clsx(...arr: Array<string | false | null | undefined>) {
    return arr.filter(Boolean).join(" ");
}

export function SectionSkeleton({ rows = 4, rowHeight = "h-14" }: { rows?: number; rowHeight?: string }) {
    return (
        <div className="animate-pulse space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={clsx("w-full rounded bg-zinc-800", rowHeight)} />
            ))}
        </div>
    );
}