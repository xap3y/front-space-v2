"use client";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {getCookie} from "cookies-next/client";
import {getApiKey, getApiUrl} from "@/lib/core";
import {NestedLinktree} from "@/components/NestedLinktree";
import {dashLinkTree} from "@/config/dashLinkTree";
import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function DashboardPage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("home")
    }, [])

    const { user, loadingUser, error } = useUser();

    console.log("DB : " + user)

    function getIv() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    if (loadingUser) {
        return (
            <LoadingPage/>
        )
    }

    if (error || !user) {
        return (
            <>
                <h1>ERROR</h1>
                <p>{error}</p>
            </>
        )
    }

    return (
        <>

            <div className={"flex flex-col gap-5 text-wrap w-full overflow-x-hidden"}>

                <h1 className={"text-5xl font-bold mb-20 text-center mt-2"}>Temporary Dashboard</h1>

                <p>LOGGED AS {user ? JSON.stringify(user) : "NULL"}</p>
                <p>COOKIES_AUTH_TOKEN: {getCookie("auth_token")}</p>
                <p>IV: {getIv()}</p>
                <p>API_KEY: {getApiKey()}</p>
                <p>API_URL: {getApiUrl()}</p>

                <div className={"flex flex-row gap-2"}>
                    <NestedLinktree links={dashLinkTree} />
                </div>
            </div>
        </>
    )
}