"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./ui.module.css";

export const SelectionInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function SelectionInput(
    { className, type = "checkbox", ...props },
    ref,
) {
    return (
        <input
            {...props}
            ref={ref}
            type={type}
            className={[styles.selectionInput, className].filter(Boolean).join(" ")}
        />
    );
});
