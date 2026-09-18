"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaArrowDown, FaArrowUp, FaPlus, FaTrashCan } from "react-icons/fa6";
import { Kit, KitItem } from "@/types/playcore";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv, { DeleteButton, SaveButton } from "@/components/HoverDiv";
import { errorToast, okToast } from "@/lib/client";
import { McText } from "@/components/pcv/McText";

const emptyItem = (): KitItem => ({ item: "STONE", amount: 1, displayName: "", customModelData: null });

function lines(value?: string[] | null) {
    return (value ?? []).join("\n");
}

function splitLines(value: string) {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function KitsEditor({ kits, apiBase, uid, onReload }: {
    kits: Kit[];
    apiBase: string;
    uid: string;
    onReload: () => void;
}) {
    const [selectedName, setSelectedName] = useState<string>("");
    const [draft, setDraft] = useState<Kit | null>(null);
    const [query, setQuery] = useState("");
    const [saving, setSaving] = useState(false);

    const visibleKits = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return kits.filter((kit) => !needle || kit.name.toLowerCase().includes(needle) || kit.displayName.toLowerCase().includes(needle));
    }, [kits, query]);

    useEffect(() => {
        if (!selectedName && kits.length) setSelectedName(kits[0].name);
    }, [kits, selectedName]);

    useEffect(() => {
        const selected = kits.find((kit) => kit.name === selectedName);
        setDraft(selected ? structuredClone(selected) : null);
    }, [kits, selectedName]);

    const setItem = (index: number, item: KitItem) => {
        if (!draft) return;
        const content = [...draft.content];
        content[index] = item;
        setDraft({ ...draft, content });
    };

    const moveItem = (index: number, direction: -1 | 1) => {
        if (!draft) return;
        const target = index + direction;
        if (target < 0 || target >= draft.content.length) return;
        const content = [...draft.content];
        [content[index], content[target]] = [content[target], content[index]];
        setDraft({ ...draft, content });
    };

    const save = async () => {
        if (!draft) return;
        if (!draft.name.trim() || !draft.displayName.trim()) return errorToast("Kit name and display name are required.");
        if (draft.content.some((item) => !item.item.trim() || item.amount < 1 || item.amount > 64)) {
            return errorToast("Every item needs a material and an amount from 1 to 64.");
        }
        setSaving(true);
        try {
            await axios.post(`${apiBase}/v1/pcv/data/${uid}/kit`, draft);
            setSelectedName(draft.name);
            okToast(`Saved kit ${draft.name}`);
        } catch (error: any) {
            errorToast(error?.response?.data?.message || "Could not save kit. Make sure the API supports KIT_MODIFY forwarding.");
        } finally {
            setSaving(false);
        }
    };

    const createKit = () => {
        const base = "new_kit";
        let name = base;
        let suffix = 2;
        while (kits.some((kit) => kit.name === name)) name = `${base}_${suffix++}`;
        setSelectedName("");
        setDraft({ name, displayName: "&fNew kit", icon: "CHEST", flags: { redeemTimes: 1, allowedServers: [], commands: [] }, content: [] });
    };

    const removeKit = async () => {
        if (!draft || !kits.some((kit) => kit.name === draft.name)) return setDraft(null);
        if (!window.confirm(`Delete kit ${draft.name}? Codes linked to it may also be affected.`)) return;
        try {
            const response = await fetch(`${apiBase}/v1/pcv/data/${uid}/kit/${encodeURIComponent(draft.name)}`, { method: "DELETE" });
            if (!response.ok) throw new Error();
            setSelectedName("");
            setDraft(null);
            okToast("Kit deleted.");
            onReload();
        } catch {
            errorToast("Could not delete kit.");
        }
    };

    return (
        <div className="grid min-h-[560px] grid-cols-1 gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div className="mb-2 flex gap-2">
                    <MainStringInput type="search" value={query} onChange={setQuery} placeholder="Search kits" className="min-w-0 flex-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                    <HoverDiv onClick={createKit} className="h-9 w-9 p-0" title="New kit" icon={<FaPlus />} />
                </div>
                <div className="max-h-[66vh] space-y-1 overflow-auto">
                    {visibleKits.map((kit) => (
                        <HoverDiv key={kit.name} onClick={() => setSelectedName(kit.name)} className={`w-full justify-start px-2 py-2 text-left ${selectedName === kit.name ? "border-indigo-500 bg-indigo-500/10" : ""}`}>
                            <div className="min-w-0">
                                <div className="truncate text-sm"><McText text={kit.displayName} /></div>
                                <div className="truncate text-[11px] text-zinc-500">{kit.name} · {kit.content.length} items</div>
                            </div>
                        </HoverDiv>
                    ))}
                    {!visibleKits.length && <div className="p-4 text-center text-xs text-zinc-500">No kits found</div>}
                </div>
            </aside>

            {!draft ? (
                <div className="grid place-items-center rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500">Select or create a kit</div>
            ) : (
                <section className="min-w-0 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <label className="text-xs text-zinc-400">Identifier
                            <MainStringInput value={draft.name} disabled={kits.some((kit) => kit.name === draft.name)} onChange={(name) => setDraft({ ...draft, name })} className="mt-1 border-zinc-700" inputClassName="px-2 py-2 text-sm" />
                        </label>
                        <label className="text-xs text-zinc-400">Display name
                            <MainStringInput value={draft.displayName} onChange={(displayName) => setDraft({ ...draft, displayName })} className="mt-1 border-zinc-700" inputClassName="px-2 py-2 text-sm" />
                        </label>
                        <label className="text-xs text-zinc-400">Icon material
                            <MainStringInput value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon: icon.toUpperCase() })} className="mt-1 border-zinc-700" inputClassName="px-2 py-2 text-sm uppercase" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <label className="text-xs text-zinc-400">Maximum redemptions
                            <MainStringInput type="number" min={0} value={draft.flags?.redeemTimes ?? ""} onChange={(value) => setDraft({ ...draft, flags: { ...draft.flags, redeemTimes: value === "" ? null : Number(value) } })} className="mt-1 border-zinc-700" inputClassName="px-2 py-2 text-sm" />
                        </label>
                        <label className="text-xs text-zinc-400">Allowed servers · one per line
                            <MainStringInput multiline rows={3} value={lines(draft.flags?.allowedServers)} onChange={(value) => setDraft({ ...draft, flags: { ...draft.flags, allowedServers: splitLines(value) } })} className="mt-1 border-zinc-700" inputClassName="px-2 py-2 text-sm" />
                        </label>
                        <label className="text-xs text-zinc-400">Commands · one per line
                            <MainStringInput multiline rows={3} value={lines(draft.flags?.commands)} onChange={(value) => setDraft({ ...draft, flags: { ...draft.flags, commands: splitLines(value) } })} className="mt-1 border-zinc-700" inputClassName="px-2 py-2 text-sm" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                        <div><div className="text-sm font-semibold">Kit contents</div><div className="text-xs text-zinc-500">Items are redeemed in this order.</div></div>
                        <HoverDiv onClick={() => setDraft({ ...draft, content: [...draft.content, emptyItem()] })} className="px-2 py-1.5 text-xs" icon={<FaPlus />}>Add item</HoverDiv>
                    </div>

                    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                        {draft.content.map((item, index) => (
                            <article key={index} className="rounded border border-zinc-800 bg-zinc-950 p-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-300">#{index + 1} · {item.item}</span>
                                    <div className="flex gap-1">
                                        <HoverDiv onClick={() => moveItem(index, -1)} disabled={index === 0} className="h-7 w-7 p-0" icon={<FaArrowUp />} />
                                        <HoverDiv onClick={() => moveItem(index, 1)} disabled={index === draft.content.length - 1} className="h-7 w-7 p-0" icon={<FaArrowDown />} />
                                        <DeleteButton onClick={() => setDraft({ ...draft, content: draft.content.filter((_, itemIndex) => itemIndex !== index) })} className="h-7 w-7 p-0" icon={<FaTrashCan />} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
                                    <label className="text-[11px] text-zinc-500">Material
                                        <MainStringInput value={item.item} onChange={(value) => setItem(index, { ...item, item: value.toUpperCase() })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs uppercase" />
                                    </label>
                                    <label className="text-[11px] text-zinc-500">Amount
                                        <MainStringInput type="number" min={1} max={64} value={item.amount} onChange={(value) => setItem(index, { ...item, amount: Number(value) })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                                    </label>
                                </div>
                                <label className="mt-2 block text-[11px] text-zinc-500">Display name
                                    <MainStringInput value={item.displayName ?? ""} onChange={(displayName) => setItem(index, { ...item, displayName })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                                </label>
                                <label className="mt-2 block text-[11px] text-zinc-500">Lore · one line per row
                                    <MainStringInput multiline rows={3} value={lines(item.lore)} onChange={(value) => setItem(index, { ...item, lore: splitLines(value) })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                                </label>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <label className="text-[11px] text-zinc-500">Custom model
                                        <MainStringInput type="number" min={0} value={item.customModelData ?? ""} onChange={(value) => setItem(index, { ...item, customModelData: value === "" ? null : Number(value) })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                                    </label>
                                    <label className="text-[11px] text-zinc-500">Potion type
                                        <MainStringInput value={item.potionType ?? ""} onChange={(potionType) => setItem(index, { ...item, potionType: potionType || null })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                                    </label>
                                    <label className="text-[11px] text-zinc-500">Skull owner
                                        <MainStringInput value={item.skullOwner ?? ""} onChange={(skullOwner) => setItem(index, { ...item, skullOwner: skullOwner || null })} className="mt-1 border-zinc-800" inputClassName="px-2 py-1.5 text-xs" />
                                    </label>
                                </div>
                            </article>
                        ))}
                        {!draft.content.length && <div className="rounded border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500 xl:col-span-2">This kit has no items yet.</div>}
                    </div>

                    <div className="sticky bottom-2 flex flex-wrap justify-end gap-2 rounded border border-zinc-800 bg-zinc-950/95 p-2 backdrop-blur">
                        <DeleteButton onClick={removeKit} disabled={saving} className="px-3 py-1.5 text-xs">Delete kit</DeleteButton>
                        <SaveButton onClick={save} disabled={saving} className="px-3 py-1.5 text-xs">{saving ? "Saving…" : "Save kit"}</SaveButton>
                    </div>
                </section>
            )}
        </div>
    );
}
