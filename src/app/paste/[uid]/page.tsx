'use client';

import {useParams, useRouter} from "next/navigation";
import LoadingPage from "@/components/LoadingPage";
import {useEffect} from "react";

export default function Page() {

    const router = useRouter();
    const { uid } = useParams();

    useEffect(() => {
        router.push('/p/' + uid)
    }, [])

    return (
        <>
            <LoadingPage />
        </>
    )
}