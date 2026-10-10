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
        ? "The codec could not be identified. This video may not play on some devices. The server will verify it after upload."
        : "This video uses HEVC (H.265), not H.264, and may not play on some devices. You can upload the original without conversion.";

    function changeScenario(value: Scenario) {
        setScenario(value);
        setConvert(false);
    }

    return (
        <section id="video-compatibility" className="scroll-mt-4">
            <Panel title="07 / Video compatibility — preview">
                <div className="space-y-4">
                    <p className="text-xs leading-5 text-zinc-500">
                        Interactive preview only. Nothing is uploaded, inspected or converted.
                        The same controls appear in /a/image and beside each video in the file pack upload queue.
                    </p>
                    <SegmentedControl
                        label="Example file"
                        value={scenario}
                        onChange={changeScenario}
                        options={[
                            { value: "hevc", label: "HEVC · 128 MB" },
                            { value: "h264", label: "H.264" },
                            { value: "large", label: "HEVC · 1 GB" },
                            { value: "unknown", label: "Unknown codec" },
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
                                {size === 1024 ? "1 GB" : "128 MB"} · {unknown ? "Unknown codec" : compatible ? "H.264 / AAC" : "HEVC / AAC"}
                            </span>
                        </div>
                        {!compatible && (
                            <div className="mt-2 space-y-1">
                                <p className="text-[11px] leading-5 text-amber-500/90">{warning}</p>
                                {eligible ? (
                                    <>
                                        <Checkbox label="Convert to compatible H.264" checked={convert} onChange={setConvert} />
                                        <p className="text-[10px] leading-5 text-zinc-500">
                                            Optional, off by default. High visual quality, original resolution and frame rate.
                                            AAC audio is copied; other audio may need conversion to AAC.
                                            Conversion takes time and may change the file size.
                                        </p>
                                        <p role="status" className="text-[10px] text-zinc-400">
                                            {convert ? "After upload: verification → waiting → conversion → ready." : "The original file will be uploaded without conversion."}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-[10px] leading-5 text-zinc-500">
                                        {!enabled
                                            ? "Conversion is disabled by the administrator. The original will be uploaded."
                                            : `The file exceeds the conversion limit of ${limit || "0"} MB. The original will be uploaded.`}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 border-t border-zinc-800 pt-3">
                        <p className="text-[11px] text-zinc-400">Independent /admin/settings preview — these settings only affect this example</p>
                        <Toggle
                            label="Enable optional H.264 video conversion"
                            checked={enabled}
                            onChange={(value) => {
                                setEnabled(value);
                                setConvert(false);
                            }}
                        />
                        <div className="max-w-xs">
                            <Field
                                label="Maximum source video size (MB)"
                                type="number"
                                min={1}
                                step={1}
                                value={limit}
                                onChange={(value) => {
                                    setLimit(value);
                                    setConvert(false);
                                }}
                                hint="Limit applies to each file, not the entire pack."
                            />
                        </div>
                    </div>
                </div>
            </Panel>
        </section>
    );
}
