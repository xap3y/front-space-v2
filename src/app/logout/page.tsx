"use client";

import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import { useUser } from "@/hooks/useUser";
import {toast} from "react-toastify";
import {useEffect} from "react";

export default function Page() {

    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (error) {
            console.error(error);
            toast.error("Failed to logout")
            return;
        }
        if (!loadingUser && user) {
            logout();
            router.push('/login/')
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