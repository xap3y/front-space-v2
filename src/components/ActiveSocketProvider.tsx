/**
 * ActiveSocketProvider
 *
 * Mounts once in ClientRoot, opens the /ws/active WebSocket,
 * and automatically sends page-update heartbeats whenever the route changes.
 */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getCookie } from "cookies-next/client";
import { useActiveClientSocket } from "@/hooks/useActiveClientSocket";

export function ActiveSocketProvider() {
    const pathname = usePathname();
    const token = getCookie("session_token") as string | null ?? null;
    const { reportPage } = useActiveClientSocket(token, pathname);

    useEffect(() => {
        reportPage(pathname);
    }, [pathname, reportPage]);

    return null;
}
