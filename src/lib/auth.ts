'use client';

import {deleteCookie} from "cookies-next/client";
import {TrUserObj, UserObj} from "@/types/user";
import {getApiUrl} from "@/lib/core";
import {deleteVerifyToken} from "@/lib/client";
import {logToServer} from "@/lib/serverFuncs";

export async function getUser(): Promise<UserObj | null> {

    await logToServer("Fetching TR user data...");
    await logToServer("API URL: " + getApiUrl() + "/v1/auth/me");
    let res;
    try {
        res = await fetch(getApiUrl() + "/v1/auth/me", {
            method: "GET",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            credentials: "include",
        });
    } catch (e) {
        await logToServer("Error fetching user data: " + e);
    }

    await logToServer("Done fetching user data.");

    if (!res || !res.ok) {
        await logToServer("Data fetch failed with status: " + (res ? res.status : "No response"));
        return null;
    }

    const data = await res.json();

    if (data.error) {
        await logToServer("Data fetch returned error: " + data.error);
        return null;
    }

    const user = data["message"] as UserObj;

    await logToServer("User fetched successfully: " + user.username);
    await logToServer("==GET USER END==");

    return user;
}

export async function getTrUser(): Promise<TrUserObj | null> {

    await logToServer("Fetching TR user data...");
    await logToServer("API URL: " + getApiUrl() + "/v1/auth/tr/me");
    let res;
    try {
        res = await fetch(getApiUrl() + "/v1/auth/tr/me", {
            method: "GET",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            credentials: "include",
        });
    } catch (e) {
        await logToServer("Error fetching TR user data: " + e);
    }

    await logToServer("Done fetching tr user data.");

    if (!res || !res.ok) {
        await logToServer("Data fetch failed with status: " + (res ? res.status : "No response"));
        return null;
    }

    const data = await res.json();

    if (data.error) {
        await logToServer("Data fetch returned error: " + data.error);
        return null;
    }

    const user = data["message"] as TrUserObj;

    await logToServer("User fetched successfully: " + user.serverName);
    await logToServer("==GET USER END==");

    return user;
}

export function logout() {
    deleteCookie("auth_token");
    deleteCookie("session_token");
    deleteCookie("tr_token");
    deleteVerifyToken()
}

export function logoutTr() {
    deleteCookie("tr_token");
}