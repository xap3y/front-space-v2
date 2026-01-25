'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {MdLogout, MdMenu, MdClose, MdOutlineAdminPanelSettings} from 'react-icons/md';
import {useUser} from "@/hooks/useUser";

type SidebarItem = {
    title: string;
    href: string;   // e.g. '/inbox'
    icon: React.ReactNode;
    page: string;   // internal page name for your usePage() context
};

interface Props {
    sidebar: SidebarItem[];
    logout_text: string;
    brandTitle?: string; // optional brand text shown on desktop and in the drawer
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

export function SidebarComp({ sidebar, logout_text, brandTitle = 'SPACE' }: Props) {
    // If you have a usePage() context, plug it in here:
    // const { pageName, setPage } = usePage();
    const setPage = (name: string) => {};

    const { user, loadingUser, error } = useUser();

    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleNavigate = useCallback((item: SidebarItem) => {
        setPage(item.page);
        router.push(`/home${item.href}`);
        setMobileOpen(false);
    }, [router]);

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
            {sidebar.map((item) => {
                const isActive = activePage ? item.page === activePage : false;
                return (
                    <li key={item.page}>
                        <button
                            onClick={() => onItemClick(item)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`
                group relative w-full flex items-center gap-3 px-3 py-2.5
                text-sm transition-colors duration-200
                ${isActive ? 'bg-primary_light/25 text-white' : 'text-gray-200 hover:bg-primary_light/15'}
                rounded-[10px]
              `}
                        >
                            {/* Left accent bar animates in on hover/active */}
                            <span
                                className={`
                  pointer-events-none absolute left-0 top-1/2 -translate-y-1/2
                  h-5 w-[3px] rounded-full bg-primary_light
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ${isActive ? 'opacity-100' : ''}
                `}
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
                        </button>
                    </li>
                );
            })}
        </ul>
    );

    if (loadingUser || !user) return null;

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
                    {/* Center brand text (you can replace with logo) */}
                    <div className="text-sm font-semibold">{brandTitle}</div>
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
                {/* Header with brand + divider */}
                <div className="px-4 h-16 flex items-center justify-center">
                    <div className="text-3xl font-semibold tracking-tight">{brandTitle}</div>
                </div>
                <div className="border-b border-white/10" />

                {/* Nav */}
                <div className="flex-1 overflow-y-auto px-3 py-3">
                    <NavList onItemClick={handleNavigate} />
                </div>

                {/* Footer / Logout */}
                <div className="border-t border-white/10 p-3">
                    {user.role === "OWNER" && (
                        <a href="/admin" className="w-full block">
                            <button
                                className="
                w-full inline-flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                text-gray-200 hover:bg-cyan-600/15 hover:text-white transition-colors
              "
                                aria-label={"Admin"}
                                title={"Admin"}
                            >
                                <MdOutlineAdminPanelSettings className="h-5 w-5" />
                                <span>Admin</span>
                            </button>
                        </a>
                    )}
                    <a href="/logout" className="w-full block">
                        <button
                            className="
                w-full inline-flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                text-gray-200 hover:bg-red-600/15 hover:text-white transition-colors
              "
                            aria-label={logout_text}
                            title={logout_text}
                        >
                            <MdLogout className="h-5 w-5" />
                            <span>{logout_text}</span>
                        </button>
                    </a>
                </div>
            </aside>

            {/* Mobile drawer + backdrop (not full height; inset-y-4 adds margins) */}
            <div
                aria-hidden={!mobileOpen}
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
                <div
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
                        <div className="text-sm font-semibold">{brandTitle}</div>
                        <button
                            aria-label="Close menu"
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10 transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            <MdClose className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Drawer nav (scrolls, with thin separators) */}
                    <div className="flex-1 overflow-y-auto px-3 py-3">
                        <NavList onItemClick={handleNavigate} />
                    </div>

                    {/* Drawer footer */}
                    <div className="border-t border-white/10 p-3">
                        <a href="/logout" className="w-full block">
                            <button
                                className="
                  w-full inline-flex items-center gap-3 px-3 py-3 rounded-lg text-sm
                  text-gray-200 hover:bg-red-600/15 hover:text-white transition-colors
                "
                                aria-label={logout_text}
                                title={logout_text}
                            >
                                <MdLogout className="h-5 w-5" />
                                <span>{logout_text}</span>
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}