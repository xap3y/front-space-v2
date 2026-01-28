import "server-only";
import { cookies } from "next/headers";
import { UserObj } from "@/types/user";
import {getApiUrl} from "@/lib/core";

export async function getUserServer(): Promise<UserObj | null> {
    const cookieHeader = (await cookies()).toString();
    if (!cookieHeader) {
        return null;
    }

    let res: Response | null = null;
    try {
        res = await fetch(getApiUrl() + `/v1/auth/me`, {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            cache: "no-store", // avoid stale auth
        });
    } catch (err) {
        console.error("getUserServer fetch failed:", err);
        return null;
    }

    if (!res.ok) {
        console.warn("getUserServer non-OK:", res.status);
        return null;
    }

    const data = await res.json().catch(() => null);
    if (!data || data.error) return null;

    return data.message as UserObj;
}