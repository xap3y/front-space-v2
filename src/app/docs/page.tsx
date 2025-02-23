"use client";

import { RedocStandalone } from "redoc";
import { useEffect, useState } from "react";

export default function Page() {

    const [spec, setSpec] = useState<string | null>(null);

    useEffect(() => {
        fetch("/redoc.json")
            .then((res) => res.json())
            .then((data) => setSpec(JSON.stringify(data)))
            .catch((err) => console.error("Failed to load OpenAPI spec:", err));
    }, []);

    if (!spec) return <p>Loading API docs...</p>;

    return (
        <>
            <div className={"bg-transparent"}>
                <RedocStandalone specUrl="/redoc.json" options={{
                    nativeScrollbars: true,
                }}/>
            </div>
        </>
    )
}