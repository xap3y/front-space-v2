"use client";

import axios from "axios";

export function getPcvDeviceToken(): string {
    const key = "pcv.editor.device";
    let token = localStorage.getItem(key);
    if (!token) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
        token = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        localStorage.setItem(key, token);
    }
    return token;
}

export function pcvFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("X-Pcv-Device", getPcvDeviceToken());
    return window.fetch(input, { ...init, headers });
}

export const pcvAxios = axios.create();
pcvAxios.interceptors.request.use((config) => {
    config.headers.set("X-Pcv-Device", getPcvDeviceToken());
    return config;
});
