import type {Metadata} from "next";
import HomeSettingsPage from "@/app/home/settings/client";

export const metadata: Metadata = {
    title: "Space - Home (settings)",
};

export default async function Page() {
    return (
        <>
            <HomeSettingsPage />
        </>
    )
}