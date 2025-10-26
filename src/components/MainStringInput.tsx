"use client";

import React, { useState, forwardRef } from "react";

type InputTypes = "text" | "email" | "password" | "search" | "url" | "tel" | "datetime-local";

/**
 * A reusable string input with focus styles and Tailwind classes.
 * - Controlled or uncontrolled (supports value and/or defaultValue)
 * - onChange returns the string value and the original event
 * - Supports disabled, required, custom classes for wrapper and input
 * - Forwards ref to the underlying input
 */
export interface MainStringInputProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "onChange" | "className" | "value" | "defaultValue" | "disabled" | "required" | "type"
    > {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    required?: boolean;
    type?: InputTypes;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

const MainStringInput = forwardRef<HTMLInputElement, MainStringInputProps>(
    (
        {
            value,
            defaultValue,
            onChange,
            disabled = false,
            required = false,
            type = "text",
            placeholder = "in-primary",
            className,
            inputClassName,
            onFocus,
            onBlur,
            ...rest
        },
        ref
    ) => {
        const [isFocused, setIsFocused] = useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.value, e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            onBlur?.(e);
        };

        const isControlled = value !== undefined;

        return (
            <div
                className={cx(
                    // base wrapper styles
                    "border-2 duration-200 transition-all rounded",
                    // focus vs hover/idle styles (matches your example)
                    isFocused ? "in-shadow border-zinc-500" : "hover:border-zinc-700 border-primary0",
                    // disabled visuals
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <input
                    ref={ref}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={cx(
                        "w-full p-3 bg-transparent rounded outline-none",
                        disabled && "pointer-events-none",
                        inputClassName
                    )}
                    {...(isControlled ? { value } : { defaultValue })}
                    {...rest}
                />
            </div>
        );
    }
);

MainStringInput.displayName = "MainStringInput";

export default MainStringInput;