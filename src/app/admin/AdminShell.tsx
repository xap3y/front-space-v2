"use client";

import type { ReactNode } from "react";
import {useEffect, useMemo} from "react";
import AdminNavBar, { type AdminNavItem } from "@/app/admin/AdminNavBar";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {useRouter} from "next/navigation";
import {FaDatabase, FaEnvelope, FaImage, FaLink, FaPaste, FaUserCog, FaUsers} from "react-icons/fa";
import {MdDashboard, MdHistory, MdSettings, MdSpeed} from "react-icons/md";

type Props = {
    children: ReactNode;
};

export default function AdminShell({ children }: Props) {
    const router = useRouter();
    const navItems: AdminNavItem[] = useMemo(
        () => [
            { title: "Overview", href: "/admin", page: "overview", icon: <MdDashboard className="h-5 w-5" /> },
            { title: "Users", href: "/admin/users", page: "users", icon: <FaUsers className="h-5 w-5" /> },
            { title: "Limits", href: "/admin/limits", page: "limits", icon: <MdSpeed className="h-5 w-5" /> },
            { title: "Invites", href: "/admin/invites", page: "invites", icon: <FaUserCog className="h-5 w-5" /> },
            { title: "System", href: "/admin/system", page: "system", icon: <MdSettings className="h-5 w-5" /> },
            { title: "Logs", href: "/admin/logs", page: "logs", icon: <MdHistory className="h-5 w-5" /> },
            { title: "Images", href: "/admin/images", page: "images", icon: <FaImage className="h-5 w-5" /> },
            { title: "Pastes", href: "/admin/pastes", page: "pastes", icon: <FaPaste className="h-5 w-5" /> },
            { title: "Urls", href: "/admin/urls", page: "urls", icon: <FaLink className="h-5 w-5" /> },
            { title: "Emails", href: "/admin/emails", page: "emails", icon: <FaEnvelope className="h-5 w-5" /> },
            { title: "Mc-Reports", href: "/admin/mc-reports", page: "mc-reports", icon: <FaDatabase className="h-5 w-5" /> },
            { title: "Active Sessions", href: "/admin/sessions", page: "sessions", icon: <MdHistory className="h-5 w-5" /> },
        ],
        []
    );

    const { user, loadingUser } = useUser();

    useEffect(() => {
        if (!user && !loadingUser || (user && (user.role != "OWNER" && user.role != "ADMIN") && !loadingUser)) {
            router.replace("/login");
        }
    }, [user, loadingUser, router]);

    if (!loadingUser && (!user || (user.role != "OWNER" && user.role != "ADMIN"))) {
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
            <AdminNavBar brandTitle="ADMIN" items={navItems} loading={loadingUser} />
            <main className="flex-1 p-4 xl:p-6 xl:overflow-y-auto">
                {loadingUser ? <LoadingPage /> : children}
            </main>
        </div>
    );
}
