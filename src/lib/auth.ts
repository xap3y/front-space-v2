'use client';

import {deleteCookie, getCookie} from "cookies-next/client";
import type {TrUserObj, UserObj} from "@/types/user";
import {getApiUrl} from "@/lib/core";
import {deleteVerifyToken} from "@/lib/client";

type AuthRequest<T> = {
    session: string;
    promise: Promise<T | null>;
};

let userRequest: AuthRequest<UserObj> | null = null;
let trUserRequest: AuthRequest<TrUserObj> | null = null;

async function fetchAuthUser<T>(path: string): Promise<T | null> {
    let response: Response;

    try {
        response = await fetch(getApiUrl() + path, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
        });
    } catch (error) {
        console.error("Failed to fetch authenticated user:", error);
        return null;
    }

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.error ? null : data.message as T;
}

export function getUser(): Promise<UserObj | null> {
    const session = JSON.stringify([
        getCookie("auth_token"),
        getCookie("session_token"),
    ]);

    if (userRequest?.session === session) {
        return userRequest.promise;
    }

    // Share only pending requests. Later mounts still validate the current session.
    const request: AuthRequest<UserObj> = {
        session,
        promise: fetchAuthUser<UserObj>("/v1/auth/me").finally(() => {
            if (userRequest === request) {
                userRequest = null;
            }
        }),
    };

    userRequest = request;
    return request.promise;
}

export function getTrUser(): Promise<TrUserObj | null> {
    const session = String(getCookie("tr_token") ?? "");

    if (trUserRequest?.session === session) {
        return trUserRequest.promise;
    }

    const request: AuthRequest<TrUserObj> = {
        session,
        promise: fetchAuthUser<TrUserObj>("/v1/auth/tr/me").finally(() => {
            if (trUserRequest === request) {
                trUserRequest = null;
            }
        }),
    };

    trUserRequest = request;
    return request.promise;
}

export function logout() {
    userRequest = null;
    trUserRequest = null;
    deleteCookie("auth_token");
    deleteCookie("session_token");
    deleteCookie("tr_token");
    deleteVerifyToken();
}

export function logoutTr() {
    trUserRequest = null;
    deleteCookie("tr_token");
}
