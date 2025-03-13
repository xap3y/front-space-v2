"use client";


import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function HomeDashboardPage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("home")
    }, [])

    return (
        <>
            <div className={"w-full"}>
                <h1 className={"text-center"}>Dashboard</h1>
            </div>
        </>
    )
}