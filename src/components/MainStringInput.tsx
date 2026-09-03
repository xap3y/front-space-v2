"use client";

import React, { useState, forwardRef } from "react";

type InputTypes = "text" | "email" | "password" | "search" | "url" | "tel" | "datetime-local" | "number" | "date" | "time";

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
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    required?: boolean;
    type?: InputTypes;
    placeholder?: string;
    borderColor?: string;
    className?: string;
    inputClassName?: string;
    suffix?: React.ReactNode;
    suffixClassName?: string;
    numericOnly?: boolean;
    multiline?: boolean;
    rows?: number;
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
            borderColor = "border-primary0",
            className,
            inputClassName,
            suffix,
            suffixClassName,
            numericOnly = false,
            multiline = false,
            rows = 8,
            onFocus,
            onBlur,
            ...rest
        },
        ref
    ) => {
        const [isFocused, setIsFocused] = useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let nextValue = e.target.value;

            if (numericOnly) {
                nextValue = nextValue.replace(/[^0-9]/g, "");
                e.target.value = nextValue;
            } else if (type === "number") {
                const permitsNegative = rest.min === undefined || Number(rest.min) < 0;
                nextValue = nextValue.replace(/[^0-9.-]/g, "");

                const negative = permitsNegative && nextValue.startsWith("-");
                nextValue = nextValue.replace(/-/g, "");

                const decimalIndex = nextValue.indexOf(".");
                if (decimalIndex >= 0) {
                    nextValue = nextValue.slice(0, decimalIndex + 1) + nextValue.slice(decimalIndex + 1).replace(/\./g, "");
                }

                nextValue = (negative ? "-" : "") + nextValue;
                e.target.value = nextValue;
            }

            onChange?.(nextValue, e);
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
                    "relative border-2 duration-200 transition-all rounded overflow-visible",
                    // focus vs hover/idle styles
                    isFocused ? "in-shadow border-zinc-500" : "hover:border-zinc-700 border-primary0",
                    // disabled visuals
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                {multiline ? <textarea
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    rows={rows}
                    value={value}
                    onChange={event => onChange?.(event.target.value, event as unknown as React.ChangeEvent<HTMLInputElement>)}
                    onFocus={event => { setIsFocused(true); onFocus?.(event as unknown as React.FocusEvent<HTMLInputElement>); }}
                    onBlur={event => { setIsFocused(false); onBlur?.(event as unknown as React.FocusEvent<HTMLInputElement>); }}
                    className={cx("block w-full resize-y bg-transparent p-3 text-white outline-none placeholder-gray-500", inputClassName)}
                /> : <input
                    ref={ref}
                    {...rest}
                    type={numericOnly ? "text" : type}
                    inputMode={numericOnly ? "numeric" : rest.inputMode}
                    pattern={numericOnly ? "[0-9]*" : rest.pattern}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onChange={handleChange}
                    onInput={numericOnly ? event => {
                        const input = event.currentTarget;
                        const digits = input.value.replace(/[^0-9]/g, "");
                        if (input.value !== digits) input.value = digits;
                    } : rest.onInput}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={cx(
                        "p-3 w-full bg-transparent rounded-none outline-none text-white placeholder-gray-500",
                        type === "number" && "main-string-input-number",
                        suffix != null && "pr-10",
                        disabled && "pointer-events-none",
                        inputClassName
                    )}
                    {...(isControlled ? { value } : { defaultValue })}
                />}
                {suffix != null && (
                    <span
                        aria-hidden="true"
                        className={cx(
                            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-500",
                            suffixClassName
                        )}
                    >
                        {suffix}
                    </span>
                )}
            </div>
        );
    }
);

MainStringInput.displayName = "MainStringInput";

export default MainStringInput;
