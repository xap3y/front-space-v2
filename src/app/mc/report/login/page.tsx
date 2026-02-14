import type {Metadata} from "next";
import TranscriptsLoginPage from "@/app/mc/report/login/client";

export const metadata: Metadata = {
    title: "Space - Transcripts Login",
    robots: { index: false, follow: false },
};


export default async function Page() {
    return (
        <>
            <TranscriptsLoginPage />
        </>
    )
}