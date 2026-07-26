import AdminSessionsClient from "@/app/admin/sessions/client";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - Active Sessions",
};

export default async function Page() {
    return <AdminSessionsClient />;
}
