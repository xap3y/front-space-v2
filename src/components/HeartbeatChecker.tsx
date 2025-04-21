"use client";

import { useEffect } from "react";
import { useApiStatusStore } from "@/lib/stores/apiStatusStore";
import {getApiUrl} from "@/lib/core";

export const HeartbeatChecker = () => {
    const { setIsApiUp } = useApiStatusStore();

    useEffect(() => {
        const checkApi = async () => {
            try {
                console.log("[A] Checking API status...");
                const res = await fetch(getApiUrl() + "/status", { cache: "no-store" });
                setIsApiUp(res.ok);
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