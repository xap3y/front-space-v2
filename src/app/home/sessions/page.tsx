import type {Metadata} from "next";
import HomeSessionsPage from "@/app/home/sessions/client";

export const metadata: Metadata = {
    title: "Space - Home (sessions)",
};

export default async function Page() {
    return (
        <>
            <HomeSessionsPage />
        </>
    )
}
