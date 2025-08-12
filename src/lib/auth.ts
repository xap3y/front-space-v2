'use client';

import {deleteCookie} from "cookies-next/client";
import { UserObj } from "@/types/user";
import {getApiUrl} from "@/lib/core";
import {deleteVerifyToken} from "@/lib/client";

export async function getUser(): Promise<UserObj | null> {

    console.debug("==GET USER BEGIN==");
    console.debug("Fetching... on " + getApiUrl() + "/v1/auth/me");
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
        console.debug("ERROR: " + e);
    }

    console.debug("DONE");

    if (!res || !res.ok) {
        console.debug("NOT OK");
        console.debug(res)
        return null;
    }

    const data = await res.json();

    if (data.error) {
        console.debug("DATA ERROR");
        return null;
    }

    const user = data["message"] as UserObj;

    //console.debug("obj: " + JSON.stringify(user));
    console.debug("user: " + user.username);
    console.debug("==GET USER END==");

    return user;

    /*const authToken = getCookie("auth_token");
    if (!authToken) return null;

    const token = await decrypt(authToken);
    try {
        return JSON.parse(token);
    } catch {
        return null;
    }*/
}

export function logout() {
    deleteCookie("auth_token");
    deleteCookie("session_token");
    deleteVerifyToken()
}