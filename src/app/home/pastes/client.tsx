"use client";

import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function HomePastesPage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("pastes")
    }, [])

    return (
        <>

        </>
    )
}