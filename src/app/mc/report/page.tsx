import type {Metadata} from "next";
import ReportFinder from "@/app/mc/report/client";

export const metadata: Metadata = {
    title: "Space - Transcript finder",
    robots: { index: false, follow: false },
};


export default async function Page() {
    return (
        <>
            <ReportFinder />
        </>
    )
}