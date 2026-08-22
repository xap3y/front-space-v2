import {FaCalendarDays, FaEnvelope, FaFileLines, FaHardDrive, FaImage, FaLink, FaShieldHalved} from "react-icons/fa6";
import {getUserRoleBadgeServer} from "@/lib/server";
import {RoleType, UserObj} from "@/types/user";
import {DiscordConnection} from "@/types/discord";
import ApiKeyClient from "./clients/ApiKeyClient";
import DiscordClient from "./clients/DiscordClient";
import AvatarClient from "./clients/AvatarClient";

type Props = { user: UserObj; discordConnection: DiscordConnection | null };

function storage(bytes: number) {
    if (!bytes) return "0 MB";
    const mb = bytes / 1024 / 1024;
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export default function ProfileShell({user, discordConnection}: Props) {
    const cards = [
        {label: "Uploads", value: user.stats.totalUploads, icon: FaImage, color: "text-violet-400 bg-violet-500/10"},
        {label: "Pastes", value: user.stats.pastesCreated, icon: FaFileLines, color: "text-amber-400 bg-amber-500/10"},
        {label: "Short URLs", value: user.stats.urlsShortened, icon: FaLink, color: "text-cyan-400 bg-cyan-500/10"},
        {label: "Storage", value: storage(user.stats.storageUsed), icon: FaHardDrive, color: "text-emerald-400 bg-emerald-500/10"},
    ];

    return <section className="flex-1 min-w-0 px-3 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#101014] p-5 md:p-7">
                <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
                <div className="relative flex flex-col items-center gap-5 sm:flex-row">
                    <AvatarClient avatar={user.avatar} username={user.username} apiKey={user.apiKey} />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                        <div className="flex flex-col items-center gap-2 sm:flex-row"><h1 className="truncate text-3xl font-bold tracking-tight">{user.username}</h1>{getUserRoleBadgeServer(user.role as RoleType)}</div>
                        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-zinc-400 sm:justify-start"><FaEnvelope className="text-zinc-600" />{user.email}</p>
                        <p className="mt-1 flex items-center justify-center gap-2 text-xs text-zinc-500 sm:justify-start"><FaCalendarDays />Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {cards.map(({label, value, icon: Icon, color}) => <div key={label} className="rounded-xl border border-zinc-800 bg-[#101014] p-4">
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
                    <p className="text-xl font-bold md:text-2xl">{value}</p><p className="mt-0.5 text-xs text-zinc-500">{label}</p>
                </div>)}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-5 md:p-6">
                    <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><FaShieldHalved /></span><div><h2 className="font-semibold">Account & security</h2><p className="text-xs text-zinc-500">Credentials and membership details</p></div></div>
                    <ApiKeyClient apiKey={user.apiKey} createdAt={user.createdAt} invitor={user.invitor} storageUsed={user.stats.storageUsed} />
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-5 md:p-6">
                    <div className="mb-5"><h2 className="font-semibold">Connected accounts</h2><p className="text-xs text-zinc-500">Manage integrations linked to Space</p></div>
                    <DiscordClient discordConnection={discordConnection} fallbackHandle="/home/connections" />
                    <div className="mt-6 rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-500">More integrations are available from the Connections page.</div>
                </div>
            </div>
        </div>
    </section>;
}
