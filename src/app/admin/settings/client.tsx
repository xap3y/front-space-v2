"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {FaBolt, FaPlus} from "react-icons/fa6";
import {MdSettings} from "react-icons/md";
import HoverDiv, {DeleteButton, SaveButton} from "@/components/HoverDiv";
import MainStringInput from "@/components/MainStringInput";
import {errorToast, okToast} from "@/lib/client";
import {getApiUrl} from "@/lib/core";
import {useUser} from "@/hooks/useUser";

type BooleanSettingKey = "autoAvifConvert" | "imageUploadingEnabled" | "localStorageUploadsEnabled" |
    "r2StorageUploadsEnabled" | "pasteCreatingEnabled" | "tempMailEnabled" | "filePackEnabled" |
    "urlShortenerEnabled" | "nonAdminLoginEnabled";

type SettingPreset = Record<BooleanSettingKey, boolean> & {
    id: number;
    presetName: string;
    active: boolean;
};

const settingRows: Array<{key: BooleanSettingKey; title: string; description: string; child?: boolean}> = [
    {key: "autoAvifConvert", title: "Automatically convert images to AVIF", description: "Return the original immediately, then replace supported static images in the background."},
    {key: "imageUploadingEnabled", title: "Enable image uploading", description: "Master switch for all new image uploads."},
    {key: "localStorageUploadsEnabled", title: "Enable local storage uploads", description: "Allow images to be stored on the server filesystem.", child: true},
    {key: "r2StorageUploadsEnabled", title: "Enable R2 storage uploads", description: "Allow images to be stored in R2-compatible cloud storage.", child: true},
    {key: "pasteCreatingEnabled", title: "Enable paste creation", description: "Allow users to create text and file pastes."},
    {key: "tempMailEnabled", title: "Enable temporary mail", description: "Allow public and authenticated temporary mailbox creation."},
    {key: "filePackEnabled", title: "Enable file packs", description: "Allow new packs and files appended to existing packs."},
    {key: "urlShortenerEnabled", title: "Enable URL shortener", description: "Allow users to create shortened URLs."},
    {key: "nonAdminLoginEnabled", title: "Enable login for non-admin accounts", description: "When disabled, only ADMIN and OWNER accounts can create login sessions."},
];

