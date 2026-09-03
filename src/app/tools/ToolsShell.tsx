"use client";

import {ReactNode, useEffect, useMemo} from "react";
import {useRouter} from "next/navigation";
import AdminNavBar, {AdminNavItem} from "@/app/admin/AdminNavBar";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {FaArrowsRotate, FaClock, FaCode, FaEnvelope, FaFingerprint, FaGlobe, FaImage, FaLocationDot, FaQrcode, FaVideo} from "react-icons/fa6";

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
            { title: "DNS", href: "/tools/dns-lookup", page: "dns-lookup", icon: <FaGlobe className="h-5 w-5" /> },
            { title: "Email", href: "/tools/email-health", page: "email-health", icon: <FaEnvelope className="h-5 w-5" /> },
            { title: "IP Geo", href: "/tools/ip-geo", page: "ip-geo", icon: <FaLocationDot className="h-5 w-5" /> },
            { title: "QR", href: "/tools/qr-toolkit", page: "qr-toolkit", icon: <FaQrcode className="h-5 w-5" /> },
            { title: "JSON", href: "/tools/json-workbench", page: "json-workbench", icon: <FaCode className="h-5 w-5" /> },
            { title: "Formatter", href: "/tools/code-formatter", page: "code-formatter", icon: <FaCode className="h-5 w-5" /> },
            { title: "Checksum", href: "/tools/file-checksum", page: "file-checksum", icon: <FaFingerprint className="h-5 w-5" /> },
            { title: "Regex", href: "/tools/regex-playground", page: "regex-playground", icon: <FaCode className="h-5 w-5" /> },
            { title: "Timestamp", href: "/tools/timestamp-lab", page: "timestamp-lab", icon: <FaClock className="h-5 w-5" /> },
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
