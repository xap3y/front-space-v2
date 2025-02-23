'use client';

import {useRouter} from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import {useEffect} from "react";

export default function Page() {

    const router = useRouter();

    useEffect(() => {
        router.push('/p')
    }, [])

    return (
        <>
            <LoadingPage />
        </>
    )
}