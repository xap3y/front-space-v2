"use client";

import React, { useMemo, useState } from "react";

function clsx(...arr: Array<string | false | null | undefined>) {
    return arr.filter(Boolean).join(" ");
}

export function SegmentedFilter<T extends string>({
                                                      options,
                                                      value,
                                                      onChange,
                                                      className,
                                                      ariaLabel = "Filter",
                                                  }: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (v: T) => void;
    className?: string;
    ariaLabel?: string;
}) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const selectedIndex = useMemo(
        () => Math.max(0, options.findIndex((o) => o.value === value)),
        [options, value]
    );
    const indicatorIndex = hoverIndex ?? selectedIndex;
    const count = options.length;
    const widthPct = 100 / count;

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={clsx(
                "relative inline-flex select-none items-center rounded-lg border border-zinc-700 bg-zinc-900 p-1 text-xs",
                "shadow-sm",
                className
            )}
            onMouseLeave={() => setHoverIndex(null)}
        >
            {/* Option buttons */}
            {options.map((opt, i) => {
                const selected = i === selectedIndex;
                return (
                    <button
                        key={opt.value}
                        role="radio"
                        aria-checked={selected}
                        type="button"
                        onMouseEnter={() => setHoverIndex(i)}
                        onFocus={() => setHoverIndex(i)}
                        onBlur={() => setHoverIndex(null)}
                        onClick={() => onChange(opt.value)}
                        className={clsx(
                            "relative z-10 rounded-lg px-3 py-1.5",
                            "transition-colors duration-200",
                            selected ? "text-zinc-100 bg-zinc-800" : "text-zinc-400 hover:text-yellow-200"
                        )}
                        title={opt.label}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}