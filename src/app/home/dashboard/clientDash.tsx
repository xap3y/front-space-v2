"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { usePage } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaImage, FaClipboard, FaLink, FaFile, FaImages, FaUser } from "react-icons/fa6";
import {FaCog, FaTools} from "react-icons/fa";
import LoadingPage from "@/components/LoadingPage";

interface LauncherItem {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}

export default function DashboardLauncherClient() {
    const { user, loadingUser, error } = useUser();
    const { pageName, setPage } = usePage();
    const router = useRouter();

    useEffect(() => {
        setPage("dashboard");
    }, [setPage]);

    useEffect(() => {
        if (!loadingUser && !user) {
            router.push("/login");
        }
    }, [user, loadingUser, error, router]);

    if (loadingUser || !user) return <LoadingPage />;

    const launcherItems: LauncherItem[] = [
        {
            title: "Temp Mail",
            description: "Temporary email addresses",
            href: "/tempmail",
            icon: <FaEnvelope className="w-5 h-5" />,
        },
        {
            title: "Image Upload",
            description: "Upload and share images",
            href: "/a/image",
            icon: <FaImage className="w-5 h-5" />,
        },
        {
            title: "Paste Creator",
            description: "Create and share code snippets",
            href: "/a/paste",
            icon: <FaClipboard className="w-5 h-5" />,
        },
        {
            title: "URL Shortener",
            description: "Shorten long URLs",
            href: "/a/url",
            icon: <FaLink className="w-5 h-5" />,
        },
        {
            title: "Files",
            description: "Upload and manage files",
            href: "/files",
            icon: <FaFile className="w-5 h-5" />,
        },
        {
            title: "Gallery",
            description: "Browse your media",
            href: "/home/gallery",
            icon: <FaImages className="w-5 h-5" />,
        },
        {
            title: "Tools",
            description: "Utility tools and converters",
            href: "/tools",
            icon: <FaTools className="w-5 h-5" />,
        },
        {
            title: "Profile",
            description: "View your profile",
            href: "/home/profile",
            icon: <FaUser className="w-5 h-5" />,
        },
        {
            title: "Settings",
            description: "Manage your settings",
            href: "/home/settings",
            icon: <FaCog className="w-5 h-5" />,
        },
    ];

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Dashboard
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg">
                        Welcome back, {user.username}. Choose a tool to get started.
                    </p>
                </div>

                {/* Launcher Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {launcherItems.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.href}
                            className="group box-primary p-5 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {/* Icon */}
                            <div className="mb-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-200">
                                {item.icon}
                            </div>

                            {/* Title */}
                            <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors duration-200">
                                {item.title}
                            </h2>

                            {/* Description */}
                            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                                {item.description}
                            </p>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}