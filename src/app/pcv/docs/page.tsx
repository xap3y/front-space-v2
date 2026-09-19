import PcvApiDocsPage from "@/app/pcv/docs/client";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - PlaycoreVip API docs",
};

export default async function Page() {
    return (
        <div className={"!bg-white"}>
            <PcvApiDocsPage />
        </div>
    )
}