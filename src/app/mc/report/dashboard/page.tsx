import type {Metadata} from "next";
import ReportsDashboardClient from "@/app/mc/report/dashboard/client";


export const metadata: Metadata = {
    title: "Space - Report Control Center",
    robots: { index: false, follow: false },
};


export default async function Page() {
    return (
        <>
            <ReportsDashboardClient />
        </>
    )
}
