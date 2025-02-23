import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/crypto";
import { getCookie, setCookie, deleteCookie, hasCookie, getCookies } from 'cookies-next/server';
import {UserObj} from "@/types/user";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const authCookie = await getCookie('auth_token', { res, req });

    // If no auth token, redirect to login
    if (!authCookie) {
        console.log("No auth token found");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    let user: UserObj | null = null;
    const token = await decrypt(authCookie);
    if (!token) {
        console.log("MW: No token found");
        return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
        user = JSON.parse(token);
        console.log("MW: " + user);
    } catch (error) {
        console.log(error);
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!user) {
        console.log("MW: No user found");
        await deleteCookie('auth_token', { res, req });
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Optional: Check role if required for admin
    if (req.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    console.log("MW: Returning RES");
    return res;
}

// Define protected paths
export const config = {
    matcher: ["/home/dashboard/:path*", "/profile/:path*/protected-route"],
};
