"use client";

import { SegmentedControl } from "@/components/ui";

export function SegmentedFilter<T extends string>({
    options,
    value,
    onChange,
    className,
    ariaLabel = "Filter",
}: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    ariaLabel?: string;
}) {
    return (
        <div className={className}>
            <SegmentedControl label={ariaLabel} options={options} value={value} onChange={onChange} />
        </div>
    );
}
