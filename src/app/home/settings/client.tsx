"use client";

import { useState, useEffect } from "react";
import { usePage } from "@/context/PageContext";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import EmbedTabContent from "@/app/home/settings/pages/embed";
import LoadingPage from "@/components/LoadingPage";
import UrlPreferencesTabContent from "@/app/home/settings/pages/url";

const TABS = [
    { key: "webhook", label: "Embed" },
    { key: "url", label: "URL Preferences" },
    { key: "appearance", label: "Appearance" },
    { key: "advanced", label: "Advanced" },
];

export default function HomeSettingsEmbed() {
    const { setPage } = usePage();
    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {
        setPage("settings");
    }, []);

    // Tab state
    const [activeTab, setActiveTab] = useState(TABS[0].key);

    // Tab content renderers
    function renderTabContent() {

        if (loadingUser || user == null) return <LoadingPage />;

        switch (activeTab) {
            case "webhook":
                return <EmbedTabContent user={user} />;
            case "url":
                return <UrlPreferencesTabContent user={user} />;
            case "appearance":
                return <></>;
            case "advanced":
                return <></>;
            default:
                return null;
        }
    }

    return (
        <section className="flex-1 min-w-0 pt-0 px-1 md:px-12">
            <div className="max-w-6xl mx-auto w-full md:space-y-8 space-y-4">
                {/* Header */}
                <div className="flex items-center md:justify-between justify-center md:pt-10 pt-2 pb-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                </div>

                {/* Tab bar */}
                <nav className="relative -m-5 px-2 mx-1">
                    <ul
                        className="flex gap-2 overflow-x-auto scrollbar-hide rounded-lg bg-primary/30 p-1 md:flex-wrap flex-nowrap"
                        role="tablist"
                    >
                        {TABS.map(tab => (
                            <li key={tab.key} className="flex-shrink-0 md:flex-1 min-w-[90px] md:min-w-[120px]">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab.key}
                                    aria-controls={`tab-panel-${tab.key}`}
                                    id={`tab-${tab.key}`}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition-colors duration-200
            ${activeTab === tab.key
                                        ? "bg-secondary text-sky-400 shadow-md"
                                        : "text-gray-400 hover:text-sky-300 hover:bg-white/5"
                                    }
          `}
                                    style={{
                                        transition: "box-shadow 0.2s, color 0.2s",
                                        minWidth: "90px",
                                        whiteSpace: "nowrap",
                                        flex: "0 0 auto",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Tab content */}
                <div
                    className="min-h-[340px] animate-fade-in"
                    role="tabpanel"
                    id={`tab-panel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                >
                    {renderTabContent()}
                </div>
            </div>

            {/* Animate fade-in (use Tailwind or add in global CSS) */}
            <style jsx global>{`
                .animate-fade-in {
                    animation: fadeIn 0.25s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: none; }
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @media (max-width: 600px) {
                    nav ul {
                        gap: 0.75rem;
                    }
                    nav ul li button {
                        font-size: 1rem;
                        padding: 0.75rem 1rem;
                    }
                }
            `}</style>
        </section>
    );
}