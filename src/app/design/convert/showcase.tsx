"use client";

import { useEffect, useState } from "react";
import { FaFilm, FaSpinner, FaTriangleExclamation } from "react-icons/fa6";
import VideoCompatibilitySketch from "../video-compatibility-sketch";
import { Badge, Button, Checkbox, Field, Panel, SegmentedControl, Toggle } from "@/components/ui";

type MockVideo = {
    id: string;
    name: string;
    size: number;
    codec: "HEVC" | "H.264";
    storage: "S3" | "Local";
    location: "gallery" | "pack";
};

type DemoState = {
    enabled: boolean;
    maxSize: string;
    maxConcurrent: string;
    running: string[];
    completed: string[];
    uploads: MockVideo[];
};

const storageKey = "space-design-convert-mock-v1";
const initialState: DemoState = {
    enabled: true,
    maxSize: "500",
    maxConcurrent: "1",
    running: [],
    completed: [],
    uploads: [],
};

const videos: MockVideo[] = [
    { id: "gallery-1", name: "holiday.mp4", size: 128, codec: "HEVC", storage: "S3", location: "gallery" },
    { id: "gallery-2", name: "gameplay.mp4", size: 240, codec: "HEVC", storage: "Local", location: "gallery" },
    { id: "gallery-3", name: "intro.mp4", size: 32, codec: "H.264", storage: "S3", location: "gallery" },
    { id: "gallery-4", name: "long-recording.mp4", size: 1024, codec: "HEVC", storage: "Local", location: "gallery" },
    { id: "pack-1", name: "clip-01.mp4", size: 86, codec: "HEVC", storage: "S3", location: "pack" },
    { id: "pack-2", name: "clip-02.mp4", size: 154, codec: "HEVC", storage: "Local", location: "pack" },
];

function positiveInteger(value: string) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
}

