import type {Metadata} from "next";
import ReportsApiDocsPage from "@/app/mc/report/docs/client";

export const metadata: Metadata = {
    title: "Space - Report System API docs",
};

export default async function Page() {
    return (
        <div className={"!bg-white"}>
            <ReportsApiDocsPage />
        </div>
    )
}