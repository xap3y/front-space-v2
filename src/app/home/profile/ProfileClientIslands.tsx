"use client";

import dynamic from "next/dynamic";
import { UserObj } from "@/types/user";
import { DiscordConnection } from "@/types/discord";

const ApiKeyClient = dynamic(() => import("./clients/ApiKeyClient"), { ssr: false });
const DiscordClient = dynamic(() => import("./clients/DiscordClient"), { ssr: false });
const StatsClient = dynamic(() => import("./clients/StatsClient"), { ssr: false });

type Props = {
    user: UserObj;
    discordConnection: DiscordConnection | null;
    stats: any;
    from: Date;
    to: Date;
};

export default function ProfileClientIslands({ user, discordConnection, stats, from, to }: Props) {
    return (
        <>
            <ApiKeyClient
                apiKey={user.apiKey}
                createdAt={user.createdAt}
                invitor={user.invitor}
                storageUsed={user.stats.storageUsed}
            />

            <DiscordClient discordConnection={discordConnection} fallbackHandle="/home/connections" />

            <StatsClient
                initialStats={stats}
                initialFrom={from}
                initialTo={to}
                apiKey={user.apiKey}
            />
        </>
    );
}