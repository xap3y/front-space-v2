import type {Metadata} from "next";
import {getUserServer} from "@/app/_server/getUser";
import {redirect} from "next/navigation";
import {getUserDiscordConnection} from "@/lib/apiGetters";
import ProfileShell from "@/app/home/profile/ProfileShell";
import DiscordClient from "./clients/DiscordClient";
import {Suspense} from "react";

export const metadata: Metadata = {
    title: "Space - Home (profile)",
};


async function DiscordConnectionContent({apiKey}: {apiKey: string}) {
    const discordConnection = await getUserDiscordConnection(apiKey);

    return (
        <DiscordClient
            discordConnection={discordConnection}
            fallbackHandle="/home/connections"
        />
    );
}

export default async function Page() {
    const user = await getUserServer();
    if (!user) {
        redirect("/login");
    }

    return (
        <>
            <ProfileShell
                user={user}
                discordContent={
                    <Suspense fallback={
                        <div className="flex h-10 animate-pulse items-center gap-3" aria-label="Loading Discord connection">
                            <div className="h-6 w-6 rounded bg-white/5" />
                            <div className="h-6 w-24 rounded bg-white/5" />
                        </div>
                    }>
                        <DiscordConnectionContent apiKey={user.apiKey} />
                    </Suspense>
                }
            />
        </>
    )
}