function SettingSwitch({enabled, disabled, onChange}: {enabled: boolean; disabled?: boolean; onChange: (value: boolean) => void}) {
    return (
        <HoverDiv
            type="INFO"
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? "Disable setting" : "Enable setting"}
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full border p-0 ${enabled ? "border-emerald-400/50 bg-emerald-400/20" : "border-white/10 bg-white/[.05]"}`}
        >
            <span className={`absolute top-1 h-5 w-5 rounded-full transition-all ${enabled ? "left-6 bg-emerald-300" : "left-1 bg-gray-500"}`}/>
        </HoverDiv>
    );
}

export default function SettingsClient() {
    const {user} = useUser();
    const [presets, setPresets] = useState<SettingPreset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draft, setDraft] = useState<SettingPreset | null>(null);
    const [newPresetName, setNewPresetName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const selected = useMemo(
        () => presets.find(preset => preset.id === selectedId) ?? presets[0] ?? null,
        [presets, selectedId]
    );

    const request = useCallback(async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
        if (!user?.apiKey) throw new Error("Missing administrator API key");
        const response = await fetch(getApiUrl() + path, {
            method,
            headers: {"X-API-Key": user.apiKey, "Content-Type": "application/json", Accept: "application/json"},
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.error) throw new Error(String(payload?.message ?? `Request failed (${response.status})`));
        return payload.message as T;
    }, [user?.apiKey]);

    const loadPresets = useCallback(async () => {
        if (!user?.apiKey) return;
        setLoading(true);
        try {
            const result = await request<SettingPreset[]>("/v1/admin/settings");
            setPresets(result);
            setSelectedId(current => current ?? result.find(preset => preset.active)?.id ?? result[0]?.id ?? null);
            setError("");
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : "Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, [request, user?.apiKey]);

    useEffect(() => {
        void loadPresets();
    }, [loadPresets]);

    useEffect(() => {
        setDraft(selected ? {...selected} : null);
    }, [selected]);

    const savePreset = async () => {
        if (!draft) return;
        try {
            setSaving(true);
            const updated = await request<SettingPreset>(`/v1/admin/settings/${draft.id}`, "PUT", draft);
            setPresets(current => current.map(preset => preset.id === updated.id ? updated : preset));
            setDraft({...updated});
            okToast("Preset saved", 1800);
        } catch (exception) {
            errorToast(exception instanceof Error ? exception.message : "Failed to save preset", 3500);
        } finally {
            setSaving(false);
        }
    };

    const activatePreset = async () => {
        if (!selected) return;
        try {
            setSaving(true);
            const updated = await request<SettingPreset>(`/v1/admin/settings/${selected.id}`, "PUT", {active: true});
            setPresets(current => current.map(preset => preset.id === updated.id ? updated : {...preset, active: false}));
            okToast("Active preset changed", 1800);
        } catch (exception) {
            errorToast(exception instanceof Error ? exception.message : "Failed to activate preset", 3500);
        } finally {
            setSaving(false);
        }
    };

    const createPreset = async () => {
        if (!newPresetName.trim()) {
            errorToast("Enter a preset name", 2500);
            return;
        }
        try {
            setSaving(true);
            const created = await request<SettingPreset>("/v1/admin/settings", "POST", {presetName: newPresetName, active: false});
            setPresets(current => [...current, created].sort((a, b) => a.presetName.localeCompare(b.presetName)));
            setSelectedId(created.id);
            setNewPresetName("");
            okToast("Preset created", 1800);
        } catch (exception) {
            errorToast(exception instanceof Error ? exception.message : "Failed to create preset", 3500);
        } finally {
            setSaving(false);
        }
    };

    const deletePreset = async () => {
        if (!selected) return;
        try {
            setSaving(true);
            await request<string>(`/v1/admin/settings/${selected.id}`, "DELETE");
            setSelectedId(null);
            await loadPresets();
            okToast("Preset deleted", 1800);
        } catch (exception) {
            errorToast(exception instanceof Error ? exception.message : "Failed to delete preset", 3500);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="mx-auto w-full max-w-5xl space-y-4">
            <header className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/[.08] text-sky-300"><MdSettings className="h-5 w-5"/></span>
                <div><h1 className="text-xl font-semibold md:text-2xl">Global settings</h1><p className="text-xs text-gray-500 sm:text-sm">Manage reusable server presets and choose which one is active.</p></div>
            </header>
            {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/[.07] px-4 py-3 text-sm text-red-300">{error}</div> : null}

            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="box-primary p-3 md:p-4">
                    <div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold">Presets</h2><p className="text-[11px] text-gray-500">The active preset controls the server.</p></div><span className="rounded-md bg-white/[.05] px-2 py-1 text-[10px] text-gray-400">{presets.length}</span></div>
                    <div className="space-y-1.5">
                        {presets.map(preset => <HoverDiv key={preset.id} type="INFO" onClick={() => setSelectedId(preset.id)} className={`flex w-full justify-between rounded-lg px-3 py-2.5 text-left ${selected?.id === preset.id ? "border-sky-400/30 bg-sky-400/[.08]" : ""}`}><span className="truncate text-sm font-medium">{preset.presetName}</span>{preset.active ? <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">Active</span> : null}</HoverDiv>)}
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.12em] text-gray-500">New preset</label>
                        <div className="flex gap-2"><MainStringInput value={newPresetName} onChange={setNewPresetName} placeholder="Preset name" maxLength={80} className="min-w-0 flex-1 rounded-lg border-white/10 bg-black/20" inputClassName="px-3 py-2 text-sm"/><HoverDiv type="SAVE" icon={<FaPlus/>} disabled={saving} onClick={createPreset} className="shrink-0 px-3" aria-label="Create preset"/></div>
                    </div>
                </aside>

                <div className="box-primary p-4 md:p-5">
                    {loading ? <div className="space-y-3 animate-pulse"><div className="h-7 w-40 rounded bg-white/[.06]"/>{[1, 2, 3, 4, 5].map(item => <div key={item} className="h-16 rounded-xl bg-white/[.04]"/>)}</div> : draft ? <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-gray-500">Selected preset</p><h2 className="mt-1 text-lg font-semibold">{draft.presetName}</h2></div>{!selected?.active ? <HoverDiv type="INFO" icon={<FaBolt/>} disabled={saving} onClick={activatePreset} className="px-3 py-2 text-xs font-semibold">Make active</HoverDiv> : null}</div>
                        <div className="mt-5 divide-y divide-white/[.07] overflow-hidden rounded-xl border border-white/10 bg-black/10">
                            {settingRows.map(row => {
                                const parentDisabled = Boolean(row.child && !draft.imageUploadingEnabled);
                                return <div key={row.key} className={`flex items-center justify-between gap-4 p-4 ${row.child ? "pl-7 md:pl-10" : ""}`}><div className={parentDisabled ? "opacity-45" : ""}><p className="text-sm font-semibold text-gray-100">{row.title}</p><p className="mt-1 text-xs leading-5 text-gray-500">{row.description}</p></div><SettingSwitch enabled={draft[row.key]} disabled={saving || parentDisabled} onChange={enabled => setDraft(current => current ? {...current, [row.key]: enabled} : current)}/></div>;
                            })}
                        </div>
                        <div className="mt-5 flex justify-between gap-3 border-t border-white/10 pt-4"><DeleteButton disabled={saving} onClick={deletePreset} className="px-3 py-2 text-xs font-semibold">Delete preset</DeleteButton><SaveButton disabled={saving} onClick={savePreset} className="px-4 py-2 text-xs font-semibold">Save preset</SaveButton></div>
                    </> : <p className="text-sm text-gray-500">No preset is available.</p>}
                </div>
            </div>
        </section>
    );
}
