"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import AdminNavBar, { type AdminNavItem } from "@/app/admin/AdminNavBar";

// Adjust these imports to your real paths:
import { useUser } from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";

export default function AdminShell({ children }: { children: ReactNode }) {
    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    const navItems: AdminNavItem[] = useMemo(
        () => [
            { title: "Overview", href: "/admin", page: "overview" },
            { title: "Users", href: "/admin/users", page: "users" },
            { title: "Invites", href: "/admin/invites", page: "invites" },
            { title: "System", href: "/admin/system", page: "settings" },
            { title: "Logs", href: "/admin/logs", page: "logs" },
        ],
        []
    );

    useEffect(() => {
        if (loadingUser) return;
        if (!user || user.role !== "OWNER") {
            router.push("/login");
        }
    }, [user, loadingUser, error, router]);

    if (loadingUser || !user || user.role !== "OWNER") {
        return <LoadingPage />;
    }

    return (
        <div className="flex min-h-[100dvh] text-white">
            <AdminNavBar brandTitle="ADMIN" items={navItems} />
            <main className="flex-1 p-4 xl:p-6">{children}</main>
        </div>
    );
}