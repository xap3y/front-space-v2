"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import styles from "./ui.module.css";

interface SelectControlProps extends SelectHTMLAttributes<HTMLSelectElement> {
    compact?: boolean;
}

export const SelectControl = forwardRef<HTMLSelectElement, SelectControlProps>(function SelectControl(
    { className, compact = false, ...props },
    ref,
) {
    return (
        <select
            {...props}
            ref={ref}
            className={[styles.selectControl, compact && styles.compactSelect, className].filter(Boolean).join(" ")}
        />
    );
});
