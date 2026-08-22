import type {Metadata} from "next";
import {getUserServer} from "@/app/_server/getUser";
import {redirect} from "next/navigation";
import {getUserDiscordConnection} from "@/lib/apiGetters";
import ProfileShell from "@/app/home/profile/ProfileShell";

export const metadata: Metadata = {
    title: "Space - Home (profile)",
};


export default async function Page() {

    const user = await getUserServer();
    if (!user) {
        redirect("/login");
    }

    const discordConnection = await getUserDiscordConnection(user.apiKey);

    return (
        <>
            <ProfileShell
                user={user}
                discordConnection={discordConnection}
            />
        </>
    )
}
