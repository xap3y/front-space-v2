"use client";

import { useEffect, useState } from "react";
import { FaTriangleExclamation, FaCircleQuestion } from "react-icons/fa6";
import { Checkbox } from "@/components/ui";
import { getVideoConversionPolicy, type VideoPolicy } from "@/lib/videoConversion";

export default function VideoUploadCompatibility({ file, checked, onChange, disabled = false, fileName }: {
    fileName?: string;
    file: File | null;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}) {
    const [codec, setCodec] = useState<string | null | undefined>(undefined);
    const [policy, setPolicy] = useState<VideoPolicy | null>(null);
    const mp4 = Boolean(file && /\.mp4$/i.test(file.name));

    useEffect(() => {
        setCodec(undefined);
        onChange(false);
        if (!file || !/\.mp4$/i.test(file.name)) return;
        let worker: Worker | undefined;
        try {
            worker = new Worker(new URL("../workers/mp4-codec.worker.ts", import.meta.url));
            worker.onmessage = (event: MessageEvent<string | null>) => {
                setCodec(event.data);
                worker?.terminate();
            };
            worker.onerror = () => {
                setCodec(null);
                worker?.terminate();
            };
            worker.postMessage(file);
        } catch {
            setCodec(null);
        }
        return () => worker?.terminate();
        // Reset the opt-in only when the selected File identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    useEffect(() => {
        if (!mp4) return;
        let active = true;
        getVideoConversionPolicy().then((value) => {
            if (active) setPolicy(value);
        }).catch(() => {
            if (active) setPolicy(null);
        });
        return () => { active = false; };
    }, [mp4]);

    const name = fileName ? (
        <span className="block min-w-0 truncate font-semibold" title={fileName}>
            {fileName}
        </span>
    ) : null;
    if (!mp4 || codec === "h264" || codec === undefined) return name;
    const eligible = Boolean(policy?.enabled && file && file.size <= policy.maxSizeMb * 1024 * 1024);
    const message = codec
        ? "This video is not encoded in H.264 and may not play on some devices."
        : "The video codec could not be identified. Playback may not work on some devices.";
    const reason = !policy
        ? "Conversion settings are unavailable. You can upload the original."
        : !policy.enabled
            ? "Conversion is disabled. You can upload the original."
            : `Above the ${policy.maxSizeMb} MB conversion limit. You can upload the original.`;
    const warning = eligible ? message : `${message} ${reason}`;

    return (
        <div className="space-y-1 text-left">
            <div className="flex min-w-0 items-center gap-2">
                {name}
                <span tabIndex={0} title={warning} aria-label={warning} className="shrink-0 cursor-help">
                    <FaTriangleExclamation aria-hidden="true" className="h-3 w-3 shrink-0 text-amber-500" />
                </span>
            </div>
            {eligible ? (
                <>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            label="Convert to compatible H.264 after upload"
                            checked={checked}
                            disabled={disabled}
                            onChange={onChange}
                        />
                        <span tabIndex={0} className="shrink-0 cursor-help text-zinc-500" aria-label="Conversion information" title="High visual quality, original resolution and frame rate. Compatible AAC audio is copied; other audio is converted to AAC. File size may change. If conversion fails, the original stays available.">
                            <FaCircleQuestion className="h-3 w-3" />
                        </span>
                    </div>
                </>
            ) : null}
        </div>
    );
}
