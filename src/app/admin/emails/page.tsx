import type { Metadata } from "next";
import AdminEmailsClient from "@/app/admin/emails/client";
import type { DefaultResponse } from "@/types/core";
import type { EmailEntry } from "@/types/email";
import { getAllEmails } from "@/lib/apiGetters";

export const metadata: Metadata = {
    title: "Space Admin - Emails",
};

export const dynamic = "force-dynamic";

export default async function Page() {
    const res: DefaultResponse = await getAllEmails();
    const emails = ((res.data ?? res.message ?? []) as EmailEntry[]) ?? [];

    console.log("Emails data: " + JSON.stringify(emails));
    return (
        <AdminEmailsClient
            initialEmails={emails}
            initialError={!res.error ? String(res.message ?? "Failed to load emails") : ""}
            totalCount={res.count ?? emails.length}
            fetchedAt={res.timestamp ?? ""}
        />
    );
}
