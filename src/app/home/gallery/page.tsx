import type {Metadata} from "next";
import HomeGalleryPage from "@/app/home/gallery/client";

export const metadata: Metadata = {
    title: "Space - Home (gallery)",
};


export default async function GalleryPageServer() {
    return (
        <>
            <HomeGalleryPage />
        </>
    )
}