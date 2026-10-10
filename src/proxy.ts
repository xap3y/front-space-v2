import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserObj } from "@/types/user";
import supportedLocales, { getDefaultLocale } from "@/lib/core";
import { validateUserAgent } from "@/lib/uaValidator";
import {canAccessAdminPath, firstAdminPath} from "@/lib/permissions";
import {getApiUrl} from "@/lib/core";

const PROTECTED_ROUTES = ["/home", "/admin"] as const;
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function languageMiddleware(req: NextRequest, res: NextResponse) {
    if (req.nextUrl.pathname === "/") {
        return;
    }

    const cookieLocale = req.cookies.get("locale")?.value;
    const hasValidLocaleCookie = !!cookieLocale && supportedLocales.includes(cookieLocale);
    const locale = hasValidLocaleCookie ? cookieLocale : getDefaultLocale();

    if (!hasValidLocaleCookie) {
        res.cookies.set("locale", locale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE });
    }

    req.headers.set('x-locale', locale); // Pass locale to server components
}

async function authMiddleware(req: NextRequest, res: NextResponse) {
    if (!isProtectedRoute(req.nextUrl.pathname)) {
        return res;
    }

    const path = req.nextUrl.pathname;

    const authCookie = req.cookies.get("auth_token")?.value;

    if (!authCookie) {
        return NextResponse.redirect(new URL("/login?after=" + path, req.url));
    }

    const { decrypt } = await import("@/lib/crypto");
    const token = await decrypt(authCookie);
    if (!token) {
        return NextResponse.redirect(new URL("/login?after=" + path, req.url));
    }

    let user: UserObj | null = null;
    try {
        user = JSON.parse(token) as UserObj;
    } catch {
        return NextResponse.redirect(new URL("/login?after=" + path, req.url));
    }

    if (!user) {
        const { deleteCookie } = await import("cookies-next/server");
        await deleteCookie("auth_token", { res, req });
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path === "/admin" || path.startsWith("/admin/")) {
        try {
            const response = await fetch(getApiUrl() + "/v1/auth/me", {
                headers: {Cookie: req.headers.get("cookie") ?? ""},
                cache: "no-store",
            });
            const result = await response.json();
            const currentUser = response.ok && !result.error ? result.message as UserObj : null;
            if (!currentUser) {
                return NextResponse.redirect(new URL("/login", req.url));
            }
            if (!canAccessAdminPath(currentUser, path)) {
                return NextResponse.redirect(new URL(firstAdminPath(currentUser) ?? "/home/dashboard", req.url));
            }
        } catch {
            return NextResponse.redirect(new URL("/home/dashboard", req.url));
        }
    }

    return res;
}

export async function proxy(req: NextRequest) {
    const ua = req.headers.get("user-agent") || "unknown";

    if (!validateUserAgent(ua).validFormat && !ua.includes("Uptime-Kuma")) {
        return new NextResponse("Blocked UA", { status: 403 });
    }

    const res = NextResponse.next();

    languageMiddleware(req, res);

    const authResponse = await authMiddleware(req, res);
    if (authResponse) return authResponse;

    return res;
}

export const config = {
    matcher: [
        '/((?!api|_next|.*\\..*|$).*)',
    ],
};
