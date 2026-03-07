import type {Metadata} from "next";
import ToolsPage from "@/app/tools/client";

export const metadata: Metadata = {
    title: "Space - Tools",
};

export default async function Page() {

    return (
        <>
            <ToolsPage />
        </>
    )
}