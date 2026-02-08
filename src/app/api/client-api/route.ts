import { NextResponse } from "next/server";
import { headers } from "next/headers";

async function getIpFromHeaders(): Promise<string | null> {
    const h = await headers();

    // Common when behind proxies/load balancers/CDNs
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();

    const xrip = h.get("x-real-ip");
    if (xrip) return xrip.trim();

    // Not always present, depends on platform.
    const cf = h.get("cf-connecting-ip");
    if (cf) return cf.trim();

    return null;
}

export async function GET() {
    const ip = await getIpFromHeaders();
    if (ip === null) {
        return NextResponse.json({ error: "unknown" }, { status: 400 });
    }
    const secret = xorEncodeToBase64Url(ip || "N/A", process.env.SECRET_KEY || "EXAMPLE");

    return NextResponse.json({ secret });
}

function toUtf8Bytes(s: string): Uint8Array {
    return new TextEncoder().encode(s);
}

function fromUtf8Bytes(b: Uint8Array): string {
    return new TextDecoder().decode(b);
}

function b64urlEncode(bytes: Uint8Array): string {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(s: string): Uint8Array {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
    if (!key.length) throw new Error("empty_key");
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        out[i] = data[i] ^ key[i % key.length];
    }
    return out;
}

function xorEncodeToBase64Url(plainText: string, secret: string): string {
    const data = toUtf8Bytes(plainText);
    const key = toUtf8Bytes(secret);
    const x = xorBytes(data, key);
    return b64urlEncode(x);
}