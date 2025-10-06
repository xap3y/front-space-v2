"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";


export default function LatinPage() {

    const router = useRouter();

    useEffect(() => {
        router.push("https://m.xap3y.space/latin");
    }, []);

    return (
        <>
            <p>301</p>
        </>
    );
}