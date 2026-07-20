import { getUsers } from "@/lib/apiGetters";
import { DefaultResponse } from "@/types/core";
import { UserObj } from "@/types/user";
import PastesClient from "./client";

export const dynamic = "force-dynamic";

export default async function PastesAdminPage() {
    const res: DefaultResponse = await getUsers();
    const users = (res.data ?? []) as UserObj[];

    return (
        <PastesClient
            users={users}
        />
    );
}
