import type {Metadata} from "next";
import TempMailPage from "@/app/home/tempmail/client";

export const metadata: Metadata = {
    title: "Space - Home (TempMail)",
};

export default async function Page() {
    return (
        <>
            <div className={"max-h-screen w-full flex md:py-20 py-2 justify-center p-4"}>
                <TempMailPage />
            </div>
        </>
    )
}