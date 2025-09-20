import type {Metadata} from "next";
import HomeDashboardPage from "@/app/home/dashboard/client";
import {BuildingInProgressPage} from "@/components/GlobalComponents";

export const metadata: Metadata = {
    title: "Space - Home (dashboard)",
};

export default function Page() {
    return (
        <>
            <BuildingInProgressPage/>
            {/*<HomeDashboardPage />*/}
        </>
    )
}