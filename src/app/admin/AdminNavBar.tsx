"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MdArrowBack, MdClose, MdMenu } from "react-icons/md";

export type AdminNavItem = {
    title: string;
    href: string; // e.g. "/admin/invites"
    page: string;
    icon?: React.ReactNode;
};

type Props = {
    items: AdminNavItem[];
    brandTitle?: string;
    loading?: boolean;
};

function SidebarBrand({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`flex items-center justify-center ${compact ? "gap-2" : "gap-2.5"}`}>
            <Image
                src="/only_logo_no_bg.png"
                alt="Space logo"
                width={compact ? 28 : 40}
                height={compact ? 28 : 40}
                priority
                className={`${compact ? "h-7 w-7" : "h-10 w-10"} block shrink-0 object-contain`}
            />
            <span className={`${compact ? "text-sm" : "text-3xl tracking-tight"} leading-none font-semibold`}>SPACE</span>
        </div>
    );
}

function useLockBodyScroll(lock: boolean) {
    useEffect(() => {
        if (!lock) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [lock]);
}

export default function AdminNavBar({ items, brandTitle = "ADMIN", loading = false }: Props) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Active item by current route.
    // - Exact match wins.
    // - Otherwise, choose the longest href that is a prefix of pathname (so nested routes stay active).
    const activePage = useMemo(() => {
        const exact = items.find((i) => i.href === pathname);
        if (exact) return exact.page;

        const prefixMatches = items
            .filter((i) => i.href !== "/admin" && pathname.startsWith(i.href + "/"))
            .sort((a, b) => b.href.length - a.href.length);

        if (prefixMatches[0]) return prefixMatches[0].page;

        // If you're on any /admin/* page and nothing else matched, fallback to /admin item if present
        if (pathname.startsWith("/admin")) {
            const root = items.find((i) => i.href === "/admin");
            return root?.page;
        }

        return undefined;
    }, [items, pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [mobileOpen]);

    useLockBodyScroll(mobileOpen);

    const NavList = ({ variant }: { variant: "desktop" | "mobile" }) => (
        <ul className="divide-y divide-white/5">
            {items.map((item) => {
                const isActive = activePage ? item.page === activePage : false;

                return (
                    <li key={item.page}>
                        <Link
                            href={item.href}
                            onClick={() => {
                                if (variant === "mobile") setMobileOpen(false);
                            }}
                            aria-current={isActive ? "page" : undefined}
                            className={`
                group relative w-full flex items-center gap-3 px-3 py-2.5
                text-sm transition-colors duration-200 rounded-[10px]
                ${isActive ? "bg-primary_light/25 text-white" : "text-gray-200 hover:bg-primary_light/15"}
              `}
                        >
              <span
                  className={`
                  pointer-events-none absolute left-0 top-1/2 -translate-y-1/2
                  h-5 w-[3px] rounded-full bg-primary_light
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ${isActive ? "opacity-100" : ""}
                `}
              />
                            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                            <span className="truncate">{item.title}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );

    const Navigation = ({ variant }: { variant: "desktop" | "mobile" }) => loading ? (
        <ul className="animate-pulse">
            {Array.from({ length: Math.max(items.length, 4) }).map((_, index) => (
                <li key={index} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="h-5 w-5 shrink-0 rounded bg-white/5" />
                    <div className="h-3.5 w-24 rounded bg-white/5" />
                </li>
            ))}
        </ul>
    ) : <NavList variant={variant} />;

    return (
        <>
            {/* Mobile top bar */}
            <div className="xl:hidden sticky top-0 z-30 bg-primary1 border-b border-white/10">
                <div className="h-14 px-3 flex items-center justify-between">
                    <button
                        aria-label="Open menu"
                        className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-primary0 transition-colors"
                        onClick={() => setMobileOpen(true)}
                    >
                        <MdMenu className="h-6 w-6" />
                    </button>
                    <SidebarBrand compact />
                    <div className="w-9" />
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside
                className="
          hidden xl:flex xl:flex-col
          w-64 shrink-0
          bg-primary1 border-r border-white/10
          min-h-[100dvh] sticky top-0
        "
            >
                <div className="px-4 h-16 flex items-center justify-center">
                    <SidebarBrand />
                </div>
                <div className="border-b border-white/10" />

                <div className="flex-1 overflow-y-auto px-3 py-3">
                    <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        {brandTitle}
                    </div>
                    <Navigation variant="desktop" />
                </div>

                <div className="border-t border-white/10 p-3">
                    {loading ? <div className="h-10 w-full animate-pulse rounded-lg bg-white/5" /> : (
                        <Link href="/home/dashboard" className="w-full inline-flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors">
                            <MdArrowBack className="h-5 w-5" />
                            Back to app
                        </Link>
                    )}
                </div>
            </aside>

            {/* Mobile drawer + backdrop */}
            <div
                aria-hidden={!mobileOpen}
                className={`
          xl:hidden fixed inset-0 z-40
          ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}
        `}
            >
                <div
                    className={`
            absolute inset-0 bg-black/40
            transition-opacity duration-300 ease-out
            ${mobileOpen ? "opacity-100" : "opacity-0"}
          `}
                    onClick={() => setMobileOpen(false)}
                />

                <div
                    role="dialog"
                    aria-modal="true"
                    className={`
            absolute inset-y-4 left-4
            w-[80vw] max-w-[340px]
            overflow-hidden box-primary
            transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
            will-change-transform
            ${mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"}
            flex flex-col
          `}
                >
                    <div className="h-14 px-3 flex items-center justify-between border-b border-white/10">
                        <SidebarBrand compact />
                        <button
                            aria-label="Close admin menu"
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10 transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            <MdClose className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3">
                        <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                            {brandTitle}
                        </div>
                        <Navigation variant="mobile" />
                    </div>

                    <div className="border-t border-white/10 p-3">
                        {loading ? <div className="h-11 w-full animate-pulse rounded-lg bg-white/5" /> : (
                            <Link href="/home/dashboard" onClick={() => setMobileOpen(false)} className="w-full inline-flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors">
                                <MdArrowBack className="h-5 w-5" />
                                Back to app
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
