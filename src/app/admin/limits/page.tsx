import {getUsers} from "@/lib/apiGetters";
import type {DefaultResponse} from "@/types/core";
import type {UserObj} from "@/types/user";
import ResourceLimitsClient from "@/app/admin/limits/client";

export const dynamic = "force-dynamic";

export default async function ResourceLimitsPage() {
    const response: DefaultResponse = await getUsers();
    const users = ((response.data ?? []) as UserObj[])
        .filter(user => user.role !== "ADMIN" && user.role !== "OWNER");

    return <ResourceLimitsClient initialUsers={users} initialError={response.error ? String(response.message ?? "Failed to load users") : ""} />;
}
