"use client";

import { Children, forwardRef, type ButtonHTMLAttributes } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { HoverButton } from "@/components/HoverDiv";
import styles from "./ui.module.css";

export interface NativeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    layout?: "action" | "row";
    variant?: "primary" | "secondary" | "save" | "delete" | "warning" | "ghost";
}

/** Native semantics are retained for forms, refs, menu items and event handlers. */
export const NativeButton = forwardRef<HTMLButtonElement, NativeButtonProps>(function NativeButton(
    { type, variant = type === "submit" ? "primary" : "secondary", layout = "action", className, children, ...props },
    ref,
) {
    return (
        <HoverButton
            {...props}
            ref={ref}
            type={type}
            variant={variant}
            className={[layout === "row" && styles.rowButton, className].filter(Boolean).join(" ")}
        >
            {children}
        </HoverButton>
    );
});

export const NativeDeleteButton = forwardRef<HTMLButtonElement, Omit<NativeButtonProps, "variant">>(function NativeDeleteButton(
    { children, className, ...props },
    ref,
) {
    const hasLabel = Children.toArray(children).some((child) => typeof child !== "string" || child.trim().length > 0);

    return (
        <NativeButton {...props} ref={ref} variant="delete" className={[!hasLabel && styles.iconAction, className].filter(Boolean).join(" ")}>
            <FaTrashCan aria-hidden="true" />
            {children}
        </NativeButton>
    );
});
