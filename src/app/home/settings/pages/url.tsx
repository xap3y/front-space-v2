"use client";

import HoverDiv from "@/components/HoverDiv";

import { useEffect, useState } from "react";
import { PiCheckBold, PiFileTextBold, PiImageBold, PiLinkBold, PiPathBold } from "react-icons/pi";
import { UserObj } from "@/types/user";
import { UrlPreferences, UrlType } from "@/types/configs";
import { errorToast, getUserUrlPreferencesSettings, okToast, saveUserUrlPreferencesSettings } from "@/lib/client";

type PrefKey = keyof UrlPreferences;
type Choice = { value: UrlType | null; label: string; description: string; sample: string };

const CHOICES: Choice[] = [
    { value: null, label: "Default", description: "Use Space's recommended URL for this resource.", sample: "Automatic" },
    { value: "PORTAL", label: "Portal", description: "Open the full Space page with details and actions.", sample: "space.app/i/ABC123" },
    { value: "SHORT", label: "Short", description: "Use the smallest shareable link available.", sample: "i.space/ABC123" },
    { value: "RAW", label: "Raw", description: "Link directly to the resource content or API response.", sample: "api.space/v1/…" },
];

const RESOURCES: Array<{ key: PrefKey; title: string; description: string; icon: React.ReactNode; accent: string }> = [
    { key: "image", title: "Images", description: "Links returned after an image upload.", icon: <PiImageBold />, accent: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
    { key: "paste", title: "Pastes", description: "Links returned when you publish a paste.", icon: <PiFileTextBold />, accent: "text-violet-300 bg-violet-400/10 border-violet-400/20" },
    { key: "url", title: "Short URLs", description: "Links returned by the URL shortener.", icon: <PiLinkBold />, accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
];

export default function UrlPreferencesTabContent({ user }: { user: UserObj }) {
    const [preferences, setPreferences] = useState<UrlPreferences | null>(null);
    const [lastSaved, setLastSaved] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        getUserUrlPreferencesSettings(user.apiKey).then((settings) => {
            if (!active) return;
            if (!settings) throw new Error();
            setPreferences(settings);
            setLastSaved(JSON.stringify(settings));
        }).catch(() => { if (active) errorToast("Failed to load URL preferences"); });
        return () => { active = false; };
    }, [user.apiKey]);

    const dirty = preferences !== null && JSON.stringify(preferences) !== lastSaved;
    const update = (key: PrefKey, value: UrlType | null) => setPreferences((current) => current ? { ...current, [key]: value } : current);

    const save = async () => {
        if (!preferences) return;
        setSaving(true);
        try {
            if (!await saveUserUrlPreferencesSettings(user.apiKey, preferences)) throw new Error();
            setLastSaved(JSON.stringify(preferences));
            okToast("URL preferences saved");
        } catch { errorToast("Failed to save URL preferences"); }
        finally { setSaving(false); }
    };

    if (!preferences) return <div className="space-y-4 animate-pulse"><div className="h-24 rounded-2xl bg-white/[.035]" />{[0, 1, 2].map((item) => <div key={item} className="h-44 rounded-2xl bg-white/[.035]" />)}</div>;

    return <div className="animate-fade-in space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-white/[.08] bg-black/10 p-3.5 sm:px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[.04] text-lg text-zinc-300"><PiPathBold /></span>
            <div><h2 className="text-sm font-semibold text-white">Returned URL format</h2><p className="mt-0.5 max-w-2xl text-xs leading-5 text-zinc-500">Choose which link Space returns after each action. This does not change resource visibility.</p></div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[.08] bg-black/10">
            {RESOURCES.map((resource, index) => <section key={resource.key} className={`grid gap-3 p-3 sm:grid-cols-[minmax(150px,.7fr)_minmax(360px,1.3fr)] sm:items-center sm:px-3.5 ${index > 0 ? "border-t border-white/[.07]" : ""}`}>
                <div className="flex min-w-0 items-center gap-2.5"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-base ${resource.accent}`}>{resource.icon}</span><div className="min-w-0"><h3 className="text-sm font-semibold text-zinc-100">{resource.title}</h3><p className="truncate text-[11px] text-zinc-500">{resource.description}</p></div></div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {CHOICES.map((choice) => {
                        const selected = preferences[resource.key] === choice.value;
                        return <HoverDiv type="INFO" key={choice.label} title={`${choice.description} Example: ${choice.sample}`} aria-pressed={selected} onClick={() => update(resource.key, choice.value)} className={`h-9 rounded-lg px-2 text-xs font-semibold ${selected ? "bg-sky-500/[.08] text-sky-200" : "text-zinc-400"}`}>
                            <span className={`text-[10px] ${selected ? "opacity-100" : "opacity-0"}`}><PiCheckBold /></span>{choice.label}
                        </HoverDiv>;
                    })}
                </div>
            </section>)}
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-white/[.08] bg-black/10 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3"><p className={`text-xs ${dirty ? "text-amber-300" : "text-zinc-500"}`}>{dirty ? "Unsaved changes" : "Up to date"}</p><HoverDiv type="SAVE" icon={<PiCheckBold/>} onClick={save} disabled={!dirty || saving} className="min-h-9 rounded-lg px-4 text-xs font-semibold">{saving ? "Saving…" : "Save changes"}</HoverDiv></div>
    </div>;
}
