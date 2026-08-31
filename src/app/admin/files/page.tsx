import { getUsers } from "@/lib/apiGetters";
import type { DefaultResponse } from "@/types/core";
import type { UserObj } from "@/types/user";
import FilesClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminFilesPage() {
    const response: DefaultResponse = await getUsers();
    return <FilesClient users={(response.data ?? []) as UserObj[]} />;
}
