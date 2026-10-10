"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaSpinner, FaTriangleExclamation } from "react-icons/fa6";
import { Button } from "@/components/ui";
import { conversionRequest, startVideoConversion, type VideoConversionState, type VideoKind } from "@/lib/videoConversion";

const changedEvent = "space-video-conversion-changed";

export default function VideoConversionControl({ kind, id, size, apiKey, onComplete, compact = false }: {
    compact?: boolean;
    kind: VideoKind;
    id: string;
    size: number;
    apiKey?: string;
    onComplete?: (version: string) => void;
}) {
    const [state, setState] = useState<VideoConversionState | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const completeRef = useRef(onComplete);
    const completedAt = useRef("");
    const requestGeneration = useRef(0);
    completeRef.current = onComplete;

    const refresh = useCallback(async () => {
        if (!apiKey || document.hidden) return;
        const generation = requestGeneration.current;
        try {
            const value = await conversionRequest<VideoConversionState>(`/${kind}/${encodeURIComponent(id)}`, apiKey);
            if (generation !== requestGeneration.current) return;
            setState(value);
            if ((value.status === "COMPLETED" || value.status === "FAILED") && completedAt.current !== value.updatedAt) {
                completedAt.current = value.updatedAt;
                window.dispatchEvent(new Event(changedEvent));
                if (value.status === "COMPLETED") completeRef.current?.(value.updatedAt);
            }
        } catch {
            // Do not turn every card into an error banner during an API outage.
        }
    }, [apiKey, kind, id]);

    useEffect(() => {
        setState(null);
        setError("");
        completedAt.current = "";
        void refresh();
        window.addEventListener(changedEvent, refresh);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            requestGeneration.current += 1;
            window.removeEventListener(changedEvent, refresh);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [refresh]);

    const active = state && ["PROBING", "QUEUED", "CONVERTING"].includes(state.status);
    useEffect(() => {
        if (state?.codec === "h264" || state?.status === "COMPLETED") return;
        if (!active && !(state && state.activeCount >= state.policy.maxConcurrent)) return;
        const timer = window.setInterval(refresh, active ? 3000 : 10000);
        return () => window.clearInterval(timer);
    }, [active, state?.codec, state?.status, state?.activeCount, state?.policy.maxConcurrent, refresh]);

    if (!apiKey || !state || state.codec === "h264" || state.status === "COMPLETED") return null;
    if (state.status === "PROBING") return null;

    const running = state.status === "QUEUED" || state.status === "CONVERTING";
    const reason = !state.policy.enabled ? "Video conversion is disabled."
        : size > state.policy.maxSizeMb * 1024 * 1024 ? `Above the ${state.policy.maxSizeMb} MB conversion limit.`
            : state.activeCount >= state.policy.maxConcurrent ? "Your conversion limit is reached. Wait for another video to finish." : "";

    async function convert() {
        if (!apiKey || busy) return;
        setBusy(true);
        setError("");
        try {
            setState(await startVideoConversion(kind, id, apiKey));
            window.dispatchEvent(new Event(changedEvent));
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : "Could not start conversion");
            void refresh();
        } finally {
            setBusy(false);
        }
    }

    if (compact) {
        const tooltip = running
            ? `${state.status === "QUEUED" ? "Waiting to convert" : "Converting to H.264"} · ${state.progress}%`
            : ["This video may not play on some devices.", reason || "Convert to H.264", error || state.error].filter(Boolean).join(" ");
        return (
            <span className="inline-flex shrink-0 items-center" onClick={(event) => event.stopPropagation()}>
                {running ? (
                    <span role="status" title={tooltip} aria-label={tooltip} className="text-blue-400">
                        <FaSpinner className="h-3 w-3 motion-safe:animate-spin" />
                    </span>
                ) : (
                    <span
                        role={reason ? undefined : "button"}
                        tabIndex={0}
                        title={tooltip}
                        aria-label={tooltip}
                        aria-disabled={busy || Boolean(reason)}
                        className="inline-flex cursor-help text-amber-500"
                        onClick={() => !reason && !busy && void convert()}
                        onKeyDown={(event) => {
                            if (!reason && !busy && (event.key === "Enter" || event.key === " ")) {
                                event.preventDefault();
                                void convert();
                            }
                        }}
                    >
                        <FaTriangleExclamation className="h-3 w-3" />
                    </span>
                )}
            </span>
        );
    }

    return (
        <div className="space-y-1.5 text-left" onClick={(event) => event.stopPropagation()}>
            {running ? (
                <div role="status" className="space-y-1 text-[10px] text-blue-400">
                    <span className="inline-flex items-center gap-1.5">
                        <FaSpinner aria-hidden="true" className="motion-safe:animate-spin" />
                        {state.status === "QUEUED" ? "Waiting to convert…" : `Converting to H.264 · ${state.progress}%`}
                    </span>
                    {state.status === "CONVERTING" && (
                        <progress aria-label="Video conversion progress" max={100} value={state.progress} className="block h-1 w-full accent-blue-500" />
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            tabIndex={0}
                            aria-label="Video compatibility warning"
                            title={["This video may not play on some devices. Convert to H.264 for better compatibility.", reason, error || state.error].filter(Boolean).join(" ")}
                            className="inline-flex cursor-help text-amber-500"
                        >
                            <FaTriangleExclamation aria-hidden="true" className="h-3 w-3" />
                        </span>
                        {state.policy.enabled && size <= state.policy.maxSizeMb * 1024 * 1024 && (
                            <Button size="small" disabled={busy || Boolean(reason)} onClick={convert}>
                                {busy ? "Starting…" : state.status === "FAILED" ? "Retry H.264 conversion" : "Convert to H.264"}
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
