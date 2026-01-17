import React from "react";

type SaveButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    children?: React.ReactNode;
    className?: string;
};

export function SaveButton({
                               onClick,
                               disabled = false,
                               loading = false,
                               children = "Save",
                               className = "",
                           }: SaveButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={[
                "inline-flex items-center justify-center gap-2",
                "px-4 py-2 rounded-md",
                "border-2 border-green-950",
                "bg-green-900/70 text-green-600",
                "font-semibold tracking-wide leading-none",
                "transition-colors duration-150",
                "hover:bg-green-900/60 hover:text-green-700",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                className,
            ].join(" ")}
        >
            {loading ? "Saving..." : children}
        </button>
    );
}