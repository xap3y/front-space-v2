"use client";

import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import { useUser } from "@/hooks/useUser";
import {toast} from "react-toastify";

export default function Page() {

    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    if (user) {
        logout();
    }

    if (error) {
        console.error(error);
        toast.error("Failed to logout")
    }

    if (!loadingUser) {
        router.push('/login/')
    }

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