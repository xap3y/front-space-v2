"use client";

import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import { useUser } from "@/hooks/useUser";
import {useEffect} from "react";
import {getApiUrl} from "@/lib/core";
import {logApiRes} from "@/lib/logger";

export default function Page() {

    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (error) {
            logout()
            //console.error(error);
            //toast.error("Failed to logout")
            router.push('/login')
            return;
        }
        if (!loadingUser && user) {
            async function fetchData() {
                const response = await fetch(getApiUrl() + "/v1/auth/logout", {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });

                logApiRes(response);
                if (response.ok) {
                    logout();
                }
                router.push('/login')
            }
            fetchData()
                .then(() => {
                    console.log("Logged out");
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        }
    }, [loadingUser, user, error])

    if (loadingUser) {
        return (
            <>
                <LoadingPage />
            </>
        )
    }

    return (
        <>
            <LoadingPage />
        </>
    )
}