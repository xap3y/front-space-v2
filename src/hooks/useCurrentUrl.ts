"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useCurrentUrl() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [fullUrl, setFullUrl] = useState<string>("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = searchParams.toString();
        const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
        setFullUrl(url);
    }, [pathname, searchParams]);

    return fullUrl;
}