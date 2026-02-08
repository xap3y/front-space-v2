import type {Metadata} from "next";
import ReportGetApiKey from "@/app/mc/report/get-key/client";

export const metadata: Metadata = {
    title: "Space - Report Get Key",
    robots: { index: false, follow: false },
};


export default async function Page() {
    return (
        <>
            <ReportGetApiKey />
        </>
    )
}