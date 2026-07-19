"use client";

import { Tooltip } from "react-tooltip";
import { HeartbeatChecker } from "./HeartbeatChecker";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {GoogleAnalytics} from "@next/third-parties/google";
import { Analytics } from '@vercel/analytics/next';
import {useApiStatusStore} from "@/lib/stores/apiStatusStore";
import {MdErrorOutline} from "react-icons/md";
import { useEffect, useState } from "react";

export const ClientRoot = ({ children }: { children: React.ReactNode }) => {

    const [debug, setDebug] = useState(false);
    const [cookies, setCookies] = useState(false);

    useEffect(() => {
        setDebug(localStorage.getItem("debug") === "true");
        setCookies(localStorage.getItem("cookie_consent") === "granted");
    }, []);

    const { isApiUp } =  useApiStatusStore();

    return (
        <>
            <Tooltip id="my-tooltip" />
            <HeartbeatChecker />
            {debug && <LanguageSwitcher />}
            {cookies && (
                <>
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-J3288JZ3DV"} />
                </>
            )}
            <Analytics />
            {isApiUp && children}
            {!isApiUp && (
                <>
                    <div className="flex flex-col gap-6 items-center justify-center min-h-screen bg-red-600 text-white">
                        <div className={"flex flex-row gap-2 items-center justify-center"}>
                            <MdErrorOutline className={"w-8 h-8"} />
                            <h1 className="text-4xl font-source-code-bold">Oops...</h1>
                        </div>

                        <p className="text-lg text-center">We're sorry, but the API is currently unavailable. Please try again later.</p>
                    </div>
                </>
            )}
        </>
    );
};