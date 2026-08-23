"use client";

import React from "react";
import { IoSearch } from "react-icons/io5";
import MainStringInput from "@/components/MainStringInput";

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
            <MainStringInput
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded border-zinc-700 bg-zinc-900"
                inputClassName="pl-8 pr-3 py-1.5 text-sm placeholder:text-zinc-500"
            />
        </div>
    );
}
