"use client";

import {useId, useRef, useState} from "react";
import {MdKeyboardArrowUp, MdLogout, MdOutlineAdminPanelSettings, MdPersonOutline} from "react-icons/md";
import {NativeButton} from "@/components/ui/NativeButton";
import {getUserRoleBadgeElement} from "@/lib/roleBadge";
import {PreviewOption} from "../preview-layout";

const variants = [
    {id: "above", name: "Samostatné menu", description: "Menu nad účtem. Profile leží přímo u spouštěče."},
    {id: "attached", name: "Připojené menu", description: "Jeden panel s výraznějším vstupem na profil."},
    {id: "side", name: "Menu vedle účtu", description: "Na širší obrazovce se panel vyklopí vedle účtu."},
] as const;

const actions = [
    {label: "Profile", icon: MdPersonOutline, message: "Ukázka: otevření profilu."},
    {label: "Admin", icon: MdOutlineAdminPanelSettings, message: "Ukázka: otevření administrace."},
    {label: "Logout", icon: MdLogout, message: "Ukázka: odhlášení."},
] as const;

function ProfilePreview({variant}: {variant: typeof variants[number]}) {
    const [open, setOpen] = useState(true);
    const [message, setMessage] = useState("");
    const trigger = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    const side = variant.id === "side";
    const attached = variant.id === "attached";

    return (
        <PreviewOption name={variant.name} description={variant.description}>
            <div className="flex min-h-64 flex-1 items-end justify-center px-3 pb-4 pt-5 sm:px-5">
                <div className={`flex max-w-full flex-col-reverse ${side ? "w-full gap-1.5 sm:flex-row sm:items-start sm:justify-center" : "w-60"} ${attached ? "overflow-hidden rounded-xl border border-[#323744] bg-[#141720]" : "gap-1.5"}`}
                    onKeyDown={event => {
                        if (event.key === "Escape" && open) {
                            setOpen(false);
                            trigger.current?.focus();
                        }
                    }}
                >
                    <NativeButton ref={trigger} aria-expanded={open} aria-controls={menuId} type="button"
                        onClick={() => setOpen(value => !value)}
                        className={`min-w-0 !justify-start !gap-2.5 !py-2 text-left ${side ? "sm:w-44" : "w-full"} ${attached ? "!rounded-none !border-x-0 !border-b-0" : "rounded-lg"}`}>
                        <img src="/only_logo_bg.png" alt="" className="size-9 shrink-0 rounded-full border border-white/10 object-cover" />
                        <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block truncate text-xs font-semibold text-white">xap3y <span className="font-normal text-zinc-400">(1)</span></span>
                            {getUserRoleBadgeElement("OWNER", {size: "xs"})}
                        </span>
                        <MdKeyboardArrowUp aria-hidden="true" className={`size-4 shrink-0 text-zinc-400 motion-safe:transition-transform ${open ? (side ? "rotate-180 sm:rotate-90" : "rotate-180") : ""}`} />
                    </NativeButton>
                    <ul id={menuId} hidden={!open}
                        className={`${open ? "flex" : "hidden"} flex-col-reverse gap-1 p-1.5 ${attached ? "p-2" : "rounded-lg border border-white/10 bg-[#141416]"} ${side ? "sm:w-36 sm:flex-col" : ""}`}>
                        {actions.map(({label, icon: Icon, message}) => (
                            <li key={label} className={label === "Logout" ? `border-b border-white/10 pb-1 ${side ? "sm:border-b-0 sm:border-t sm:pb-0 sm:pt-1" : ""}` : ""}>
                                <NativeButton type="button" layout="row" onClick={() => {setMessage(message); setOpen(false); trigger.current?.focus();}}>
                                    <span className={`flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 ${label === "Logout" ? "text-red-300 hover:bg-red-500/10" : label === "Profile" && attached ? "bg-sky-400/15 text-sky-200 hover:bg-sky-400/25" : "text-zinc-200 hover:bg-white/10"}`}>
                                        <Icon aria-hidden="true" className="size-4 shrink-0" />{label}
                                    </span>
                                </NativeButton>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <p role="status" className="min-h-7 px-4 pb-3 text-center text-[11px] text-sky-200">{message}</p>
        </PreviewOption>
    );
}

export default function ProfilePreviews() {
    return variants.map(variant => <ProfilePreview key={variant.id} variant={variant} />);
}
