"use client";


import {usePage} from "@/context/PageContext";
import {useEffect} from "react";

export default function HomeGalleryPage() {

    const { pageName, setPage } = usePage();

    useEffect(() => {
        setPage("gallery")
    }, [])

    return (
        <>
            <div className={"w-full"}>
                <h1 className={"text-center"}>test</h1>
            </div>
        </>
    )
}