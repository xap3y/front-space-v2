'use client';
import {SidebarComp} from "@/components/Sidebar";
import { FaHome, FaImages, FaPaste, FaUserCircle } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { FaLink } from "react-icons/fa6";
import {useTranslation} from "@/hooks/useTranslation";
import {useEffect, useState} from "react";
import LoadingPage from "@/components/LoadingPage";
import {PageProvider} from "@/context/PageContext";
import GalleryPageServer from "@/app/home/gallery/page";
import GalleryPage from "@/app/home/gallery/client";

export default function HomeLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {

    const [loading, setLoading] = useState<boolean>(true);

    const lang = useTranslation();

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) return <LoadingPage/>

    return (
            <>
                <PageProvider>
                    <div className={"flex flex-row overflow-x-hidden"}>
                        <SidebarComp sidebar={[
                            {title: lang.comp.sidebar.home, icon: <FaHome className={"w-[30px] h-[30px]"} />, href: "/dashboard", page: "home"},
                            {title: lang.comp.sidebar.images, icon: <FaImages className={"w-[30px] h-[30px]"} />, href: "/gallery", page: "gallery"},
                            {title: lang.comp.sidebar.pastes, icon: <FaPaste className={"w-[30px] h-[30px]"} />, href: "/pastes", page: "pastes"},
                            {title: lang.comp.sidebar.short_urls, icon: <FaLink className={"w-[30px] h-[30px]"} />, href: "/urls", page: "urls"},
                            {title: lang.comp.sidebar.settings, icon: <IoIosSettings className={"w-[30px] h-[30px]"} />, href: "/settings", page: "settings"},
                            {title: lang.comp.sidebar.profile, icon: <FaUserCircle className={"w-[30px] h-[30px]"} />, href: "/profile", page: "profile"},
                        ]} logout_text={lang.comp.sidebar.logout} />
                        {children}
                    </div>
                </PageProvider>
            </>
        )
}