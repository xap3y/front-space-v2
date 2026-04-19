import type {Metadata} from "next";
import FilesPageClient from "@/app/home/files/client";

export const metadata: Metadata = {
    title: "Space - Home (files)",
};

export default function Page() {
    return (
        <>
            <FilesPageClient/>
        </>
    )
}