import type {Metadata} from "next";
import ImageUploader from "@/app/a/image/client";
import {getUserServer} from "@/app/_server/getUser";
import AuthenticatedPageNav from "@/components/AuthenticatedPageNav";

export const metadata: Metadata = {
    title: "Space - Image Uploader",
};

export default async function Page() {
    const user = await getUserServer();
    return (
        <>
            {user && <AuthenticatedPageNav />}
            <ImageUploader />
        </>
    )
}
