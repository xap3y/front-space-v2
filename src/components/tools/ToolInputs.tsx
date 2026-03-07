"use client";

import React from "react";

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
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-neutral-500 uppercase font-semibold">{label}</label>
                <span className="text-xs font-mono font-bold text-white">
                    {value}{suffix && <span className="text-neutral-500 ml-0.5">{suffix}</span>}
                </span>
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
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50"
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