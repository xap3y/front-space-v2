"use client";

import Link from "next/link";
import { FaArrowRight, FaDatabase, FaEnvelope, FaImage, FaLink, FaPaste, FaUsers } from "react-icons/fa6";
import { FaFileArchive, FaUserCog } from "react-icons/fa";
import { MdDashboard, MdHistory, MdSettings, MdSpeed } from "react-icons/md";

const adminSections = [
    { title: "Users", description: "Manage accounts, roles, and access.", href: "/admin/users", icon: <FaUsers className="h-6 w-6" /> },
    { title: "Limits", description: "Configure platform quotas and restrictions.", href: "/admin/limits", icon: <MdSpeed className="h-6 w-6" /> },
    { title: "Invites", description: "Create and manage account invitations.", href: "/admin/invites", icon: <FaUserCog className="h-6 w-6" /> },
    { title: "System", description: "View and manage system configuration.", href: "/admin/system", icon: <MdSettings className="h-6 w-6" /> },
    { title: "Logs", description: "Review administrative and system activity.", href: "/admin/logs", icon: <MdHistory className="h-6 w-6" /> },
    { title: "Images", description: "Browse and manage uploaded images.", href: "/admin/images", icon: <FaImage className="h-6 w-6" /> },
    { title: "Pastes", description: "Browse and moderate shared pastes.", href: "/admin/pastes", icon: <FaPaste className="h-6 w-6" /> },
    { title: "File Packs", description: "Inspect file packs and remove stored files.", href: "/admin/files", icon: <FaFileArchive className="h-6 w-6" /> },
    { title: "URLs", description: "Review and manage shortened links.", href: "/admin/urls", icon: <FaLink className="h-6 w-6" /> },
    { title: "Emails", description: "Inspect outgoing and managed email data.", href: "/admin/emails", icon: <FaEnvelope className="h-6 w-6" /> },
    { title: "MC Reports", description: "Review Minecraft server reports.", href: "/admin/mc-reports", icon: <FaDatabase className="h-6 w-6" /> },
    { title: "Active Sessions", description: "View and control active user sessions.", href: "/admin/sessions", icon: <MdHistory className="h-6 w-6" /> },
];

export default function AdminPage() {
    return (
        <div className="mx-auto min-h-full max-w-6xl px-1 py-2 sm:px-4 sm:py-5">
            <header className="mb-5 text-center sm:mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Admin dashboard</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">Manage your Space instance, content, users, and system settings.</p>
            </header>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section) => (
                    <Link key={section.href} href={section.href} className="group box-primary flex min-h-36 flex-col rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-xl hover:shadow-black/30">
                        <div className="mb-3 flex items-start justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-black/30 text-blue-300 transition group-hover:border-blue-500/30 group-hover:bg-blue-500/10">{section.icon}</div>
                            <FaArrowRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-blue-300" />
                        </div>
                        <h2 className="text-lg font-semibold text-white transition group-hover:text-blue-200">{section.title}</h2>
                        <p className="mt-1 text-sm leading-5 text-zinc-400">{section.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
