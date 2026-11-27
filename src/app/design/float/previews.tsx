"use client";

import {useState} from "react";
import {FaCalendarDay, FaFingerprint} from "react-icons/fa6";
import FloatingHoverCard from "@/components/FloatingHoverCard";
import {UserPopupCard} from "@/components/UserPopupCard";
import {NativeButton} from "@/components/ui/NativeButton";
import {getUserRoleBadgeElement} from "@/lib/roleBadge";
import {PreviewOption} from "../preview-layout";

const variants = [
    {id: "compact", name: "Kompaktní", description: "Jméno, role a datum v krátké vodorovné kartě."},
    {id: "stacked", name: "Profilová", description: "Větší avatar a samostatný řádek s údaji o účtu."},
    {id: "accent", name: "S bočním akcentem", description: "Modrý okraj odlišuje kartu od obsahu pod ní."},
    {id: "pill", name: "Identifikační štítek", description: "Úzký zaoblený tvar do hustého seznamu nebo tabulky."},
    {id: "details", name: "Dvousekční", description: "Role nahoře, ID a datum rozdělené ve spodní liště."},
] as const;

type Variant = typeof variants[number]["id"];

function AccountCard({variant}: {variant: Variant}) {
    const avatar = <img src="/only_logo_bg.png" alt="" className="size-10 shrink-0 rounded-full border border-white/10 bg-[#172650] object-cover" />;
    const role = getUserRoleBadgeElement("OWNER", {size: "xs"});
    const username = <span className="min-w-0 break-all text-sm font-semibold text-white">xap3y</span>;
    const date = <time dateTime="2026-11-27">27. 11. 2026</time>;
    const dateLine = <span className="text-[11px] text-zinc-400">Member since {date}</span>;
    const uid = <span className="text-[11px] text-zinc-400">UID 1</span>;

    if (variant === "stacked") {
        return <div className="w-60 max-w-full overflow-hidden rounded-2xl border border-white/15 bg-[#15171c] text-center shadow-xl">
            <div className="flex flex-col items-center gap-1.5 bg-gradient-to-b from-blue-400/15 to-transparent px-4 pb-3 pt-4">
                <img src="/only_logo_bg.png" alt="" className="size-12 rounded-full border-2 border-sky-300/25 object-cover" />
                <span className="flex items-center gap-2">{username}{role}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 px-3 py-2">{uid}{dateLine}</div>
        </div>;
    }

    if (variant === "accent") {
        return <div className="flex w-[17rem] max-w-full min-w-0 items-center gap-3 rounded-lg border border-[#2d3645] border-l-[3px] border-l-sky-400 bg-[#151a22] p-3 shadow-xl">
            {avatar}
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">{username}{uid}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">{role}{dateLine}</div>
            </div>
        </div>;
    }

    if (variant === "pill") {
        return <div className="flex max-w-full items-center gap-2 rounded-full border border-zinc-700 bg-[#1b1b20] py-1.5 pl-1.5 pr-4 shadow-xl">
            <img src="/only_logo_bg.png" alt="" className="size-8 shrink-0 rounded-full object-cover" />
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">{username}{uid}{role}</div>
                {dateLine}
            </div>
        </div>;
    }

    if (variant === "details") {
        return <div className="w-60 max-w-full overflow-hidden rounded-xl border border-zinc-700 bg-[#151515] shadow-xl">
            <div className="flex items-center gap-3 px-3 py-2.5">{avatar}<div className="min-w-0 flex-1">{username}</div>{role}</div>
            <div className="grid grid-cols-[1fr_1.5fr] divide-x divide-white/10 border-t border-white/10 bg-black/25 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5 px-2.5 py-2"><FaFingerprint aria-hidden="true" />{uid}</span>
                <span className="flex items-center gap-1.5 px-2.5 py-2" aria-label="Member since 27 November 2026"><FaCalendarDay aria-hidden="true" />{date}</span>
            </div>
        </div>;
    }

    return <UserPopupCard
        user={{uid: 1, username: "xap3y", role: "OWNER", avatar: "/only_logo_bg.png", createdAt: "2026-11-27T12:00:00"}}
        memberSince="Member since"
        dateLocale="cs-CZ"
    />;
}

function FloatPreview({variant}: {variant: typeof variants[number]}) {
    const [position, setPosition] = useState<{x: number; y: number} | null>(null);

    return (
        <PreviewOption name={variant.name} description={variant.description}>
            <div className="flex min-h-52 flex-1 flex-col items-center justify-center gap-4 px-3 py-5 sm:px-5">
                <p className="text-xs text-zinc-400">
                    Uploaded by{" "}
                    <NativeButton type="button" variant="ghost" className="!min-h-0 !border-0 !bg-transparent !p-0 underline decoration-sky-500/50 underline-offset-2"
                        onPointerEnter={event => setPosition({x: event.clientX, y: event.clientY})}
                        onPointerMove={event => setPosition({x: event.clientX, y: event.clientY})}
                        onPointerLeave={() => setPosition(null)}
                        onFocus={event => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            setPosition({x: rect.right, y: rect.bottom});
                        }}
                        onBlur={() => setPosition(null)}
                        onKeyDown={event => {if (event.key === "Escape") setPosition(null);}}
                    ><span className="text-sky-300 hover:text-sky-100">xap3y</span></NativeButton>
                </p>
                <AccountCard variant={variant.id} />
                {position && <FloatingHoverCard open position={position} className="drop-shadow-2xl"><AccountCard variant={variant.id} /></FloatingHoverCard>}
            </div>
        </PreviewOption>
    );
}

export default function FloatPreviews() {
    return variants.map(variant => <FloatPreview key={variant.id} variant={variant} />);
}
