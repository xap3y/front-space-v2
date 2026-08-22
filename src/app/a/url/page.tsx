import UrlShortener from "@/app/a/url/client";
import type {Metadata} from "next";
import {getUserServer} from "@/app/_server/getUser";
import AuthenticatedPageNav from "@/components/AuthenticatedPageNav";

export const metadata: Metadata = {
    title: "Space - URL Shortener",
};

export default async function Page() {
    const user = await getUserServer();
    return (
        <>
            {user && <AuthenticatedPageNav />}
            <UrlShortener />
        </>
    )
}
