"use client";

import {useRouter} from "next/navigation";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {useEffect} from "react";

export default function Page() {
    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {

        if (!user && !loadingUser) {
            router.push('/login/')
        } else if (user) {
            router.push('/user/' + user.uid)
        }
    }, [user, loadingUser])

    return (
        <>
            <LoadingPage/>
        </>
    )
}