'use client';

import { getCookie, deleteCookie } from "cookies-next/client";
import { decrypt } from "@/lib/crypto";
import {UserObj} from "@/types/user";

export async function getUser(): Promise<UserObj | null> {
    const authToken = getCookie("auth_token");
    if (!authToken) return null;

    const token = await decrypt(authToken);
    try {
        return JSON.parse(token);
    } catch {
        return null;
    }
}

export function logout() {
    deleteCookie("auth_token");
}