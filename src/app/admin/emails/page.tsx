import type {Metadata} from "next";
import AdminEmailsClient from "@/app/admin/emails/client";

export const metadata: Metadata = {
    title: "Space Admin - Emails",
};

export default async function Page() {

    return (
        <>
            <AdminEmailsClient />
        </>
    )
}