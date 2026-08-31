import type {Metadata} from "next";
import ConnectionsClient from "@/app/home/connections/client";
import {Suspense} from "react";

export const metadata: Metadata = {
    title: "Space - Home (Connections)",
};

export default async function Page() {
    return (
        <>
            <div className={"max-h-screen w-full flex justify-center p-4"}>
                <Suspense fallback={<div className="box-primary h-48 w-full animate-pulse"/>}>
                    <ConnectionsClient />
                </Suspense>
            </div>
        </>
    )
}
