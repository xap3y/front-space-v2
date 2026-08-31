"use client";

import {useEffect, useState} from "react";
import {FaBars, FaTableCellsLarge} from "react-icons/fa6";

export type LayoutMode = "compact" | "detailed";

export function useLayoutMode(storageKey: string) {
    const [value, setValue] = useState<LayoutMode>("compact");
    useEffect(() => {
        if (window.localStorage.getItem(storageKey) === "detailed") setValue("detailed");
    }, [storageKey]);
    const change = (next: LayoutMode) => { setValue(next); window.localStorage.setItem(storageKey, next); };
    return [value, change] as const;
}

export default function LayoutModeSwitch({value, onChange}: {value: LayoutMode; onChange: (value: LayoutMode) => void}) {
    return <div className="inline-flex h-9 items-center rounded-lg border-2 border-zinc-800 bg-primary1 p-0.5" aria-label="Layout">
        <button type="button" onClick={() => onChange("compact")} aria-pressed={value === "compact"} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors ${value === "compact" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><FaBars className="h-3 w-3"/><span className="hidden sm:inline">Compact</span></button>
        <button type="button" onClick={() => onChange("detailed")} aria-pressed={value === "detailed"} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors ${value === "detailed" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><FaTableCellsLarge className="h-3 w-3"/><span className="hidden sm:inline">Detailed</span></button>
    </div>;
}
