import type {Metadata} from "next";
import HomeProfilePage from "@/app/home/profile/client";

export const metadata: Metadata = {
    title: "Space - Home (profile)",
};


export default async function Page() {
    return (
        <>
            <HomeProfilePage />
        </>
    )
}