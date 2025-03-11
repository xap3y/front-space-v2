import type {Metadata} from "next";
import TempMailo from "@/app/a/mail/client";

export const metadata: Metadata = {
    title: "Space - Temp mailo",
};

export default async function Page() {
    return (
        <>
            <TempMailo />
        </>
    )
}