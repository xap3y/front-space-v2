"use client";

import {ReactNode, useEffect, useMemo} from "react";
import {useRouter} from "next/navigation";
import AdminNavBar, {AdminNavItem} from "@/app/admin/AdminNavBar";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {FaArrowsRotate, FaImage, FaVideo} from "react-icons/fa6";

type Props = {
    children: ReactNode;
};

export default function ToolsShell({ children }: Props) {
    const router = useRouter();
    const navItems: AdminNavItem[] = useMemo(
        () => [
            { title: "Image", href: "/tools/image", page: "image", icon: <FaImage className="h-5 w-5" /> },
            { title: "Converter", href: "/tools/image-converter", page: "image-converter", icon: <FaArrowsRotate className="h-5 w-5" /> },
            { title: "Video", href: "/tools/video", page: "video", icon: <FaVideo className="h-5 w-5" /> },
        ],
        []
    );

    const { user, loadingUser } = useUser();

    useEffect(() => {
        if (!user && !loadingUser || (user && (user.role != "OWNER" && user.role != "ADMIN") && !loadingUser)) {
            router.replace("/login?after=/tools");
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
            <AdminNavBar brandTitle="Tools" items={navItems} loading={loadingUser} />
            <main className="flex-1 p-4 xl:p-6 xl:overflow-y-auto">
                {loadingUser ? <LoadingPage /> : children}
            </main>
        </div>
    );
}