export default function ConvertShowcase() {
    const [demo, setDemo] = useState(initialState);
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState("");
    const [destination, setDestination] = useState<"gallery" | "pack">("gallery");
    const [uploadScenario, setUploadScenario] = useState<"hevc" | "h264" | "large">("hevc");
    const [convertUpload, setConvertUpload] = useState(false);
    const [mockName, setMockName] = useState("new-video.mp4");

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const value = JSON.parse(stored) as DemoState;
                if (
                    typeof value.enabled === "boolean" &&
                    typeof value.maxSize === "string" &&
                    typeof value.maxConcurrent === "string" &&
                    Array.isArray(value.running) && value.running.every((id) => typeof id === "string") &&
                    Array.isArray(value.completed) && value.completed.every((id) => typeof id === "string") &&
                    Array.isArray(value.uploads) && value.uploads.every((item) =>
                        typeof item?.id === "string" && typeof item.name === "string" &&
                        typeof item.size === "number" && ["HEVC", "H.264"].includes(item.codec) &&
                        ["S3", "Local"].includes(item.storage) && ["gallery", "pack"].includes(item.location)
                    )
                ) {
                    setDemo(value);
                }
            }
        } catch {
            setNotice("Lokální ukázku nešlo obnovit. Používám výchozí stav.");
        }
        setReady(true);
    }, []);

    useEffect(() => {
        if (!ready) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(demo));
        } catch {
            setNotice("Prohlížeč nepovolil uložení ukázky. Stav po obnovení nezůstane.");
        }
    }, [demo, ready]);

    const allVideos = [...videos, ...demo.uploads];
    const limit = positiveInteger(demo.maxSize);
    const concurrency = positiveInteger(demo.maxConcurrent);
    const full = demo.running.length >= concurrency;
    const uploadSize = uploadScenario === "large" ? 1024 : 128;
    const uploadEligible = demo.enabled && uploadScenario !== "h264" && uploadSize <= limit;

    function start(video: MockVideo) {
        setDemo((current) => {
            if (
                !current.enabled || video.size > positiveInteger(current.maxSize) ||
                current.running.length >= positiveInteger(current.maxConcurrent) ||
                current.running.includes(video.id) || current.completed.includes(video.id) || video.codec === "H.264"
            ) return current;
            return {
                ...current,
                running: [...current.running, video.id],
            };
        });
    }

    function simulateUpload() {
        if (!mockName.trim() || (uploadEligible && convertUpload && full)) return;
        const video: MockVideo = {
            id: `mock-${crypto.randomUUID()}`,
            name: mockName.trim(),
            size: uploadSize,
            codec: uploadScenario === "h264" ? "H.264" : "HEVC",
            storage: "S3",
            location: destination,
        };
        setDemo((current) => ({
            ...current,
            uploads: [...current.uploads, video],
            running: uploadEligible && convertUpload ? [...current.running, video.id] : current.running,
        }));
        setNotice(`Pouze simulace: ${video.name} přidáno do ${destination === "gallery" ? "galerie" : "packu"}.`);
        setConvertUpload(false);
    }

    function warning() {
        return (
            <span tabIndex={0} className="group relative inline-flex cursor-help text-amber-500" aria-label="Video není H.264 a nemusí se přehrát na všech zařízeních.">
                <FaTriangleExclamation aria-hidden="true" className="h-3 w-3" />
                <span role="tooltip" className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-52 max-w-[60vw] rounded border border-zinc-700 bg-zinc-950 p-2 text-[11px] leading-5 text-zinc-300 group-hover:block group-focus-within:block">
                    Video není H.264 a nemusí se přehrát na všech zařízeních. Převod je volitelný.
                </span>
            </span>
        );
    }

    function conversionControls(video: MockVideo) {
        const running = demo.running.includes(video.id);
        const completed = demo.completed.includes(video.id);
        if (running) {
            return (
                <div role="status" className="space-y-1 text-[11px] text-blue-400">
                    <span className="inline-flex items-center gap-2"><FaSpinner aria-hidden="true" className="motion-safe:animate-spin" /> Konvertuje se na H.264</span>
                    <p className="text-[10px] text-zinc-500">Stav zůstane i po obnovení stránky.</p>
                </div>
            );
        }
        if (completed || video.codec === "H.264") {
            return <span className="text-[11px] text-emerald-400">{completed ? "Převedeno · H.264 / AAC" : "H.264 · konverze není potřeba"}</span>;
        }
        const reason = !demo.enabled
            ? "Konverze je správcem vypnutá."
            : video.size > limit
                ? `Nad limitem konverze ${demo.maxSize || "0"} MB.`
                : !concurrency
                    ? "Nastav platný limit souběžných konverzí."
                    : full
                        ? `Probíhá ${demo.running.length}/${concurrency} konverzí. Počkej na dokončení.`
                        : "";
        return (
            <div className="space-y-1.5">
                <Button size="small" disabled={!ready || Boolean(reason)} onClick={() => start(video)}>Převést na H.264</Button>
                {reason && <p className="text-[10px] leading-4 text-zinc-500">{reason}</p>}
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 text-zinc-200 sm:px-6">
            <header className="space-y-2">
                <a href="/design" className="text-xs text-zinc-500 hover:text-white">← Design katalog</a>
                <h1 className="text-xl">Konverze videí <span className="text-xs text-amber-500">MOCK</span></h1>
                <p className="text-xs leading-6 text-zinc-400">Žádná skutečná média, uploady ani API. Simulace sdílí limit pro galerii, packy a uploady. Stav se ukládá jen v tomto prohlížeči.</p>
                <nav className="flex flex-wrap gap-4 text-xs text-zinc-400" aria-label="Ukázky konverze">
                    <a href="#mock-settings">Nastavení</a>
                    <a href="#mock-upload">Upload</a>
                    <a href="#mock-gallery">Galerie</a>
                    <a href="#mock-pack">File pack</a>
                    <a href="#video-compatibility">Původní návrh 07</a>
                </nav>
            </header>

            <section id="mock-settings">
                <Panel title="MOCK /admin/settings">
                    <div className="space-y-4">
                        <Toggle
                            label="Povolit konverzi videí na H.264"
                            checked={demo.enabled}
                            onChange={(enabled) => setDemo((current) => ({ ...current, enabled }))}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                                label="Maximální velikost videa (MB)"
                                type="number"
                                min={1}
                                step={1}
                                value={demo.maxSize}
                                onChange={(maxSize) => setDemo((current) => ({ ...current, maxSize }))}
                            />
                            <Field
                                label="Souběžné konverze na uživatele"
                                type="number"
                                min={1}
                                step={1}
                                value={demo.maxConcurrent}
                                onChange={(maxConcurrent) => setDemo((current) => ({ ...current, maxConcurrent }))}
                                hint="Výchozí 1. Společně pro všechny uploady, galerii a packy."
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>Aktivní {demo.running.length} / {concurrency}</Badge>
                            <Button size="small" disabled={!ready || !demo.running.length} onClick={() => setDemo((current) => ({ ...current, completed: [...current.completed, ...current.running], running: [] }))}>Simulovat dokončení</Button>
                            <Button size="small" disabled={!ready} onClick={() => {
                                setDemo(initialState);
                                setConvertUpload(false);
                                setNotice("Mock data resetována. Žádná skutečná data se nemění.");
                            }}>Reset mock dat</Button>
                        </div>
                        <p className="text-[10px] leading-5 text-zinc-500">Konverze v ukázce zůstává běžet, dokud nestiskneš „Simulovat dokončení“. Zkus spustit video a obnovit stránku. Vypnutí funkce blokuje nové úlohy, již běžící pokračují.</p>
                        <p role="status" className="text-xs text-zinc-400">{ready ? notice : "Obnovuji stav ukázky…"}</p>
                    </div>
                </Panel>
            </section>

            <section id="mock-upload">
                <Panel title="MOCK /a/image a upload do file packu">
                    <div className="space-y-3">
                        <SegmentedControl
                            label="Cíl uploadu"
                            value={destination}
                            onChange={setDestination}
                            options={[
                                { value: "gallery", label: "Galerie /a/image" },
                                { value: "pack", label: "File pack" },
                            ]}
                        />
                        <div className="rounded-md border border-dashed border-zinc-700 p-5 text-center text-xs text-zinc-500">Sem budeš přetahovat videa. V mocku vyber předpřipravený soubor níže — žádný přístup k tvým souborům.</div>
                        <Field label="Ukázkový název souboru" value={mockName} onChange={setMockName} />
                        <SegmentedControl
                            label="Mock kodek a velikost"
                            value={uploadScenario}
                            onChange={(value) => {
                                setUploadScenario(value);
                                setConvertUpload(false);
                            }}
                            options={[
                                { value: "hevc", label: "HEVC · 128 MB" },
                                { value: "h264", label: "H.264 · 128 MB" },
                                { value: "large", label: "HEVC · 1 GB" },
                            ]}
                        />
                        {uploadScenario !== "h264" && (
                            <div className="space-y-2">
                                <p className="flex items-center gap-2 text-[11px] text-amber-500">{warning()} Video nemusí být kompatibilní s některými zařízeními.</p>
                                {uploadEligible ? (
                                    <Checkbox label="Po nahrání převést na H.264" checked={convertUpload} onChange={setConvertUpload} />
                                ) : (
                                    <p className="text-[10px] text-zinc-500">{!demo.enabled ? "Konverze je vypnutá." : `Soubor přesahuje limit ${demo.maxSize || "0"} MB.`} Lze nahrát originál.</p>
                                )}
                            </div>
                        )}
                        {uploadEligible && convertUpload && full && <p className="text-[11px] text-amber-500">Limit konverzí je obsazený. Počkej nebo zruš volbu konverze a nahraj originál.</p>}
                        <p className="text-[10px] text-zinc-500">Vysoká vizuální kvalita, stejné rozlišení a FPS. Kompatibilní AAC zvuk se kopíruje. Výsledná velikost se může změnit.</p>
                        <Button variant="primary" disabled={!ready || !mockName.trim() || (uploadEligible && convertUpload && full)} onClick={simulateUpload}>Simulovat nahrání</Button>
                    </div>
                </Panel>
            </section>

            <section id="mock-gallery">
                <Panel title="MOCK /home/gallery — již nahraná videa">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {allVideos.filter((video) => video.location === "gallery").map((video, index) => (
                            <article key={video.id} className="min-w-0 rounded-md border border-zinc-800 bg-[#0a0a0a]">
                                <div className={`flex aspect-video items-center justify-center rounded-t-md border-b border-zinc-800 ${index % 2 ? "bg-gradient-to-br from-zinc-800 to-slate-950" : "bg-gradient-to-br from-slate-800 to-zinc-950"}`}>
                                    <FaFilm aria-hidden="true" className="h-7 w-7 text-zinc-600" />
                                    <span className="ml-2 text-[10px] text-zinc-500">MOCK PREVIEW</span>
                                </div>
                                <div className="space-y-2 p-3">
                                    <div className="flex items-center gap-2 text-xs"><span className="min-w-0 truncate">{video.name}</span>{video.codec !== "H.264" && !demo.completed.includes(video.id) && warning()}</div>
                                    <p className="text-[10px] text-zinc-500">{video.size} MB · {demo.completed.includes(video.id) ? "H.264" : video.codec} · {video.storage}</p>
                                    {conversionControls(video)}
                                </div>
                            </article>
                        ))}
                    </div>
                </Panel>
            </section>

            <section id="mock-pack">
                <Panel title="MOCK /home/files — nahraná videa v packu">
                    <div className="rounded-md border border-zinc-800 bg-[#0a0a0a]">
                        <div className="border-b border-zinc-800 px-3 py-2">
                            <p className="text-xs">Holiday pack <span className="text-zinc-500">· {allVideos.filter((video) => video.location === "pack").length} soubory</span></p>
                            <p className="mt-1 text-[10px] text-zinc-600">Ukázkový pack · rozbaleno</p>
                        </div>
                        {allVideos.filter((video) => video.location === "pack").map((video) => (
                            <div key={video.id} className="flex flex-col gap-3 border-b border-zinc-800/60 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-xs"><FaFilm aria-hidden="true" className="shrink-0 text-zinc-500" /><span className="truncate">{video.name}</span>{video.codec !== "H.264" && !demo.completed.includes(video.id) && warning()}</div>
                                    <p className="mt-1 text-[10px] text-zinc-500">{video.size} MB · {demo.completed.includes(video.id) ? "H.264" : video.codec} · {video.storage}</p>
                                </div>
                                <div className="shrink-0 sm:max-w-64">{conversionControls(video)}</div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </section>

            <VideoCompatibilitySketch />
        </main>
    );
}
