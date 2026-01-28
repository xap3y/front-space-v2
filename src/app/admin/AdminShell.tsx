"use client";

import type { ReactNode } from "react";
import {useEffect, useMemo} from "react";
import AdminNavBar, { type AdminNavItem } from "@/app/admin/AdminNavBar";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {useRouter} from "next/navigation";

type Props = {
    children: ReactNode;
};

export default function AdminShell({ children }: Props) {
    const router = useRouter();
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

    const { user, loadingUser } = useUser();

    useEffect(() => {
        if (!user && !loadingUser || (user && (user.role != "OWNER" && user.role != "ADMIN") && !loadingUser)) {
            router.replace("/login");
        }
    }, [user, loadingUser, router]);

    if (loadingUser || !user || (user.role != "OWNER" && user.role != "ADMIN")) {
        return <LoadingPage />;
    }

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