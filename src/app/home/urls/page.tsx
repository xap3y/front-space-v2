import type {Metadata} from "next";
import HomeUrlsPage from "@/app/home/urls/client";

export const metadata: Metadata = {
    title: "Space - Home (urls)",
};


export default async function Page() {
    return (
        <>
            <HomeUrlsPage />
        </>
    )
}