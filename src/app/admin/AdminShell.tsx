"use client";

import type { ReactNode } from "react";
import {useEffect, useMemo} from "react";
import AdminNavBar, { type AdminNavItem } from "@/app/admin/AdminNavBar";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {usePathname, useRouter} from "next/navigation";
import {canAccessAdminPath, firstAdminPath} from "@/lib/permissions";
import {FaDatabase, FaEnvelope, FaFileArchive, FaImage, FaLink, FaPaste, FaUserCog, FaUsers} from "react-icons/fa";
import {MdDashboard, MdHistory, MdSettings, MdSpeed} from "react-icons/md";

type Props = {
    children: ReactNode;
};

export default function AdminShell({ children }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const navItems: AdminNavItem[] = useMemo(
        () => [
            { title: "Overview", href: "/admin", page: "overview", icon: <MdDashboard className="h-5 w-5" /> },
            { title: "Users", href: "/admin/users", page: "users", icon: <FaUsers className="h-5 w-5" /> },
            { title: "Limits", href: "/admin/limits", page: "limits", icon: <MdSpeed className="h-5 w-5" /> },
            { title: "Invites", href: "/admin/invites", page: "invites", icon: <FaUserCog className="h-5 w-5" /> },
            { title: "System", href: "/admin/system", page: "system", icon: <MdSettings className="h-5 w-5" /> },
            { title: "Settings", href: "/admin/settings", page: "settings", icon: <MdSettings className="h-5 w-5" /> },
            { title: "Logs", href: "/admin/logs", page: "logs", icon: <MdHistory className="h-5 w-5" /> },
            { title: "Images", href: "/admin/images", page: "images", icon: <FaImage className="h-5 w-5" /> },
            { title: "Pastes", href: "/admin/pastes", page: "pastes", icon: <FaPaste className="h-5 w-5" /> },
            { title: "File Packs", href: "/admin/files", page: "files", icon: <FaFileArchive className="h-5 w-5" /> },
            { title: "Urls", href: "/admin/urls", page: "urls", icon: <FaLink className="h-5 w-5" /> },
            { title: "Emails", href: "/admin/emails", page: "emails", icon: <FaEnvelope className="h-5 w-5" /> },
            { title: "Mc-Reports", href: "/admin/mc-reports", page: "mc-reports", icon: <FaDatabase className="h-5 w-5" /> },
            { title: "Active Sessions", href: "/admin/sessions", page: "sessions", icon: <MdHistory className="h-5 w-5" /> },
            { title: "Permissions", href: "/admin/permissions", page: "permissions", icon: <FaUserCog className="h-5 w-5" /> },
        ],
        []
    );

    const { user, loadingUser } = useUser();
    const allowed = canAccessAdminPath(user, pathname);
    const visibleItems = navItems.filter(item => canAccessAdminPath(user, item.href));

    useEffect(() => {
        if (!loadingUser && !allowed) {
            router.replace(user ? firstAdminPath(user) ?? "/home/dashboard" : "/login");
        }
    }, [user, loadingUser, allowed, router]);

    if (!loadingUser && !allowed) {
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
            <AdminNavBar brandTitle="ADMIN" items={loadingUser ? navItems : visibleItems} loading={loadingUser} />
            <main className="flex-1 p-4 xl:p-6 xl:overflow-y-auto">
                {loadingUser ? <LoadingPage /> : children}
            </main>
        </div>
    );
}
