"use client";

import React from "react";
import { IoSearch } from "react-icons/io5";

export function SearchInput({
                                value,
                                onChange,
                                placeholder = "Search...",
                                className = "",
                            }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={`relative ${className}`}>
            <IoSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded border border-zinc-700 bg-zinc-900 pl-8 pr-3 py-1.5 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
            />
        </div>
    );
}