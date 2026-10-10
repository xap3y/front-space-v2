"use client";

import {useEffect, useState} from "react";
import {SegmentedControl} from "@/components/ui";

export type LayoutMode = "compact" | "detailed";

export function useLayoutMode(storageKey: string) {
    const [value, setValue] = useState<LayoutMode>("compact");
    useEffect(() => {
        if (window.localStorage.getItem(storageKey) === "detailed") {
            setValue("detailed");
        }
    }, [storageKey]);
    const change = (next: LayoutMode) => {
        setValue(next);
        window.localStorage.setItem(storageKey, next);
    };
    return [value, change] as const;
}

export default function LayoutModeSwitch({value, onChange}: {value: LayoutMode; onChange: (value: LayoutMode) => void}) {
    return (
        <SegmentedControl
            label="Layout"
            value={value}
            onChange={onChange}
            options={[
                {value: "compact", label: "Compact"},
                {value: "detailed", label: "Detailed"},
            ]}
        />
    );
}
