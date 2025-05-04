"use client";

import {usePage} from "@/context/PageContext";
import {useEffect} from "react";
import {useUser} from "@/hooks/useUser";
import {useRouter} from "next/navigation";

export default function HomePastesPage() {

    const { pageName, setPage } = usePage();
    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loadingUser) {
            return;
        }
        else if (error == 'User not found.') {
            return router.push("/login");
        }
    }, [user, loadingUser, error])

    useEffect(() => {
        setPage("pastes")
    }, [])

    return (
        <>

        </>
    )
}