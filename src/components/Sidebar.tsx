'use client';
import styles from "@/components/ui/ui.module.css";
import Surface from "@/components/ui/Surface";

import { NativeButton } from "@/components/ui/NativeButton";


import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {MdClose, MdKeyboardArrowUp, MdLogout, MdMenu, MdOutlineAdminPanelSettings, MdPersonOutline} from 'react-icons/md';
import HoverDiv from "@/components/HoverDiv";
import {useUser} from "@/hooks/useUser";
import {firstAdminPath, hasPermission, type Permission} from "@/lib/permissions";
import {getUserRoleBadgeElement} from "@/lib/roleBadge";
import type {UserObj} from "@/types/user";

type SidebarItem = {
    title: string;
    href: string;   // e.g. '/inbox'
    icon: React.ReactNode;
    page: string;   // internal page name for your usePage() context
    permission?: Permission; // hide the item when the user lacks this permission
};

interface Props {
    sidebar: SidebarItem[];
    profileText: string;
    logoutText: string;
    brandTitle?: string; // optional brand text shown on desktop and in the drawer
}

function SidebarBrand({title, compact = false}: {title: string; compact?: boolean}) {
    return <div className={`flex items-center justify-center ${compact ? 'gap-2' : 'gap-2.5'}`}>
        <Image
            src="/only_logo_no_bg.png"
            alt="Space logo"
            width={compact ? 28 : 40}
            height={compact ? 28 : 40}
            priority
            className={`${compact ? 'h-7 w-7' : 'h-10 w-10'} block shrink-0 object-contain`}
        />
        <span className={`${compact ? 'text-sm' : 'text-3xl tracking-tight'} leading-none font-semibold`}>{title}</span>
    </div>;
}

function useLockBodyScroll(locked: boolean) {
    useEffect(() => {
        const { body } = document;
        if (!body) return;
        const prev = body.style.overflow;
        if (locked) body.style.overflow = 'hidden';
        return () => { body.style.overflow = prev; };
    }, [locked]);
}

const defaultAvatar = "/images/default-avatar.svg";
const accountLinkClass = "flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm motion-safe:transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-zinc-400";

