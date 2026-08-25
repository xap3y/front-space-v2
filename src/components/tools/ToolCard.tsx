"use client";

import React, { ReactNode } from "react";

export default function ToolCard({
                                     title,
                                     description,
                                     children,
                                 }: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="box-primary rounded-xl p-4 shadow-xl">
            <div className="mb-3">
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">{description}</p>
            </div>
            <div className="flex flex-col gap-3">{children}</div>
        </div>
    );
}
