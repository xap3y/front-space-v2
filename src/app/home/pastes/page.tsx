import type {Metadata} from "next";
import HomePastesPage from "@/app/home/pastes/client";

export const metadata: Metadata = {
    title: "Space - Home (pastes)",
};


export default async function Page() {

    return (
        <>
            <HomePastesPage />
        </>
    )
}