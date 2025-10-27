"use client";

import { Tooltip } from "react-tooltip";
import { HeartbeatChecker } from "./HeartbeatChecker";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {GoogleAnalytics} from "@next/third-parties/google";
import { Analytics } from '@vercel/analytics/next';

export const ClientRoot = ({ children }: { children: React.ReactNode }) => {

    let debug = false;
    let cookies = false;

    if (typeof window !== 'undefined') {
        debug = localStorage.getItem("debug") === "true";
        cookies = localStorage.getItem("cookie_consent") === "granted";
    }

    return (
        <>
            <Tooltip id="my-tooltip" />
            {/*<HeartbeatChecker />*/}
            {debug && <LanguageSwitcher />}
            {cookies && (
                <>
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-J3288JZ3DV"} />
                </>
            )}
            <Analytics />
            {children}
        </>
    );
};