function SidebarAccount({user, profileText, logoutText, profileActive, onNavigate}: {
    user: UserObj;
    profileText: string;
    logoutText: string;
    profileActive: boolean;
    onNavigate: () => void;
}) {
    const [open, setOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const adminHref = firstAdminPath(user);

    useEffect(() => {
        if (!open) {
            return;
        }

        const closeOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && !accountRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOutside);
        return () => document.removeEventListener("pointerdown", closeOutside);
    }, [open]);

    const navigate = () => {
        setOpen(false);
        onNavigate();
    };

    return (
        <div
            ref={accountRef}
            className="flex flex-col-reverse"
            onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(false);
                }
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape" && open) {
                    event.stopPropagation();
                    setOpen(false);
                    triggerRef.current?.focus();
                }
            }}
        >
            <HoverDiv
                ref={triggerRef}
                type="INFO"
                aria-expanded={open}
                aria-controls={menuId}
                className="group w-full select-none justify-start gap-3 rounded-lg px-2.5 py-2 text-left aria-expanded:border-zinc-600"
                onClick={() => {
                    triggerRef.current?.focus();
                    setOpen(current => !current);
                }}
                icon={
                    <img
                        src={user.avatar || defaultAvatar}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-primary0 object-cover"
                        onError={(event) => {
                            if (event.currentTarget.getAttribute("src") !== defaultAvatar) {
                                event.currentTarget.src = defaultAvatar;
                            }
                        }}
                    />
                }
            >
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                    <span className="flex max-w-full min-w-0 items-baseline gap-1 text-sm leading-tight">
                        <span className="min-w-0 truncate font-semibold text-white" title={user.username}>
                            {user.username}
                        </span>
                        <span className="shrink-0 text-zinc-400">({user.uid})</span>
                    </span>
                    {getUserRoleBadgeElement(user.role, {size: "xs"})}
                </span>
                <span
                    aria-hidden="true"
                    className="text-zinc-400 motion-safe:transition-transform group-aria-expanded:rotate-180"
                >
                    <MdKeyboardArrowUp className="h-5 w-5" />
                </span>
            </HoverDiv>

            <div
                id={menuId}
                inert={!open}
                className={`grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-150 motion-safe:ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="min-h-0 overflow-hidden">
                    <Surface className="mb-2 max-h-[45dvh] overflow-y-auto border p-1.5">
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href="/home/profile"
                                    aria-current={profileActive ? "page" : undefined}
                                    className={`${accountLinkClass} ${
                                        profileActive
                                            ? "bg-sky-400/10 text-sky-200 ring-1 ring-inset ring-sky-400/25"
                                            : "text-zinc-200 hover:bg-white/[.07]"
                                    }`}
                                    onClick={navigate}
                                >
                                    <MdPersonOutline
                                        aria-hidden="true"
                                        className={`h-4 w-4 shrink-0 ${profileActive ? "text-sky-300" : "text-zinc-400"}`}
                                    />
                                    {profileText}
                                </Link>
                            </li>
                            {adminHref && (
                                <li>
                                    <Link
                                        href={adminHref}
                                        className={`${accountLinkClass} text-zinc-200 hover:bg-white/[.07]`}
                                        onClick={navigate}
                                    >
                                        <MdOutlineAdminPanelSettings aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
                                        Admin
                                    </Link>
                                </li>
                            )}
                            <li className="border-t border-white/10 pt-1">
                                <a
                                    href="/logout"
                                    className={`${accountLinkClass} text-red-300 hover:bg-red-500/10`}
                                    onClick={navigate}
                                >
                                    <MdLogout aria-hidden="true" className="h-4 w-4 shrink-0" />
                                    {logoutText}
                                </a>
                            </li>
                        </ul>
                    </Surface>
                </div>
            </div>
        </div>
    );
}

function SidebarAccountSkeleton() {
    return (
        <div aria-hidden="true" className="flex items-center gap-3 rounded-lg border border-white/5 px-2.5 py-2 motion-safe:animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/5" />
            <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-white/5" />
                <div className="h-3 w-12 rounded bg-white/5" />
            </div>
        </div>
    );
}

export function SidebarComp({ sidebar, profileText, logoutText, brandTitle = 'SPACE' }: Props) {
    // If you have a usePage() context, plug it in here:
    // const { pageName, setPage } = usePage();
    const setPage = (name: string) => {};

    const { user, loadingUser } = useUser();
    const items = useMemo(
        () => sidebar.filter(item => !item.permission || hasPermission(user, item.permission)),
        [sidebar, user]
    );

    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleNavigate = useCallback((item: SidebarItem) => {
        setPage(item.page);
        router.push(`/home${item.href}`);
        setMobileOpen(false);
    }, [router, setPage]);

    // Route-based highlight as fallback
    const activePage = useMemo(() => {
        const match = sidebar.find(i => `/home${i.href}` === pathname);
        return match?.page;
    }, [sidebar, pathname]);

    // ESC to close mobile drawer
    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileOpen]);

    useLockBodyScroll(mobileOpen);

    const NavList = ({ onItemClick }: { onItemClick: (item: SidebarItem) => void }) => (
        <ul className="divide-y divide-white/5">
            {items.map((item) => {
                const isActive = activePage ? item.page === activePage : false;
                return (
                    <li key={item.page}>
                        <NativeButton variant="ghost" data-active={isActive}
                            onClick={() => onItemClick(item)}
                            onMouseEnter={() => router.prefetch(`/home${item.href}`)}
                            onFocus={() => router.prefetch(`/home${item.href}`)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`${styles.navItem}
                group relative w-full flex items-center gap-3 px-3 py-2.5
                text-sm transition-colors duration-200
                ${isActive ? 'bg-primary_light/25 text-white' : 'text-gray-200 hover:bg-primary_light/15'}
                rounded-[10px]
              `}
                        >
                            {/* Left accent bar animates in on hover/active */}
                            <span
className={styles.navIndicator}
                            />
                            {/* Icon with subtle lift on hover */}
                            <span
                                className={`
                  shrink-0 transition-transform duration-200
                  group-hover:-translate-y-[1px]
                `}
                            >
                {item.icon}
              </span>
                            <span className="truncate">{item.title}</span>
                        </NativeButton>
                    </li>
                );
            })}
        </ul>
    );

    const showSkeleton = loadingUser;

    if (!loadingUser && !user) return null;

    const accountFooter = user ? (
        <SidebarAccount
            user={user}
            profileText={profileText}
            logoutText={logoutText}
            profileActive={pathname === "/home/profile" || pathname.startsWith("/home/profile/")}
            onNavigate={() => setMobileOpen(false)}
        />
    ) : <SidebarAccountSkeleton />;


    return (
        <>
            {/* Mobile top bar */}
            <div className="xl:hidden sticky top-0 z-30 bg-primary1 border-b border-white/10">
                <div className="h-14 px-3 flex items-center justify-between">
                    <NativeButton variant="ghost"
                        aria-label="Open menu"
                        className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-primary0 transition-colors"
                        onClick={() => setMobileOpen(true)}
                    >
                        <MdMenu className="h-6 w-6" />
                    </NativeButton>
                    <SidebarBrand title={brandTitle} compact />
                    <div className="w-9" />
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside
                className="
          hidden xl:flex xl:flex-col
          w-64 shrink-0
          bg-primary1 border-r border-white/10
          h-[100dvh] sticky top-0
        "
            >
                {/* Header with brand + divider */}
                <div className="px-4 h-16 flex items-center justify-center">
                    <SidebarBrand title={brandTitle} />
                </div>
                <div className="border-b border-white/10" />

                {/* Nav */}
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                    {showSkeleton ? (
                        <ul className="divide-y divide-white/5 animate-pulse">
                            {items.map((item) => (
                                <li key={item.page} className={styles.navItem}>
                                    <div className="h-5 w-5 rounded bg-white/5 shrink-0" />
                                    <div className="h-3.5 rounded bg-white/5" style={{width: `${Math.min(116, Math.max(52, item.title.length * 7))}px`}} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <NavList onItemClick={handleNavigate} />
                    )}
                </div>

                <div className="shrink-0 border-t border-white/10 p-3">
                    {accountFooter}
                </div>
            </aside>

            {/* Mobile drawer + backdrop (not full height; inset-y-4 adds margins) */}
            <div
                aria-hidden={!mobileOpen}
                inert={!mobileOpen}
                className={`
          xl:hidden fixed inset-0 z-40
          ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
            >
                {/* Backdrop fade */}
                <div
                    className={`
            absolute inset-0 bg-black/40
            transition-opacity duration-300 ease-out
            ${mobileOpen ? 'opacity-100' : 'opacity-0'}
          `}
                    onClick={() => setMobileOpen(false)}
                />

                {/* Drawer panel */}
                <Surface
                    role="dialog"
                    aria-modal="true"
                    className={`
            absolute inset-y-4 left-4
            w-[80vw] max-w-[340px]
            overflow-hidden
            box-primary
            transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
            will-change-transform
            ${mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}
            flex flex-col
          `}
                >
                    {/* Drawer header with close and brand */}
                    <div className="h-14 px-3 flex items-center justify-between border-b border-white/10">
                        <SidebarBrand title={brandTitle} compact />
                        <NativeButton variant="ghost"
                            aria-label="Close menu"
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10 transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            <MdClose className="h-6 w-6" />
                        </NativeButton>
                    </div>

                    {/* Drawer nav (scrolls, with thin separators) */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                        {showSkeleton ? (
                            <ul className="divide-y divide-white/5 animate-pulse">
                                {items.map((item) => (
                                    <li key={item.page} className={styles.navItem}>
                                        <div className="h-5 w-5 rounded bg-white/5 shrink-0" />
                                        <div className="h-3.5 rounded bg-white/5" style={{width: `${Math.min(116, Math.max(52, item.title.length * 7))}px`}} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <NavList onItemClick={handleNavigate} />
                        )}
                    </div>

                    <div className="shrink-0 border-t border-white/10 p-3">
                        {accountFooter}
                    </div>
                </Surface>
            </div>
        </>
    );
}
