"use server";

import {RoleType} from "@/types/user";
import {JSX} from "react";

export const getUserRoleBadgeServer = async (
    role: RoleType,
    opts?: { size?: "xs" | "sm" | "md" }
): Promise<JSX.Element> => {
    const size = opts?.size ?? "sm";

    const sizeClass =
        size === "xs"
            ? "text-[10px] px-2 py-0.5"
            : size === "md"
                ? "text-sm px-3 py-1"
                : "text-xs px-2.5 py-0.5";

    // Keep your "border same" vibe: not too rounded, consistent border, slightly cleaner typography
    const base = `inline-flex items-center border border-white/10 rounded-md font-semibold tracking-wide leading-none ${sizeClass}`;

    switch (role) {
        case "OWNER":
            return (
                <span className={`${base} bg-yellow-900/80 text-yellow-200`}>
          owner
        </span>
            );

        case "ADMIN":
            return (
                <span className={`${base} bg-red-900/70 text-red-200`}>
          admin
        </span>
            );

        case "MODERATOR":
            return (
                <span className={`${base} bg-blue-500/20 text-blue-200`}>
          moderator
        </span>
            );

        case "USER":
            return (
                <span className={`${base} bg-gray-700/40 text-gray-200`}>
          user
        </span>
            );

        case "GUEST":
            return (
                <span className={`${base} bg-primary-darker/70 text-white`}>
          guest
        </span>
            );

        case "BANNED":
            return (
                <span className={`${base} bg-red-600/70 text-white font-bold`}>
          BANNED
        </span>
            );

        case "DELETED":
            return (
                <span className={`${base} bg-red-600/70 text-white font-bold`}>
          DELETED
        </span>
            );

        case "TESTER":
            return (
                <span className="inline-flex items-center gap-2">
          <span className={`${base} bg-gray-700/40 text-gray-200`}>tester</span>
          <span className={`${base} bg-red-900/70 text-red-200`}>admin</span>
        </span>
            );

        default:
            return (
                <span className={`${base} bg-gray-700/40 text-gray-200`}>
          user
        </span>
            );
    }
};