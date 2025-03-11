import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/crypto";
import { getCookie, deleteCookie } from 'cookies-next/server';
import {UserObj} from "@/types/user";
import supportedLocales, {getDefaultLocale} from "@/lib/core";
import {toast} from "react-toastify";

function languageMiddleware(req: NextRequest, res: NextResponse) {
    const cookieLocale = req.cookies.get('locale')?.value;

    let locale = cookieLocale || getDefaultLocale();
    console.log({locale})
    if (!supportedLocales.includes(locale)) {
        res.cookies.set('locale', getDefaultLocale(), { path: '/', maxAge: 60 * 60 * 24 * 365 });
        locale = getDefaultLocale();
    }

    // Set the locale in cookies if not already set
    if (!cookieLocale) {
        console.log({locale});
        res.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    }

    req.headers.set('x-locale', locale); // Pass locale to server components
}

async function authMiddleware(req: NextRequest, res: NextResponse) {

    const protectedRoutes = ['/home'];
    const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));
    if (!isProtectedRoute) return res;

    const authCookie = await getCookie('auth_token', { res, req });

    if (!authCookie) {
        console.log("No auth token found");
        //toast.error("Unauthorized access");
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

export async function middleware(req: NextRequest) {

    const res = NextResponse.next();

    languageMiddleware(req, res);

    const authResponse = await authMiddleware(req, res);
    if (authResponse) return authResponse;

    return res;
}

export const config = {
    matcher: [
        '/((?!api|_next|.*\\..*).*)', // Apply language middleware to all pages
        '/home/dashboard/:path*', // Apply authentication only to /home/dashboard routes
    ],
};
