import type {Metadata} from "next";
import ImageToolsClient from "@/app/tools/image/client";

export const metadata: Metadata = {
    title: "Space - Image Tools",
};

export default async function ImageToolsPage() {

    return (
        <>
            <ImageToolsClient />
        </>
    )
}