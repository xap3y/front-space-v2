import type {Metadata} from "next";
import HomeDashboardPage from "@/app/home/dashboard/client";

export const metadata: Metadata = {
    title: "Space - Home (urls)",
};

export default function Page() {
    return (
        <>
            <HomeDashboardPage />
        </>
    )
}