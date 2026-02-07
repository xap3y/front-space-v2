'use client';

import {useEffect} from "react";
import {usePage} from "@/context/PageContext";
import {useRouter} from "next/navigation";
import LoadingPage from "@/components/LoadingPage";

export default function Page() {

    const { pageName, setPage } = usePage();
    const router = useRouter();

    useEffect(() => {
        setPage("home")
        router.push("/home/profile")
    }, [])

    return (
        <>
            <LoadingPage />
        </>
    )
}