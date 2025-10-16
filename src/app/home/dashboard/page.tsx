import type {Metadata} from "next";
import HomeDashboardPageTemp from "@/app/home/dashboard/building";

export const metadata: Metadata = {
    title: "Space - Home (dashboard)",
};

export default function Page() {
    return (
        <>
            <HomeDashboardPageTemp/>
            {/*<HomeDashboardPage />*/}
        </>
    )
}