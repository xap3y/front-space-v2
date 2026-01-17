import InvitesClient from "@/app/admin/invites/client";
import type { InviteCode } from "@/types/invite";
import type { DefaultResponse } from "@/types/core";
import {getInviteCodes} from "@/lib/apiGetters";
import {useMemo} from "react";

export default async function InviteAdminPage({
                                                  searchParams,
                                              }: {
    searchParams?: Promise<{ used?: string }>;
}) {
    const sp = (await searchParams) ?? {};
    const usedParam = sp.used;

    const used =
        usedParam === "true" ? true : usedParam === "false" ? false : undefined;

    let queryUrl = "/v1/admin/invite/get";

    if (used !== undefined) {
        queryUrl += (used) ? "?used=true" : "?used=false";
    }

    const res: DefaultResponse = await getInviteCodes(queryUrl);

    // Your getter returns DefaultResponse; list is typically in message OR data depending on your implementation.
    // Based on your earlier getter: it returns "data" from getValidatedResponse.
    // If your list is actually in `res.data`, keep this. If it's in `res.message`, swap it.
    const invites = ((res.data ?? res.message ?? []) as InviteCode[]) ?? [];

    return <InvitesClient initialInvites={invites} initialUsed={used} initialError={res.error ? String(res.message ?? "Error") : ""} />;
}