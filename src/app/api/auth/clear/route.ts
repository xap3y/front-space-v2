import { NextResponse } from "next/server";

export async function POST() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("verify_token", "", {
        expires: new Date(0),
        path: "/",              // must match original path
        // domain: ".xap3y.space", // uncomment if cookie used this domain
        httpOnly: true,
        secure: true,
        sameSite: "lax",        // match what you used originally (not strictly required for deletion)
    });
    return res;
}