import { getUsers } from "@/lib/apiGetters";
import { DefaultResponse } from "@/types/core";
import { UserObj } from "@/types/user";
import UrlsClient from "./client";

export const dynamic = "force-dynamic";

export default async function UrlsAdminPage() {
    const res: DefaultResponse = await getUsers();
    const users = (res.data ?? []) as UserObj[];

    return (
        <UrlsClient
            users={users}
        />
    );
}
