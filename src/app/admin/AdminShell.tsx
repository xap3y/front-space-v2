"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import AdminNavBar, { type AdminNavItem } from "@/app/admin/AdminNavBar";

type Props = {
    children: ReactNode;
};

export default function AdminShell({ children }: Props) {
    const navItems: AdminNavItem[] = useMemo(
        () => [
            { title: "Overview", href: "/admin", page: "overview" },
            { title: "Users", href: "/admin/users", page: "users" },
            { title: "Invites", href: "/admin/invites", page: "invites" },
            { title: "System", href: "/admin/system", page: "system" },
            { title: "Logs", href: "/admin/logs", page: "logs" },
            { title: "Images", href: "/admin/images", page: "images" },
            { title: "Pastes", href: "/admin/pastes", page: "pastes" },
            { title: "Urls", href: "/admin/urls", page: "urls" },
            { title: "Emails", href: "/admin/emails", page: "emails" },
        ],
        []
    );

    return (
        <div
            className="
        min-h-[100dvh] text-white
        flex flex-col xl:flex-row
        xl:h-[100dvh] xl:overflow-hidden
      "
        >
            <AdminNavBar brandTitle="ADMIN" items={navItems} />
            <main className="flex-1 p-4 xl:p-6 xl:overflow-y-auto">
                {children}
            </main>
        </div>
    );
}