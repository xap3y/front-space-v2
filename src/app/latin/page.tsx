import type {Metadata} from "next";
import LatinPage from "@/app/latin/client";

export const metadata: Metadata = {
    title: "Space - Latin",
};

export default async function Page() {

    return (
        <>
            <LatinPage />
        </>
    )
}