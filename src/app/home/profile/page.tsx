import type {Metadata} from "next";
import HomeProfilePage from "@/app/home/profile/client";
import {getUserServer} from "@/app/_server/getUser";
import {redirect} from "next/navigation";
import {getImageCountStatsOnDate, getUserDiscordConnection} from "@/lib/apiGetters";
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

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 9);

    const stats = await getImageCountStatsOnDate(
        from.toISOString().split("T")[0],
        to.toISOString().split("T")[0],
        user.apiKey
    );

    return (
        <>
            <ProfileShell
                user={user}
                discordConnection={discordConnection}
                stats={stats}
                from={from}
                to={to}
            />
        </>
    )
}