"use client";

import React, {useEffect, useState} from "react";
import MainStringInput from "@/components/MainStringInput";

export function NumberInput({
                                label,
                                value,
                                onChange,
                                min,
                                max,
                                step = 1,
                                suffix,
                                disabled,
                            }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    disabled?: boolean;
}) {
    const [draft, setDraft] = useState(String(value));
    const integerOnly = Number.isInteger(step);
    const permitsNegative = min == null || min < 0;

    useEffect(() => setDraft(String(value)), [value]);

    const commit = () => {
        const parsed = Number(draft);
        if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
        }
        const clamped = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, parsed));
        const base = min ?? 0;
        const stepped = base + Math.round((clamped - base) / step) * step;
        const precision = integerOnly ? 0 : Math.min(6, (String(step).split(".")[1] || "").length);
        const next = Number(stepped.toFixed(precision));
        setDraft(String(next));
        onChange(next);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-neutral-500 uppercase font-semibold">{label}</label>
                <MainStringInput
                    aria-label={`${label} value`}
                    type={integerOnly && !permitsNegative ? "text" : "number"}
                    numericOnly={integerOnly && !permitsNegative}
                    inputMode={integerOnly ? "numeric" : "decimal"}
                    min={min}
                    max={max}
                    step={step}
                    value={draft}
                    suffix={suffix}
                    disabled={disabled}
                    onChange={(next) => {
                        if (integerOnly && permitsNegative) {
                            const negative = next.startsWith("-");
                            const digits = next.replace(/\D/g, "");
                            setDraft((negative ? "-" : "") + digits);
                            return;
                        }
                        setDraft(next);
                    }}
                    onBlur={commit}
                    onKeyDown={event => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") { setDraft(String(value)); event.currentTarget.blur(); }
                    }}
                    className="!w-auto !rounded-md !border-transparent !bg-zinc-900/80 !shadow-none hover:!border-transparent focus-within:!border-transparent"
                    inputClassName={`!w-[72px] !px-2 !py-1 text-right font-mono text-xs font-bold ${suffix ? "!pr-7" : ""}`}
                    suffixClassName="!right-1.5 !text-[9px]"
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
        </div>
    );
}

export function TextInput({
                              label,
                              value,
                              onChange,
                              placeholder,
                              disabled,
                          }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="text-[10px] text-neutral-500 uppercase font-semibold mb-1 block">{label}</label>
            <MainStringInput
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-neutral-950 border-neutral-800 rounded-lg disabled:opacity-50"
                inputClassName="py-2 px-3 text-sm font-mono"
            />
        </div>
    );
}

export function SelectInput({
                                label,
                                value,
                                onChange,
                                options,
                                disabled,
                            }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="text-[10px] text-neutral-500 uppercase font-semibold mb-1 block">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function CheckboxInput({
                                  label,
                                  checked,
                                  onChange,
                                  disabled,
                              }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
                onClick={() => !disabled && onChange(!checked)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    checked
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-neutral-900 border-neutral-700"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {checked && <span className="text-[10px] text-white font-bold">✓</span>}
            </div>
            <span className="text-xs text-neutral-400">{label}</span>
        </label>
    );
}
