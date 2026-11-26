"use client";

import { useEffect } from "react";
import { useApiStatusStore } from "@/lib/stores/apiStatusStore";
import {getApiUrl} from "@/lib/core";
import {useRouter} from "next/navigation";

export const HeartbeatChecker = () => {
    const setApiStatus = useApiStatusStore(state => state.setApiStatus);
    const router = useRouter();

    useEffect(() => {
        const checkApi = async () => {
            try {
                console.log("[A] Checking API status...");
                const res = await fetch(getApiUrl() + "/status", { cache: "no-store" });
                console.log("[A] Status OK: " + res.ok);
                if (!res.ok) {
                    setApiStatus(false);
                    router.push("/");
                    return;
                }

                const data: { version?: unknown } | null = await res.json().catch(() => null);
                const version = typeof data?.version === "string" ? data.version.trim() : "";
                setApiStatus(true, version || null);
            } catch {
                setApiStatus(false);
            }
        };

        checkApi();
        const interval = setInterval(checkApi, 30_000);
        return () => clearInterval(interval);
    }, [router, setApiStatus]);

    return null;
};
