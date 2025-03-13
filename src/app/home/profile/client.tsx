"use client";


import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function HomeProfilePage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("profile")
    }, [])

    return (
        <>

        </>
    )
}