import PortablePasteCreator from "@/app/a/paste/client";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - Paste Creator",
};

export default async function Page() {
    return (
        <>
            <PortablePasteCreator />
        </>
    )
}