"use client";

import React from "react";
import { SaveButton as SharedSaveButton } from "@/components/ui";

type SaveButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    children?: React.ReactNode;
    className?: string;
};

export function SaveButton({ children = "Save", ...props }: SaveButtonProps) {
    return <SharedSaveButton {...props}>{children}</SharedSaveButton>;
}
