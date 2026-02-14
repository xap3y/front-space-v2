import type {Metadata} from "next";
import TranscriptsDashboardClient from "@/app/mc/report/dashboard/client";


export const metadata: Metadata = {
    title: "Space - Transcripts Dashboard",
    robots: { index: false, follow: false },
};


export default async function Page() {
    return (
        <>
            <TranscriptsDashboardClient />
        </>
    )
}