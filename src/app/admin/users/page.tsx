import AdminPage from "@/app/admin/client";
import InvitesPage from "@/app/admin/invites/client";
import UsersPage from "@/app/admin/users/client";
import {getUsers} from "@/lib/apiGetters";
import {DefaultResponse} from "@/types/core";
import {UserObj, UserObjShort} from "@/types/user";
import UsersClient from "@/app/admin/users/client";

export default async function UsersAdminPage() {

    const res: DefaultResponse = await getUsers();

    const users = (res.data ?? []) as UserObj[];

    return (
        <UsersClient
            initialUsers={users}
            initialError={res.error ? String(res.message ?? "Failed to load users") : ""}
            totalCount={res.count ?? users.length}
            fetchedAt={res.timestamp ?? ""}
        />
    );
}