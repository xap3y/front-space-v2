import type {Metadata} from "next";
import UrlsPage from "@/app/home/urls/new-client";

export const metadata: Metadata = {
    title: "Space - Home (urls)",
};


export default async function Page() {
    return (
        <>
            <UrlsPage />
        </>
    )
}