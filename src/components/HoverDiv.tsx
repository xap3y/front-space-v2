"use client";

import React, { useState, forwardRef } from "react";

/**
 * A reusable string input with focus styles and Tailwind classes.
 * - Controlled or uncontrolled (supports value and/or defaultValue)
 * - onChange returns the string value and the original event
 * - Supports disabled, required, custom classes for wrapper and input
 * - Forwards ref to the underlying input
 */
export interface HoverDivProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "className"> {
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

const HoverDiv = forwardRef<HTMLInputElement, HoverDivProps>(
    (
        {
            children,
            disabled,
            className,
            inputClassName,
            ...rest
        },
        ref
    ) => {
        const [isHover, setIsHover] = useState(false);

        return (
            <div
                className={cx(
                    // base wrapper styles
                    "border-2 bg-primary1 duration-200 transition-all rounded",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                    isHover ? "in-shadow border-zinc-700" : "border-zinc-800",
                    inputClassName
                )}
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
            >
                <div
                    ref={ref}
                    className={cx(
                        "p-3 w-full bg-transparent rounded outline-none",
                        className
                    )}
                    {...rest}
                >
                    {children}
                </div>
            </div>
        );
    }
);

HoverDiv.displayName = "HoverDiv";

export default HoverDiv;