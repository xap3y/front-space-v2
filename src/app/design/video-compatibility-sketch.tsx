"use client";

import { useState } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { Checkbox, Field, Panel, SegmentedControl, Toggle } from "@/components/ui";

type Scenario = "hevc" | "h264" | "large" | "unknown";

export default function VideoCompatibilitySketch() {
    const [enabled, setEnabled] = useState(true);
    const [limit, setLimit] = useState("500");
    const [scenario, setScenario] = useState<Scenario>("hevc");
    const [convert, setConvert] = useState(false);
    const size = scenario === "large" ? 1024 : 128;
    const compatible = scenario === "h264";
    const unknown = scenario === "unknown";
    const eligible = enabled && size <= Number(limit) && Number(limit) > 0;
    const warning = unknown
        ? "Kodek se nepodařilo určit. Video nemusí být kompatibilní s některými zařízeními. Server jej při nahrání znovu ověří."
        : "Video používá HEVC (H.265), ne H.264. Na některých zařízeních nemusí jít přehrát. Originál můžeš nahrát i bez konverze.";

    function changeScenario(value: Scenario) {
        setScenario(value);
        setConvert(false);
    }

    return (
        <section id="video-compatibility" className="scroll-mt-4">
            <Panel title="07 / Kompatibilita videa — návrh">
                <div className="space-y-4">
                    <p className="text-xs leading-5 text-zinc-500">
                        Pouze interaktivní ukázka. Nic se nenahrává, nekontroluje ani nekonvertuje.
                        Stejný blok bude u /a/image a u každého videa ve frontě file packu.
                    </p>
                    <SegmentedControl
                        label="Ukázkový soubor"
                        value={scenario}
                        onChange={changeScenario}
                        options={[
                            { value: "hevc", label: "HEVC · 128 MB" },
                            { value: "h264", label: "H.264" },
                            { value: "large", label: "HEVC · 1 GB" },
                            { value: "unknown", label: "Neznámý kodek" },
                        ]}
                    />
                    <div className="rounded-md border border-zinc-800 bg-[#0a0a0a] px-3 py-2.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                            <span className="truncate text-zinc-200">holiday-video.mp4</span>
                            {!compatible && (
                                <span className="group relative inline-flex shrink-0">
                                    <span
                                        tabIndex={0}
                                        aria-label={warning}
                                        className="inline-flex cursor-help text-amber-500 outline-offset-2"
                                    >
                                        <FaTriangleExclamation aria-hidden="true" className="h-3 w-3" />
                                    </span>
                                    <span role="tooltip" className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-60 max-w-[70vw] rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] leading-5 text-zinc-300 shadow-lg group-hover:block group-focus-within:block">
                                        {warning}
                                    </span>
                                </span>
                            )}
                            <span className="text-[10px] text-zinc-500">
                                {size === 1024 ? "1 GB" : "128 MB"} · {unknown ? "Kodek nezjištěn" : compatible ? "H.264 / AAC" : "HEVC / AAC"}
                            </span>
                        </div>
                        {compatible ? (
                            <p className="mt-1 text-[11px] text-zinc-500">H.264 — konverze není potřeba.</p>
                        ) : (
                            <div className="mt-2 space-y-1">
                                <p className="text-[11px] leading-5 text-amber-500/90">{warning}</p>
                                {eligible ? (
                                    <>
                                        <Checkbox label="Převést na kompatibilní H.264" checked={convert} onChange={setConvert} />
                                        <p className="text-[10px] leading-5 text-zinc-500">
                                            Volitelné, výchozí stav vypnuto. Vysoká vizuální kvalita, stejné rozlišení a FPS.
                                            AAC zvuk zůstane beze změny; jiný zvuk může vyžadovat převod na AAC.
                                            Převod může trvat a změnit velikost souboru.
                                        </p>
                                        <p role="status" className="text-[10px] text-zinc-400">
                                            {convert ? "Po nahrání: ověření → fronta → konverze → připraveno." : "Nahraje se původní soubor bez konverze."}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-[10px] leading-5 text-zinc-500">
                                        {!enabled
                                            ? "Konverze je správcem vypnutá. Nahraje se originál."
                                            : `Soubor přesahuje limit konverze ${limit || "0"} MB. Nahraje se originál.`}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 border-t border-zinc-800 pt-3">
                        <p className="text-[11px] text-zinc-400">Návrh položek v /admin/settings — změny platí jen v této ukázce</p>
                        <Toggle
                            label="Povolit volitelnou konverzi videí na H.264"
                            checked={enabled}
                            onChange={(value) => {
                                setEnabled(value);
                                setConvert(false);
                            }}
                        />
                        <div className="max-w-xs">
                            <Field
                                label="Maximální velikost zdrojového videa (MB)"
                                type="number"
                                min={1}
                                step={1}
                                value={limit}
                                onChange={(value) => {
                                    setLimit(value);
                                    setConvert(false);
                                }}
                                hint="Limit je na jeden soubor, ne na celý pack."
                            />
                        </div>
                    </div>
                </div>
            </Panel>
        </section>
    );
}
