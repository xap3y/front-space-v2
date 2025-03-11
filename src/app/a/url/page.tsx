import UrlShortener from "@/app/a/url/client";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - URL Shortener",
};

export default async function Page() {
    return (
        <>
            <UrlShortener />
        </>
    )
}