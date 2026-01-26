import type {Metadata} from "next";
import ConnectionsClient from "@/app/home/connections/client";

export const metadata: Metadata = {
    title: "Space - Home (Connections)",
};

export default async function Page() {
    return (
        <>
            <div className={"max-h-screen w-full flex justify-center p-4"}>
                <ConnectionsClient />
            </div>
        </>
    )
}