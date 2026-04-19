import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserObj } from "@/types/user";
import supportedLocales, { getDefaultLocale } from "@/lib/core";
import { validateUserAgent } from "@/lib/uaValidator";

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
    const bypassMiddleware = req.headers.get("X-Bypass-Middleware");
    if (bypassMiddleware === "true") {
        return res;
    }

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

    // Optional: Check role if required for admin
    if (req.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "OWNER") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return res;
}

export async function middleware(req: NextRequest) {
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
