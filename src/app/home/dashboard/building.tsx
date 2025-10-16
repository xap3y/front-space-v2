"use client";

import {useUser} from "@/hooks/useUser";
import {useEffect} from "react";
import LoadingPage from "@/components/LoadingPage";
import {usePage} from "@/context/PageContext";
import {useRouter} from "next/navigation";
import {BuildingInProgressPage} from "@/components/GlobalComponents";

export default function HomeDashboardPageTemp() {

    const { user, loadingUser, error } = useUser();
    const { pageName, setPage } = usePage();

    const router = useRouter();

    useEffect(() => {
        setPage("dashboard");
    }, []);

    useEffect(() => {
        if (!loadingUser && !user) {
            router.push("/login");
        }
    }, [user, loadingUser, error])

    if (loadingUser || !user) return <LoadingPage/>

    return (
        <>
            <BuildingInProgressPage/>
        </>
    )
}