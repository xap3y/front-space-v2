import ReportPageClient from "@/app/mc/report/[uid]/client";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - Report view",
    robots: { index: false, follow: false },
};


export default async function Page() {
    return (
        <>
            <ReportPageClient />
        </>
    )
}