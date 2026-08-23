"use client";

import HoverDiv from "@/components/HoverDiv";

// @ts-ignore
import { EmbedVisualizer } from "embed-visualizer";
import "embed-visualizer/dist/index.css";

import { useEffect, useMemo, useState } from "react";
import { PiCheckBold, PiLinkBold, PiMagicWandBold, PiPaletteBold, PiTextAaBold, PiUserBold } from "react-icons/pi";
import { UserObj } from "@/types/user";
import { EmbedSettings } from "@/types/configs";
import { errorToast, getUserEmbedSettings, okToast, saveUserEmbedSettings } from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";

const DEFAULT_SETTINGS: EmbedSettings = { enabled: false, title: "", titleUrl: "", description: "", color: "#5865F2", authorName: "" };
const COLOR_PRESETS = ["#5865F2", "#0EA5E9", "#10B981", "#F59E0B", "#F43F5E", "#A855F7"];

function hexToInt(hex: string) { return Number.parseInt(hex.replace("#", ""), 16); }

function FieldLabel({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
    return <div className="mb-2 flex items-start gap-2.5"><span className="mt-0.5 text-base text-sky-300">{icon}</span><div><label className="block text-sm font-semibold text-zinc-100">{title}</label>{hint && <p className="mt-0.5 text-xs leading-5 text-zinc-500">{hint}</p>}</div></div>;
}

const inputClass = "w-full rounded-lg border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:border-zinc-500 disabled:cursor-not-allowed";

export default function EmbedTabContent({ user }: { user: UserObj }) {
    const [settings, setSettings] = useState<EmbedSettings>(DEFAULT_SETTINGS);
    const [lastSaved, setLastSaved] = useState(JSON.stringify(DEFAULT_SETTINGS));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        getUserEmbedSettings(user.apiKey).then((value) => {
            if (!active) return;
            const normalized = { ...DEFAULT_SETTINGS, ...(value || {}) } as EmbedSettings;
            for (const key of Object.keys(normalized) as Array<keyof EmbedSettings>) {
                if (normalized[key] == null) (normalized as any)[key] = key === "enabled" ? false : "";
            }
            setSettings(normalized);
            setLastSaved(JSON.stringify(normalized));
            setLoading(false);
        }).catch(() => { if (active) { errorToast("Failed to load embed settings"); setLoading(false); } });
        return () => { active = false; };
    }, [user.apiKey]);

    const dirty = JSON.stringify(settings) !== lastSaved;
    const update = <K extends keyof EmbedSettings>(key: K, value: EmbedSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
    const embed = useMemo(() => {
        const data: any = { embed: { image: { url: "https://r2.xap3y.eu/media/RSOY1YQB" }, color: hexToInt(settings.color || DEFAULT_SETTINGS.color) } };
        if (settings.title) data.embed.title = settings.title;
        if (settings.titleUrl) data.embed.url = settings.titleUrl;
        if (settings.description) data.embed.description = settings.description;
        if (settings.authorName) data.embed.author = { name: settings.authorName };
        return data;
    }, [settings]);

    const save = async () => {
        setSaving(true);
        try {
            if (!await saveUserEmbedSettings(user.apiKey, settings)) throw new Error();
            setLastSaved(JSON.stringify(settings));
            okToast("Embed settings saved");
        } catch { errorToast("Failed to save embed settings"); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="grid animate-pulse gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.82fr)]"><div className="h-[470px] rounded-2xl bg-white/[.035]" /><div className="h-[360px] rounded-2xl bg-white/[.035]" /></div>;

    return <div className="animate-fade-in space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-white/[.08] bg-black/10 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[.04] text-lg text-zinc-300"><PiMagicWandBold /></span><div><h2 className="text-sm font-semibold text-white">Discord upload embed</h2><p className="mt-0.5 max-w-xl text-xs leading-5 text-zinc-500">Customize how uploaded images appear when shared on Discord.</p></div></div>
            <HoverDiv type={settings.enabled ? "SAVE" : "INFO"} role="switch" aria-checked={settings.enabled} onClick={() => update("enabled", !settings.enabled)} className="group shrink-0 rounded-lg px-3 py-2">
                <span className={`relative block h-[18px] w-8 shrink-0 rounded-full transition-colors ${settings.enabled ? "bg-emerald-600" : "bg-zinc-700"}`}>
                    <span className={`absolute left-0.5 top-0.5 block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${settings.enabled ? "translate-x-3.5" : "translate-x-0"}`} />
                </span>
                <span className="ml-3 min-w-[46px] whitespace-nowrap text-left text-[11px] font-semibold leading-none">{settings.enabled ? "Enabled" : "Disabled"}</span>
            </HoverDiv>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.75fr)]">
            <section className={`rounded-xl border border-white/[.08] bg-black/10 p-3.5 transition sm:p-4 ${!settings.enabled ? "opacity-55" : ""}`}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div><FieldLabel icon={<PiTextAaBold />} title="Embed title" hint="The first line people notice." /><MainStringInput disabled={!settings.enabled} className="rounded-lg border-white/10 bg-black/15" inputClassName="py-2.5 px-3 text-sm" value={settings.title} maxLength={256} placeholder="A fresh upload" onChange={(value) => update("title", value)} /></div>
                    <div><FieldLabel icon={<PiLinkBold />} title="Title link" hint="Optional destination when the title is clicked." /><MainStringInput disabled={!settings.enabled} type="url" className="rounded-lg border-white/10 bg-black/15" inputClassName="py-2.5 px-3 text-sm" value={settings.titleUrl} placeholder="https://example.com" onChange={(value) => update("titleUrl", value)} /></div>
                    <div className="sm:col-span-2"><FieldLabel icon={<PiTextAaBold />} title="Description" hint="Add context beneath the title." /><textarea disabled={!settings.enabled} className={`${inputClass} min-h-20 resize-y leading-5`} value={settings.description} maxLength={4096} placeholder="Uploaded with Space" onChange={(e) => update("description", e.target.value)} /><div className="mt-1 text-right text-[10px] text-zinc-600">{settings.description.length} / 4096</div></div>
                    <div><FieldLabel icon={<PiUserBold />} title="Author label" hint="Shown above the title." /><MainStringInput disabled={!settings.enabled} className="rounded-lg border-white/10 bg-black/15" inputClassName="py-2.5 px-3 text-sm" value={settings.authorName} maxLength={256} placeholder={`Uploaded by ${user.username}`} onChange={(value) => update("authorName", value)} /></div>
                    <div><FieldLabel icon={<PiPaletteBold />} title="Accent color" hint="The colored bar on the embed." /><div className="flex h-[46px] items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-2.5"><label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-white/15" style={{ backgroundColor: settings.color }}><input disabled={!settings.enabled} type="color" className="absolute inset-0 h-10 w-10 cursor-pointer opacity-0" value={settings.color} onChange={(e) => update("color", e.target.value.toUpperCase())} /></label><MainStringInput disabled={!settings.enabled} className="min-w-0 flex-1 border-0 bg-transparent" inputClassName="p-0 font-mono text-sm uppercase text-zinc-300" value={settings.color} maxLength={7} onChange={(value) => /^#?[0-9a-fA-F]{0,6}$/.test(value) && update("color", value.startsWith("#") ? value : `#${value}`)} /></div></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{COLOR_PRESETS.map((color) => <HoverDiv type="INFO" disabled={!settings.enabled} key={color} aria-label={`Use ${color}`} onClick={() => update("color", color)} className={`h-7 w-7 rounded-md p-0 ${settings.color.toUpperCase() === color ? "ring-2 ring-white" : ""}`} style={{ backgroundColor: color }} />)}</div>
            </section>

            <aside className="overflow-hidden rounded-xl border border-white/[.08] bg-black/10 lg:sticky lg:top-5"><div className="flex items-center justify-between border-b border-white/[.07] px-3.5 py-2.5"><div><p className="text-sm font-semibold text-zinc-200">Preview</p><p className="text-[11px] text-zinc-500">Updates as you type</p></div><span className="text-[10px] font-semibold text-zinc-600">Discord</span></div><div className="min-h-[240px] p-3.5">{settings.enabled ? <div className="space-embed-visualizer-scope w-full overflow-x-auto"><EmbedVisualizer embed={embed} onError={(error: unknown) => console.error("Error while parsing embed:", error)} /></div> : <div className="flex min-h-[210px] flex-col items-center justify-center text-center"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[.04] text-xl text-zinc-600"><PiMagicWandBold /></span><p className="mt-3 text-sm font-medium text-zinc-500">Preview disabled</p><p className="mt-1 text-xs text-zinc-600">Enable the embed to customize it.</p></div>}</div></aside>
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-white/[.08] bg-black/10 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3"><p className={`text-xs ${dirty ? "text-amber-300" : "text-zinc-500"}`}>{dirty ? "Unsaved changes" : "Up to date"}</p><HoverDiv type="SAVE" icon={<PiCheckBold/>} onClick={save} disabled={!dirty || saving} className="min-h-9 rounded-lg px-4 text-xs font-semibold">{saving ? "Saving…" : "Save changes"}</HoverDiv></div>
    </div>;
}
