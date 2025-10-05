"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option<T extends string> = {
    value: T;
    label: string;
    description?: string;
};

type SelectMenuProps<T extends string> = {
    id?: string;
    value: T | null | undefined;
    onChange: (v: T | null) => void;
    options: Option<T>[];
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
    disabled?: boolean;
    includeNullOption?: boolean;
    nullLabel?: string;
};

export default function SelectMenu<T extends string>({
                                                         id,
                                                         value,
                                                         onChange,
                                                         options,
                                                         placeholder = "Select...",
                                                         className = "",
                                                         buttonClassName = "",
                                                         menuClassName = "",
                                                         optionClassName = "",
                                                         disabled = false,
                                                         includeNullOption = true,
                                                         nullLabel = "None",
                                                     }: SelectMenuProps<T>) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [highlightIndex, setHighlightIndex] = useState<number>(-1);

    const flatOptions = useMemo(() => {
        const base = includeNullOption ? [{ value: null, label: nullLabel }] : [];
        return [...base, ...options] as Array<{ value: T | null; label: string; description?: string }>;
    }, [options, includeNullOption, nullLabel]);

    const selected = useMemo(
        () => flatOptions.find((o) => o.value === value) || null,
        [flatOptions, value]
    );

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!open) return;
            const t = e.target as Node;
            if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
            setOpen(false);
        };
        const onDocKey = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
                btnRef.current?.focus();
            }
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onDocKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onDocKey);
        };
    }, [open]);

    const toggle = () => {
        if (disabled) return;
        setOpen((o) => {
            const next = !o;
            if (next) {
                // set initial highlight
                const idx = Math.max(
                    0,
                    flatOptions.findIndex((o) => o.value === value)
                );
                setHighlightIndex(idx === -1 ? 0 : idx);
            }
            return next;
        });
    };

    const onKeyDownBtn = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!open) {
                setOpen(true);
                // highlight current or first
                const idx = Math.max(
                    0,
                    flatOptions.findIndex((o) => o.value === value)
                );
                setHighlightIndex(idx === -1 ? 0 : idx);
            }
        }
    };

    const onKeyDownMenu = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, flatOptions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Home") {
            e.preventDefault();
            setHighlightIndex(0);
        } else if (e.key === "End") {
            e.preventDefault();
            setHighlightIndex(flatOptions.length - 1);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = flatOptions[highlightIndex];
            if (opt) {
                onChange(opt.value as T | null);
                setOpen(false);
                btnRef.current?.focus();
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            btnRef.current?.focus();
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                id={id}
                ref={btnRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? `${id || "select"}-menu` : undefined}
                onClick={toggle}
                onKeyDown={onKeyDownBtn}
                disabled={disabled}
                className={[
                    "w-full inline-flex items-center justify-between rounded-lg border border-white/10",
                    "bg-primary text-sm text-gray-200 px-3 py-2",
                    "hover:bg-white/5 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    buttonClassName,
                ].join(" ")}
            >
        <span className="truncate">
          {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
                <svg
                    className={`h-4 w-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.19l3.71-2.96a.75.75 0 01.94 1.17l-4.24 3.39a.75.75 0 01-.94 0L5.21 8.4a.75.75 0 01.02-1.19z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {open && (
                <div
                    id={`${id || "select"}-menu`}
                    ref={menuRef}
                    role="listbox"
                    tabIndex={-1}
                    onKeyDown={onKeyDownMenu}
                    className={[
                        "absolute left-0 right-0 mt-1 z-20",
                        "rounded-lg border border-white/10 bg-primary shadow-xl",
                        "max-h-64 overflow-auto",
                        menuClassName,
                    ].join(" ")}
                >
                    {flatOptions.map((opt, idx) => {
                        const isSelected = value === opt.value;
                        const isHighlighted = idx === highlightIndex;
                        return (
                            <div
                                key={`${String(opt.value)}-${idx}`}
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onChange(opt.value as T | null);
                                    setOpen(false);
                                    btnRef.current?.focus();
                                }}
                                className={[
                                    "px-3 py-2 cursor-pointer select-none",
                                    "flex items-center justify-between gap-3",
                                    isHighlighted ? "bg-white/5" : "",
                                    isSelected ? "text-sky-400" : "text-gray-200",
                                    optionClassName,
                                ].join(" ")}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm">{opt.label}</span>
                                    {opt.description && (
                                        <span className="text-xs text-gray-400">{opt.description}</span>
                                    )}
                                </div>
                                {isSelected && (
                                    <svg
                                        className="h-4 w-4 text-sky-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.415 0l-3.5-3.5A1 1 0 016.954 9.04l2.793 2.793 6.543-6.543a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}