'use client';

import {Sidebar} from "@/types/core";
import { MdLogout } from "react-icons/md";
import 'react-tooltip/dist/react-tooltip.css'
import {usePage} from "@/context/PageContext";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {FaArrowLeft, FaArrowRight} from "react-icons/fa6";

interface Props {
    sidebar: Sidebar[],
    logout_text?: string,
}

export function SidebarComp({ sidebar, logout_text }: Props) {

    const { pageName, setPage } = usePage();
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isHidden, setIsHidden] = useState<boolean>(false);
    const router: AppRouterInstance = useRouter()

    console.log({pageName})

    const setPage2 = (name: string, href: string)=> {
        setPage(name);
        router.push(`/home${href}`)
    }

    const toggleSidebar = () => {
        setIsVisible(!isVisible);

        if (!isVisible){
            setIsHidden(false)
        } else {
            setTimeout(() => {
                setIsHidden(true)
            }, 200)
        }
    }

    return (
        <>
            <div className={`fixed w-[70px] min-w-[70px] animate-fadeInLeft duration-150 transition-all h-screen bg-secondary items-center flex z-20 flex-col justify-between py-3 pb-5 pt-5 ${!isVisible ? "-translate-x-full" : ""} ${isHidden ? "hidden" : ""}`}>
                <div className="flex flex-col items-center">
                    {sidebar.map(({ title, href, icon, page }) => (
                        <div
                            key={page}
                            data-tooltip-id="my-tooltip" data-tooltip-content={title} data-tooltip-place="right"
                            className={`flex flex-col`}

                        >
                            <div className={""}>
                                <button
                                    className={`p-3 duration-200 transition-all ${page==pageName ? "rounded-2xl bg-primary_light" : "hover:rounded-2xl hover:bg-primary_light"}`}
                                    onClick={() => setPage2(page, href)}
                                >
                                    {icon}
                                </button>
                            </div>

                            {page != "profile" && (
                                <hr className={"rounded-full border-opacity-50 border-[1px] border-primary-brighter my-2"} />
                            )}
                        </div>
                    ))}
                </div>
                {/* Logout at bottom */}
                <div className={"flex flex-col items-center"}>
                    <a href={"/logout"} data-tooltip-id="my-tooltip" data-tooltip-content={logout_text}>
                        <button
                            className="p-3 rounded-xl hover:bg-red-600 hover:bg-opacity-15 transition-colors"
                        >
                            <MdLogout className={"w-[30px] h-[30px]"} />
                        </button>
                    </a>

                    <hr className={"w-[50px] rounded-full border-opacity-50 border-[1px] border-primary-brighter my-2"} />

                    <button className={"hover:bg-primary bg-opacity-45 duration-150 p-2 rounded-xl"} onClick={toggleSidebar} >
                        <FaArrowLeft className={"w-[25px] h-[25px]"} />
                    </button>
                </div>
            </div>

            {isHidden && (
                <>
                    <div className="fixed bottom-4 left-4 z-50 flex">
                        <div className={`cursor-pointer flex items-center justify-center w-10 h-10 bg-primary_light rounded-xl mr-2`} onClick={toggleSidebar}>
                            <button className={"hover:bg-secondary bg-opacity-45 duration-150 p-2 rounded-xl"} onClick={toggleSidebar} >
                                <FaArrowRight className={"w-[25px] h-[25px]"} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}