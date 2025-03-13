"use client";

import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function HomeSettingsPage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("settings")
    }, [])

    return (
        <>

        </>
    )
}