import type {QrAccount} from "./qrLogin";

const defaultAvatar = "/images/default-avatar.svg";

export default function QrAccountPreview({account}: {account: QrAccount}) {
    return (
        <div className="mx-auto flex w-fit max-w-full items-center gap-3 rounded-lg border border-zinc-800 bg-primary1 px-3 py-2">
            <img
                src={account.avatar || defaultAvatar}
                alt=""
                referrerPolicy="no-referrer"
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full border border-zinc-700 object-cover"
                onError={(event) => {
                    if (event.currentTarget.getAttribute("src") !== defaultAvatar) {
                        event.currentTarget.src = defaultAvatar;
                    }
                }}
            />
            <span className="min-w-0 break-words font-semibold text-white">{account.username}</span>
        </div>
    );
}
