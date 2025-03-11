import UrlShortener from "@/app/a/url/client";
import type {Metadata} from "next";
import ImageUploader from "@/app/a/image/client";

export const metadata: Metadata = {
    title: "Space - Image Uploader",
};

export default async function Page() {
    return (
        <>
            <ImageUploader />
        </>
    )
}