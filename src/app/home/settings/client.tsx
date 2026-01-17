"use client";

import { useState, useEffect, useMemo } from "react";
import { usePage } from "@/context/PageContext";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import EmbedTabContent from "@/app/home/settings/pages/embed";
import LoadingPage from "@/components/LoadingPage";
import UrlPreferencesTabContent from "@/app/home/settings/pages/url";
import { PiPaintBrushBold, PiPlugsBold, PiLinkSimpleBold, PiGearBold } from "react-icons/pi";

const TABS = [
    { key: "webhook", label: "Embed", icon: <PiPlugsBold /> },
    { key: "url", label: "URL Preferences", icon: <PiLinkSimpleBold /> },
    { key: "appearance", label: "Appearance", icon: <PiPaintBrushBold /> },
    { key: "advanced", label: "Advanced", icon: <PiGearBold /> },
];

export default function HomeSettingsEmbed() {
    const { setPage } = usePage();
    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {
        setPage("settings");
    }, [setPage]);

    useEffect(() => {
        if (!loadingUser && !user) {
            router.push("/login");
        }
    }, [user, loadingUser, error, router]);

    const [activeTab, setActiveTab] = useState(TABS[0].key);

    const tabContent = useMemo(() => {
        if (loadingUser || user == null) return <LoadingPage />;

        switch (activeTab) {
            case "webhook":
                return <EmbedTabContent user={user} />;
            case "url":
                return <UrlPreferencesTabContent user={user} />;
            case "appearance":
                return <div className="text-sm text-gray-400">Appearance settings coming soon.</div>;
            case "advanced":
                return <div className="text-sm text-gray-400">Advanced settings coming soon.</div>;
            default:
                return null;
        }
    }, [activeTab, loadingUser, user]);

    if (loadingUser || !user) return <LoadingPage />;

    return (
        <section className="flex-1 min-w-0 pt-0 px-1 md:px-12">
            <div className="w-full md:space-y-8 space-y-4 md:mt-10 mt-2 p-5 box-primary">
                {/* Header */}
                <div className="flex items-center md:justify-between justify-center pb-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                </div>

                {/* Tab bar */}
                <nav className="relative -m-5 px-2 mx-1">
                    <div className="p-2 box-primary">
                        <ul className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap md:flex-wrap" role="tablist">
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <li key={tab.key} className="flex-shrink-0 md:flex-1 min-w-[110px] md:min-w-[140px]">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            aria-controls={`tab-panel-${tab.key}`}
                                            id={`tab-${tab.key}`}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`
                        group w-full px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                        border border-transparent flex items-center justify-center gap-2
                        ${isActive
                                                ? "bg-primary0 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                                                : "text-gray-300 hover:text-white hover:bg-white/5"
                                            }
                      `}
                                        >
                      <span className={`text-base ${isActive ? "text-sky-300" : "text-gray-400"}`}>
                        {tab.icon}
                      </span>
                                            <span className="truncate">{tab.label}</span>
                                            {isActive && <span className="h-1 w-10 rounded-full bg-sky-300/80 absolute bottom-1" />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>

                {/* Tab content */}
                <div
                    className="min-h-[340px] animate-fade-in"
                    role="tabpanel"
                    id={`tab-panel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                >
                    {tabContent}
                </div>
            </div>

            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.25s;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: none;
                    }
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}