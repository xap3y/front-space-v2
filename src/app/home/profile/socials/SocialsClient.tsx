"use client";

import HoverDiv from "@/components/HoverDiv";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    FaDiscord, FaEnvelope, FaFacebook, FaFacebookMessenger, FaGithub, FaGitlab,
    FaInstagram, FaLinkedin, FaReddit, FaSnapchat, FaSoundcloud, FaSpotify,
    FaSteam, FaTelegram, FaThreads, FaTiktok, FaTwitch, FaVk, FaWhatsapp,
    FaXTwitter, FaYoutube,
} from "react-icons/fa6";
import { PiArrowLeftBold, PiBrowserBold, PiCheckBold, PiMagnifyingGlassBold, PiShareNetworkBold } from "react-icons/pi";
import { UserObj, UserSocials } from "@/types/user";
import { getApiUrl } from "@/lib/core";
import { errorToast, okToast } from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";
import {toAsciiAlnumPassword} from "@/lib/clientFuncs";

type SocialKey = keyof UserSocials;
type SocialDefinition = { key: SocialKey; label: string; placeholder: string; icon: React.ReactNode; type?: "url" | "email" };

const SOCIALS: SocialDefinition[] = [
    { key: "website", label: "Website", placeholder: "https://your-site.com", icon: <PiBrowserBold />, type: "url" },
    { key: "email", label: "Public email", placeholder: "you@example.com", icon: <FaEnvelope />, type: "email" },
    { key: "github", label: "GitHub", placeholder: "username", icon: <FaGithub /> },
    { key: "gitlab", label: "GitLab", placeholder: "username", icon: <FaGitlab /> },
    { key: "twitter", label: "X / Twitter", placeholder: "username", icon: <FaXTwitter /> },
    { key: "instagram", label: "Instagram", placeholder: "username", icon: <FaInstagram /> },
    { key: "threads", label: "Threads", placeholder: "username", icon: <FaThreads /> },
    { key: "facebook", label: "Facebook", placeholder: "username", icon: <FaFacebook /> },
    { key: "messenger", label: "Messenger", placeholder: "username", icon: <FaFacebookMessenger /> },
    { key: "linkedin", label: "LinkedIn", placeholder: "username", icon: <FaLinkedin /> },
    { key: "reddit", label: "Reddit", placeholder: "username", icon: <FaReddit /> },
    { key: "discord", label: "Discord", placeholder: "invite code or handle", icon: <FaDiscord /> },
    { key: "telegram", label: "Telegram", placeholder: "username", icon: <FaTelegram /> },
    { key: "whatsapp", label: "WhatsApp", placeholder: "phone number", icon: <FaWhatsapp /> },
    { key: "youtube", label: "YouTube", placeholder: "channel handle", icon: <FaYoutube /> },
    { key: "twitch", label: "Twitch", placeholder: "username", icon: <FaTwitch /> },
    { key: "tiktok", label: "TikTok", placeholder: "username", icon: <FaTiktok /> },
    { key: "spotify", label: "Spotify", placeholder: "user ID", icon: <FaSpotify /> },
    { key: "soundcloud", label: "SoundCloud", placeholder: "username", icon: <FaSoundcloud /> },
    { key: "steam", label: "Steam", placeholder: "custom profile ID", icon: <FaSteam /> },
    { key: "snapchat", label: "Snapchat", placeholder: "username", icon: <FaSnapchat /> },
    { key: "vk", label: "VK", placeholder: "username", icon: <FaVk /> },
];

function normalize(socials?: UserSocials): Record<SocialKey, string> {
    return Object.fromEntries(SOCIALS.map(({ key }) => [key, socials?.[key] || ""])) as Record<SocialKey, string>;
}

export default function SocialsClient({ user }: { user: UserObj }) {
    const initial = useMemo(() => normalize(user.socials), [user.socials]);
    const [values, setValues] = useState(initial);
    const [savedValues, setSavedValues] = useState(JSON.stringify(initial));
    const [query, setQuery] = useState("");
    const [saving, setSaving] = useState(false);
    const dirty = JSON.stringify(values) !== savedValues;
    const shown = SOCIALS.filter((social) => social.label.toLowerCase().includes(query.trim().toLowerCase()));

    const save = async () => {
        setSaving(true);
        try {
            const response = await fetch(getApiUrl() + "/v1/user/me/socials", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": user.apiKey },
                body: JSON.stringify(values),
            });
            if (!response.ok) throw new Error();
            setSavedValues(JSON.stringify(values));
            okToast("Social profiles saved");
        } catch { errorToast("Failed to save social profiles"); }
        finally { setSaving(false); }
    };

    return <section className="flex-1 min-w-0 px-3 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-col gap-4 box-primary p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-center gap-3"><Link href="/home/profile" aria-label="Back to profile" className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-black/20 text-zinc-400 transition hover:text-white"><PiArrowLeftBold /></Link><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-xl text-sky-400"><PiShareNetworkBold /></span><div><h1 className="font-semibold text-white">Social profiles</h1><p className="mt-0.5 text-xs text-zinc-500">Add links shown on your public profile.</p></div></div>
                <div className="relative sm:w-56"><PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-600" /><MainStringInput type="search" value={query} onChange={(value) => setQuery(toAsciiAlnumPassword(value))} placeholder="Find a platform" className="h-9 rounded-lg border-zinc-800 bg-black/20" inputClassName="h-full py-0 pl-9 pr-3 text-xs" /></div>
            </div>

            <div className="box-primary p-3 sm:p-4">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((social) => <label key={social.key} className="group rounded-xl border border-zinc-800 bg-black/15 p-2.5 transition focus-within:border-zinc-600">
                        <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-400"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[.04] text-base text-zinc-300">{social.icon}</span>{social.label}</span>
                        <MainStringInput type={social.type || "text"} value={values[social.key]} onChange={(value) => setValues((current) => ({ ...current, [social.key]: toAsciiAlnumPassword(value) }))} placeholder={social.placeholder} autoComplete="off" className="h-9 rounded-lg border-zinc-800 bg-black/25" inputClassName="h-full py-0 px-3 text-xs placeholder:text-zinc-700" />
                    </label>)}
                    {shown.length === 0 && <div className="col-span-full py-10 text-center text-sm text-zinc-500">No matching platform</div>}
                </div>
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-800 bg-[#101014] p-3 sm:flex-row sm:items-center sm:justify-between"><p className={`text-xs ${dirty ? "text-amber-300" : "text-zinc-500"}`}>{dirty ? "Unsaved changes" : "Up to date"}</p><HoverDiv type="SAVE" icon={<PiCheckBold/>} onClick={save} disabled={!dirty || saving} className="h-9 rounded-lg px-4 text-xs font-semibold">{saving ? "Saving…" : "Save changes"}</HoverDiv></div>
        </div>
    </section>;
}
