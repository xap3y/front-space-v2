'use client';

import {useEffect} from "react";
import {usePage} from "@/context/PageContext";
import {useRouter} from "next/navigation";

export default function Page() {

    const { pageName, setPage } = usePage();
    const router = useRouter();

    useEffect(() => {
        setPage("home")
        router.push("/home/dashboard")
    }, [])

    return (
        <>

        </>
    )
}