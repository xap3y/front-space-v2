import AdminPage from "@/app/admin/client";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - Administration",
};

export default async function Page() {

    return (
        <>
            <AdminPage />
        </>
    )
}