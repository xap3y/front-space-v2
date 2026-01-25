"use client";

import { useEffect } from "react";
import { useApiStatusStore } from "@/lib/stores/apiStatusStore";
import {getApiUrl} from "@/lib/core";
import {useRouter} from "next/navigation";

export const HeartbeatChecker = () => {
    const { setIsApiUp } = useApiStatusStore();
    const router = useRouter();

    useEffect(() => {
        const checkApi = async () => {
            try {
                console.log("[A] Checking API status...");
                const res = await fetch(getApiUrl() + "/status", { cache: "no-store" });
                setIsApiUp(res.ok);
                console.log("[A] Status OK: " + res.ok);
                if (!res.ok) {
                    router.push("/");
                }
            } catch {
                setIsApiUp(false);
            }
        };

        checkApi();
        const interval = setInterval(checkApi, 30_000);
        return () => clearInterval(interval);
    }, [setIsApiUp]);

    return null;
};