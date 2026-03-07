import type {Metadata} from "next";
import VideoToolsClient from "@/app/tools/video/client";

export const metadata: Metadata = {
    title: "Space - Video Tools",
};

export default async function VideoToolsPage() {

    return (
        <>
            <VideoToolsClient />
        </>
    )
}