import type {Metadata} from "next";
import TempMailPage from "@/app/home/tempmail/client";

export const metadata: Metadata = {
    title: "Space - Home (TempMail)",
};

export default async function Page() {
    return (
        <>
            <div className={"w-full min-h-screen flex items-center justify-center p-4"}>
                <TempMailPage />
            </div>
        </>
    )
}