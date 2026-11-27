import type {ComponentProps} from "react";
import type {RoleType, UserObj} from "@/types/user";
import {getUserRoleBadgeElement} from "@/lib/roleBadge";
import FloatingHoverCard from "@/components/FloatingHoverCard";

interface Props {
    user: Pick<UserObj, "uid" | "username" | "avatar" | "createdAt"> & {role: string};
    memberSince: string;
    dateLocale?: string;
}

export function UserPopupCard({user, memberSince, dateLocale}: Props) {
    const date = new Date(user.createdAt);

    return (
        <div className="flex max-w-full items-center gap-3 rounded-lg border border-zinc-700 bg-[#19191c] px-3 py-2.5 shadow-xl">
            <img
                src={user.avatar || "/images/default-avatar.svg"}
                alt=""
                className="size-10 shrink-0 rounded-full border border-white/10 bg-[#172650] object-cover"
            />
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 break-all text-sm font-semibold text-white">{user.username}</span>
                    <span className="text-[11px] text-zinc-400">UID {user.uid}</span>
                    {getUserRoleBadgeElement(user.role as RoleType, {size: "xs"})}
                </div>
                {!Number.isNaN(date.getTime()) && (
                    <span className="text-[11px] text-zinc-400">
                        {memberSince} <time dateTime={date.toISOString()}>{date.toLocaleDateString(dateLocale)}</time>
                    </span>
                )}
            </div>
        </div>
    );
}

export function UserHoverCard({open, position, ...profile}: Props & Pick<ComponentProps<typeof FloatingHoverCard>, "open" | "position">) {
    return (
        <FloatingHoverCard open={open} position={position} className="drop-shadow-2xl">
            <UserPopupCard {...profile} />
        </FloatingHoverCard>
    );
}
