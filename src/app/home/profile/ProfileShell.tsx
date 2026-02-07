import Image from "next/image";
import dynamic from "next/dynamic";
import {getUserRoleBadgeServer} from "@/lib/server";
import {RoleType, UserObj} from "@/types/user";
import {DiscordConnection} from "@/types/discord";


const ApiKeyClient = dynamic(() => import("./clients/ApiKeyClient"), {ssr: !!false});
const DiscordClient = dynamic(() => import("./clients/DiscordClient"), {ssr: !!false});
const StatsClient = dynamic(() => import("./clients/StatsClient"), {ssr: !!false});

type Props = {
    user: UserObj,
    discordConnection: DiscordConnection | null,
    stats: any,
    from: Date,
    to: Date,
};

export default function ProfileShell({user, discordConnection, stats, from, to}: Props) {
    return (
        <section className="flex-1 min-w-0">
            <div className="mx-auto max-w-6xl px-3 md:px-6 py-10 md:py-12">
                <header className="text-center">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Profile</h1>
                </header>

                <div className="mt-8 grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4 md:gap-6">
                    <div className="space-y-4">
                        <div className="box-primary rounded-2xl p-5">
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                                    <Image
                                        src={user.avatar ?? "/images/default-avatar.svg"}
                                        alt="avatar"
                                        width={112}
                                        height={112}
                                        className="rounded-full w-full h-full border border-white/20 object-cover"
                                    />
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-yellow-400 mt-3">{user.username}</p>
                                <div className="mt-2">{getUserRoleBadgeServer(user.role as RoleType)}</div>
                            </div>

                            <div className="my-5 h-px bg-white/10"/>

                            <ApiKeyClient apiKey={user.apiKey} createdAt={user.createdAt} invitor={user.invitor}
                                          storageUsed={user.stats.storageUsed}/>
                        </div>

                        <div className="box-primary p-5">
                            {/* Subscription placeholder */}
                            <p className="font-semibold">Subscription</p>
                        </div>

                        <div className="box-primary p-5">
                            {/* ShareX links unchanged */}
                            ...
                        </div>
                    </div>

                    <div className="space-y-4 min-w-0">
                        <div className="box-primary p-5 md:p-6 space-y-6">
                            {/* Email / Phone / 2FA static text can stay server-rendered; only edit interactions go client */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <p className="text-xl md:text-2xl font-bold">Email</p>
                                </div>
                                <p className="text-lg md:text-2xl break-all">{user.email}</p>
                            </div>
                            <div className="h-px bg-white/10"/>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xl md:text-2xl font-bold">Phone</p>
                                <div className="text-lg text-gray-400">Disabled</div>
                            </div>
                            <div className="h-px bg-white/10"/>
                            <DiscordClient discordConnection={discordConnection} fallbackHandle="/home/connections"/>
                            <div className="h-px bg-white/10"/>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xl md:text-2xl font-bold">2FA</p>
                                <div className="text-lg text-gray-400">Disabled</div>
                            </div>
                        </div>

                        <StatsClient initialStats={stats} initialFrom={from} initialTo={to} apiKey={user.apiKey}/>
                    </div>
                </div>
            </div>
        </section>
    );
}