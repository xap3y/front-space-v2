import type {Metadata} from "next";
import HomeDashboardPage from "@/app/home/dashboard/client";

export const metadata: Metadata = {
    title: "Space - Home (dashboard)",
};

export default function Page() {
    return (
        <>
            <HomeDashboardPage />
        </>
    )
}