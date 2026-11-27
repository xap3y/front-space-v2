"use client";

import {useLayoutEffect, useRef, type ReactNode} from "react";
import {createPortal} from "react-dom";

const edgeGap = 8;
const pointerGap = 12;

export default function FloatingHoverCard({open, position, children, className = "flex gap-4 rounded-xl border bg-secondary p-4 shadow-lg"}: {
    open: boolean;
    position: {x: number; y: number};
    children: ReactNode;
    className?: string;
}) {
    const card = useRef<HTMLDivElement>(null);
    const {x, y} = position;

    useLayoutEffect(() => {
        const element = card.current;
        if (!open || !element) return;

        const place = () => {
            const {clientWidth, clientHeight} = document.documentElement;
            const {width, height} = element.getBoundingClientRect();
            const right = x + pointerGap;
            const below = y + pointerGap;
            const left = right + width + edgeGap <= clientWidth ? right : x - width - pointerGap;
            const top = below + height + edgeGap <= clientHeight ? below : y - height - pointerGap;
            element.style.left = `${Math.max(edgeGap, Math.min(left, clientWidth - width - edgeGap))}px`;
            element.style.top = `${Math.max(edgeGap, Math.min(top, clientHeight - height - edgeGap))}px`;
            element.style.visibility = "visible";
        };

        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
    }, [open, x, y]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={card}
            data-floating-hover-card=""
            aria-hidden="true"
            className={`pointer-events-none fixed z-50 max-h-[calc(100%_-_16px)] max-w-[calc(100%_-_16px)] overflow-hidden ${className}`}
            style={{left: 0, top: 0, visibility: "hidden"}}
        >
            {children}
        </div>,
        document.body,
    );
}
