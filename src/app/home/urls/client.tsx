"use client";


import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function HomeUrlsPage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("urls")
    }, [])

    return (
        <>

        </>
    )
}