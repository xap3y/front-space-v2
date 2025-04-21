import {UserInvitor, UserObj} from "@/types/user";
import {getUserRoleBadge} from "@/lib/client";
import LanguageModel from "@/types/LanguageModel";

interface Props {
    user: UserObj;
    lang: LanguageModel
}

export function UserPopupCard({ lang, user }: Props) {
    return (
        <>
            <img
                src={user.avatar || ""}
                alt="avatar"
                className="w-12 h-12 rounded-full mb-2"
            />
            <div>
                <div className={"flex flex-row gap-2 items-center"}>
                    <p className="text-xl font-semibold">{user.username}</p>
                    <span className={"text-xs text-gray-400"}>{" (" + user.uid + ") "}</span>
                    {getUserRoleBadge(user.role)}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                    {lang.global.member_since + " " + new Date(user.createdAt || "").toLocaleDateString()}
                </p>
            </div>
        </>
    )
}