'use client';

import {useUser} from "@/hooks/useUser";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import LoadingPage from "@/components/LoadingPage";
import {BuildingInProgressPage} from "@/components/GlobalComponents";

export default function AdminPage() {

    const { user, loadingUser, error } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loadingUser) return;
        else if (!user || user.role !== 'OWNER') {
            return router.push("/login");
        }
    }, [user, loadingUser, error])

    if (loadingUser || !user || user.role !== 'OWNER') {
        return <LoadingPage/>
    }

    return (
        <>
            <h1 className="text-3xl font-bold underline">
                Admin Page
            </h1>

            <BuildingInProgressPage/>
        </>
    )
}