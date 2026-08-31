"use client";

import React, {forwardRef} from "react";
import {FaCircleExclamation, FaFloppyDisk, FaTrashCan} from "react-icons/fa6";

export type HoverDivType = "DELETE" | "WARN" | "SAVE" | "INFO" | "DANGER";

/** Shared interactive surface. With no type or icon it preserves the original HoverDiv appearance. */
export interface HoverDivProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "className"> {
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    children?: React.ReactNode;
    type?: HoverDivType;
    icon?: React.ReactNode;
    bg?: string;
    text?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

const schemes: Record<HoverDivType, {base: string; interactive: string}> = {
    INFO: {base: "border-zinc-800 bg-primary1 text-zinc-100", interactive: "hover:border-zinc-700 hover:in-shadow focus-visible:border-zinc-700 focus-visible:in-shadow"},
    SAVE: {base: "border-emerald-800/70 bg-emerald-950/45 text-emerald-300", interactive: "hover:border-emerald-500/80 hover:shadow-[0_0_0_3px_rgba(16,185,129,.10)] focus-visible:border-emerald-500/80 focus-visible:shadow-[0_0_0_3px_rgba(16,185,129,.10)]"},
    WARN: {base: "border-amber-800/70 bg-amber-950/45 text-amber-300", interactive: "hover:border-amber-500/80 hover:shadow-[0_0_0_3px_rgba(245,158,11,.10)] focus-visible:border-amber-500/80 focus-visible:shadow-[0_0_0_3px_rgba(245,158,11,.10)]"},
    DELETE: {base: "border-red-800/70 bg-red-950/45 text-red-300", interactive: "hover:border-red-500/80 hover:shadow-[0_0_0_3px_rgba(239,68,68,.10)] focus-visible:border-red-500/80 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,.10)]"},
    DANGER: {base: "border-red-950 bg-[#26090b] text-red-400", interactive: "hover:border-red-700 hover:shadow-[0_0_0_3px_rgba(127,29,29,.18)] focus-visible:border-red-700 focus-visible:shadow-[0_0_0_3px_rgba(127,29,29,.18)]"},
};

const HoverDiv = forwardRef<HTMLDivElement, HoverDivProps>(
    (
        {
            children,
            disabled,
            className,
            inputClassName,
            type = "INFO",
            icon,
            bg,
            text,
            onClick,
            onKeyDown,
            style,
            role,
            tabIndex,
            ...rest
        },
        ref
    ) => {
        const scheme = schemes[type];
        return (
            <div
                {...rest}
                ref={ref}
                role={role ?? "button"}
                tabIndex={disabled ? -1 : (tabIndex ?? 0)}
                aria-disabled={disabled || undefined}
                className={cx(
                    "inline-flex items-center justify-center gap-2 rounded border-2 outline-none transition-all duration-200 active:scale-[.98]",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                    scheme.base,
                    !disabled && scheme.interactive,
                    !className && "p-3",
                    inputClassName,
                    className
                )}
                style={{...style, backgroundColor: bg ?? style?.backgroundColor, color: text ?? style?.color}}
                onClick={(event) => {
                    if (disabled) { event.preventDefault(); event.stopPropagation(); return; }
                    onClick?.(event);
                }}
                onKeyDown={(event) => {
                    if (!disabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.currentTarget.click(); }
                    onKeyDown?.(event);
                }}
            >
                {icon}
                {children}
            </div>
        );
    }
);

HoverDiv.displayName = "HoverDiv";

export const SaveButton = (props: Omit<HoverDivProps, "type">) => <HoverDiv type="SAVE" icon={<FaFloppyDisk/>} {...props}/>;
export const DeleteButton = (props: Omit<HoverDivProps, "type">) => <HoverDiv type="DELETE" icon={<FaTrashCan/>} {...props}/>;
export const WarnButton = (props: Omit<HoverDivProps, "type">) => <HoverDiv type="WARN" icon={<FaCircleExclamation/>} {...props}/>;
export const DangerButton = (props: Omit<HoverDivProps, "type">) => <HoverDiv type="DANGER" icon={<FaCircleExclamation/>} {...props}/>;

export default HoverDiv;
