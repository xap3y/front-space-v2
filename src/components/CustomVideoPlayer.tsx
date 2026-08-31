"use client";

import {ChangeEvent, CSSProperties, useEffect, useRef, useState} from "react";
import {FaCheck, FaClosedCaptioning, FaExpand, FaGaugeHigh, FaGear, FaPause, FaPlay, FaVolumeHigh, FaVolumeXmark} from "react-icons/fa6";

interface CustomVideoPlayerProps { src: string; className?: string; }
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
type TimelineColor = "RED" | "DARK" | "WHITE";
const TIMELINE_COLORS: Record<TimelineColor, string> = {RED: "#dc2626", DARK: "#18181b", WHITE: "#f4f4f5"};

function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = Math.floor(seconds % 60);
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}` : `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function srtToVtt(value: string) {
    const converted = value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/(\d{2}:\d{2}:\d{2}),([0-9]{3})/g, "$1.$2");
    return `WEBVTT\n\n${converted.replace(/^(\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}).*$/gm, "$1 line:78%")}`;
}

export default function CustomVideoPlayer({src, className = ""}: CustomVideoPlayerProps) {
    const playerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const subtitleInputRef = useRef<HTMLInputElement>(null);
    const speedMenuRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resumeAfterSeekRef = useRef(false);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedRanges, setBufferedRanges] = useState<Array<{left: number; width: number}>>([]);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [volumeFeedbackVisible, setVolumeFeedbackVisible] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [subtitleBackground, setSubtitleBackground] = useState(false);
    const [hotkeysEnabled, setHotkeysEnabled] = useState(true);
    const [timelineColor, setTimelineColor] = useState<TimelineColor>("RED");
    const [controlsVisible, setControlsVisible] = useState(true);
    const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
    const [subtitleName, setSubtitleName] = useState<string | null>(null);
    const [subtitlesVisible, setSubtitlesVisible] = useState(true);
    const [subtitleError, setSubtitleError] = useState<string | null>(null);

    useEffect(() => () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
    }, [subtitleUrl]);

    useEffect(() => {
        const track = videoRef.current?.textTracks[0];
        if (track) track.mode = subtitlesVisible ? "showing" : "hidden";
    }, [subtitleUrl, subtitlesVisible]);

    useEffect(() => {
        if (!speedMenuOpen && !settingsMenuOpen) return;
        const closeOpenMenus = (event: PointerEvent) => {
            const target = event.target as Node;
            if (speedMenuOpen && !speedMenuRef.current?.contains(target)) setSpeedMenuOpen(false);
            if (settingsMenuOpen && !settingsMenuRef.current?.contains(target)) setSettingsMenuOpen(false);
        };
        document.addEventListener("pointerdown", closeOpenMenus);
        return () => document.removeEventListener("pointerdown", closeOpenMenus);
    }, [settingsMenuOpen, speedMenuOpen]);

    const showControls = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (playing && !speedMenuOpen && !settingsMenuOpen) controlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), 2200);
    };

    const syncDuration = (video: HTMLVideoElement) => {
        const candidates = [video.duration];
        if (video.seekable.length > 0) candidates.push(video.seekable.end(video.seekable.length - 1));
        if (video.buffered.length > 0) candidates.push(video.buffered.end(video.buffered.length - 1));
        const knownDuration = Math.max(0, ...candidates.filter(value => Number.isFinite(value) && value > 0));
        if (knownDuration > 0) setDuration(previous => Math.max(previous, knownDuration));
        return knownDuration;
    };

    const updateBuffered = () => {
        const video = videoRef.current;
        if (!video) return;
        const knownDuration = syncDuration(video);
        if (!knownDuration || video.buffered.length === 0) return setBufferedRanges([]);
        const ranges = Array.from({length: video.buffered.length}, (_, index) => {
            const start = Math.min(knownDuration, video.buffered.start(index));
            const end = Math.min(knownDuration, video.buffered.end(index));
            return {left: (start / knownDuration) * 100, width: Math.max(0, ((end - start) / knownDuration) * 100)};
        });
        setBufferedRanges(ranges);
    };

    const togglePlayback = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => setPlaying(false));
        } else {
            video.pause();
        }
        showControls();
    };

    const showVolumeFeedback = () => {
        setVolumeFeedbackVisible(true);
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => setVolumeFeedbackVisible(false), 1400);
    };

    const startTimelineSeek = () => {
        const video = videoRef.current;
        if (!video) return;
        resumeAfterSeekRef.current = !video.paused;
        if (resumeAfterSeekRef.current) video.pause();
    };

    const finishTimelineSeek = () => {
        const video = videoRef.current;
        if (!video) return;
        if (resumeAfterSeekRef.current) video.play().catch(() => setPlaying(false));
        resumeAfterSeekRef.current = false;
        showControls();
    };

    const changeVolume = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Number(event.target.value);
        setVolume(next); setMuted(next === 0);
        if (videoRef.current) { videoRef.current.volume = next; videoRef.current.muted = next === 0; }
        showVolumeFeedback();
    };

    const toggleMuted = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
        showVolumeFeedback();
    };

    const loadSubtitle = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".srt")) return setSubtitleError("Choose a valid .srt subtitle file.");
        const nextUrl = URL.createObjectURL(new Blob([srtToVtt(await file.text())], {type: "text/vtt"}));
        setSubtitleUrl(previous => { if (previous) URL.revokeObjectURL(previous); return nextUrl; });
        setSubtitleName(file.name); setSubtitleError(null); setSubtitlesVisible(true);
    };

    const toggleFullscreen = async () => {
        const webkitDocument = document as Document & {webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> | void};
        const mobileVideo = videoRef.current as (HTMLVideoElement & {webkitEnterFullscreen?: () => void}) | null;
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (webkitDocument.webkitFullscreenElement) await webkitDocument.webkitExitFullscreen?.();
        else if (playerRef.current?.requestFullscreen) {
            try {
                await playerRef.current.requestFullscreen();
            } catch {
                mobileVideo?.webkitEnterFullscreen?.();
            }
        } else mobileVideo?.webkitEnterFullscreen?.();
    };

    useEffect(() => {
        const handleKeyboard = (event: globalThis.KeyboardEvent) => {
            if (!hotkeysEnabled) return;
            const target = event.target as HTMLElement | null;
            const isEditable = target?.isContentEditable || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || (target?.tagName === "INPUT" && (target as HTMLInputElement).type !== "range");
            if (isEditable) return;

            const video = videoRef.current;
            if (!video) return;
            const key = event.key.toLowerCase();

            if (event.code === "Space") {
                event.preventDefault();
                if (!event.repeat) togglePlayback();
            } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const change = event.key === "ArrowLeft" ? -5 : 5;
                const maximum = duration > 0 ? duration : (Number.isFinite(video.duration) ? video.duration : Number.MAX_SAFE_INTEGER);
                video.currentTime = Math.max(0, Math.min(maximum, video.currentTime + change));
                setCurrentTime(video.currentTime);
                showControls();
            } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                const change = event.key === "ArrowUp" ? 0.05 : -0.05;
                const nextVolume = Math.max(0, Math.min(1, video.volume + change));
                video.volume = nextVolume;
                video.muted = nextVolume === 0;
                setVolume(nextVolume);
                setMuted(nextVolume === 0);
                showVolumeFeedback();
                showControls();
            } else if (key === "m" && !event.repeat) {
                event.preventDefault();
                toggleMuted();
                showControls();
            } else if (key === "f" && !event.repeat) {
                event.preventDefault();
                void toggleFullscreen();
                showControls();
            }
        };

        window.addEventListener("keydown", handleKeyboard);
        return () => window.removeEventListener("keydown", handleKeyboard);
    });

    const playedPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div ref={playerRef} tabIndex={0} aria-label="Video player" style={{"--player-accent": TIMELINE_COLORS[timelineColor]} as CSSProperties} className={`group relative aspect-video w-full rounded-lg bg-black shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-red-600 fullscreen:h-screen fullscreen:aspect-auto fullscreen:rounded-none ${speedMenuOpen || settingsMenuOpen ? "overflow-visible sm:overflow-hidden" : "overflow-hidden"} ${className}`} onMouseMove={showControls} onMouseLeave={() => playing && !speedMenuOpen && !settingsMenuOpen && setControlsVisible(false)}>
            <video ref={videoRef} src={src} className={`h-full w-full bg-black object-contain ${subtitleBackground ? "subtitles-with-background" : "subtitles-no-background"}`} preload="metadata" playsInline onClick={() => { playerRef.current?.focus({preventScroll: true}); togglePlayback(); }}
                onLoadedMetadata={event => { syncDuration(event.currentTarget); updateBuffered(); }} onDurationChange={updateBuffered} onCanPlay={updateBuffered} onProgress={updateBuffered}
                onTimeUpdate={event => { setCurrentTime(event.currentTarget.currentTime); syncDuration(event.currentTarget); }} onPlay={() => { setPlaying(true); showControls(); }} onPause={() => { setPlaying(false); setControlsVisible(true); }} onEnded={() => { setPlaying(false); setControlsVisible(true); }}>
                {subtitleUrl && <track key={subtitleUrl} src={subtitleUrl} kind="subtitles" srcLang="en" label={subtitleName || "Subtitles"} default />}
                Your browser does not support this video format.
            </video>

            {!playing && <button type="button" onClick={togglePlayback} aria-label="Play" className="absolute left-1/2 top-[38%] z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-black/75 p-0 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 sm:top-1/2 sm:h-16 sm:w-16"><FaPlay className="h-6 w-6 translate-x-0.5 sm:h-7 sm:w-7"/></button>}

            <div className={`absolute inset-x-0 bottom-0 ${speedMenuOpen || settingsMenuOpen ? "z-30" : "z-10"} bg-gradient-to-t from-black/95 via-black/65 to-transparent px-3 pb-3 pt-12 transition-opacity duration-200 ${controlsVisible || !playing ? "opacity-100" : "pointer-events-none opacity-0"}`} onMouseEnter={() => setControlsVisible(true)}>
                <div className="video-timeline relative mb-2 h-4 cursor-pointer">
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white/25">
                        {bufferedRanges.map((range, index) => <div key={`${range.left}-${index}`} className="absolute inset-y-0 bg-white/35" style={{left: `${range.left}%`, width: `${range.width}%`}} />)}
                        <div className="absolute inset-y-0 left-0" style={{width: `${playedPercent}%`, backgroundColor: "var(--player-accent)"}} />
                    </div>
                    <input type="range" min={0} max={Math.max(duration, currentTime, 0.01)} step="0.05" value={Math.min(currentTime, Math.max(duration, currentTime, 0.01))} aria-label="Video timeline" className="video-timeline-input absolute inset-0 h-full w-full cursor-pointer"
                        onPointerDown={startTimelineSeek} onPointerUp={finishTimelineSeek} onPointerCancel={finishTimelineSeek}
                        onInput={event => { const next = Number(event.currentTarget.value); setCurrentTime(next); if (videoRef.current) videoRef.current.currentTime = next; }} />
                </div>

                <div className="flex h-8 items-center gap-0.5 text-white sm:h-9 sm:gap-1">
                    <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause" : "Play"} className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center bg-transparent p-0 text-zinc-200 transition-colors hover:text-white sm:h-9 sm:w-9">{playing ? <FaPause/> : <FaPlay/>}</button>
                    <div className="group/volume relative flex h-8 shrink-0 items-center overflow-visible sm:h-9">
                        <span className={`pointer-events-none absolute bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium tabular-nums text-white shadow-lg backdrop-blur-md transition-opacity sm:bottom-10 ${volumeFeedbackVisible ? "opacity-100" : "opacity-0 sm:group-hover/volume:opacity-100 sm:group-focus-within/volume:opacity-100"}`}>{Math.round((muted ? 0 : volume) * 100)}%</span>
                        <button type="button" onClick={toggleMuted} aria-label={muted ? "Unmute" : "Mute"} className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center overflow-visible bg-transparent p-0 text-zinc-200 transition-colors hover:text-white sm:h-9 sm:w-9"><span className="grid h-5 w-5 shrink-0 place-items-center overflow-visible">{muted || volume === 0 ? <FaVolumeXmark className="h-3.5 w-3.5 overflow-visible"/> : <FaVolumeHigh className="h-3.5 w-3.5 overflow-visible"/>}</span></button>
                        <div className={`hidden h-9 items-center overflow-hidden transition-all duration-200 sm:flex ${volumeFeedbackVisible ? "sm:w-20" : "sm:w-0 sm:group-hover/volume:w-20 sm:group-focus-within/volume:w-20"}`}><input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={changeVolume} aria-label="Volume" className="video-volume-input m-0 ml-1 block h-3 w-16 cursor-pointer" /></div>
                    </div>
                    <span className="ml-0.5 whitespace-nowrap text-[10px] tabular-nums text-white/90 sm:ml-1 sm:text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>

                    <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
                        <input ref={subtitleInputRef} type="file" accept=".srt,application/x-subrip" onChange={loadSubtitle} className="hidden" />
                        <button type="button" onClick={() => subtitleUrl ? setSubtitlesVisible(value => !value) : subtitleInputRef.current?.click()} onDoubleClick={() => subtitleInputRef.current?.click()} title={subtitleUrl ? `${subtitlesVisible ? "Hide" : "Show"} ${subtitleName}` : "Load .srt subtitles"} aria-label="Subtitles" className={`flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center bg-transparent p-0 transition-colors hover:text-white sm:h-9 sm:w-9 ${subtitleUrl && subtitlesVisible ? "text-red-500" : "text-zinc-300"}`}><FaClosedCaptioning/></button>
                        <div ref={speedMenuRef} className="relative">
                            {speedMenuOpen && <div className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-32 -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-white/10 bg-zinc-950/95 py-1 shadow-2xl backdrop-blur-md sm:absolute sm:bottom-11 sm:left-auto sm:right-0 sm:top-auto sm:max-h-none sm:w-40 sm:translate-x-0 sm:translate-y-0 sm:rounded-lg sm:py-1.5">
                                <p className="border-b border-white/10 px-2 pb-1.5 pt-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:px-3 sm:pb-2 sm:pt-1 sm:text-[10px] sm:tracking-[0.14em]">Playback speed</p>
                                <div className="py-0.5 sm:py-1">
                                    {PLAYBACK_SPEEDS.map(value => <button type="button" key={value} onClick={() => { setSpeed(value); if (videoRef.current) videoRef.current.playbackRate = value; setSpeedMenuOpen(false); }} className={`flex h-6 w-full items-center gap-1.5 bg-transparent px-2 text-left text-[10px] transition-colors hover:bg-white/10 hover:text-white sm:h-8 sm:gap-2 sm:px-3 sm:text-xs ${speed === value ? "text-white" : "text-zinc-400"}`}><span className="flex w-3 justify-center">{speed === value && <FaCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5"/>}</span><span>{value === 1 ? "Normal" : `${value}×`}</span></button>)}
                                </div>
                            </div>}
                            <button type="button" onClick={() => { setSpeedMenuOpen(value => !value); setSettingsMenuOpen(false); }} aria-label={`Playback speed ${speed}x`} title={`Speed: ${speed}×`} className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center overflow-visible bg-transparent p-0 text-zinc-300 transition-colors hover:text-white sm:h-9 sm:w-9"><span className="grid h-5 w-5 shrink-0 place-items-center overflow-visible"><FaGaugeHigh className="h-3.5 w-3.5 overflow-visible"/></span></button>
                        </div>
                        <div ref={settingsMenuRef} className="relative">
                            {settingsMenuOpen && <div className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(12.5rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md sm:absolute sm:bottom-11 sm:left-auto sm:right-0 sm:top-auto sm:max-h-none sm:w-60 sm:translate-x-0 sm:translate-y-0 sm:rounded-lg sm:p-2">
                                <p className="border-b border-white/10 px-1.5 pb-1.5 pt-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:px-2 sm:pb-2 sm:pt-1 sm:text-[10px] sm:tracking-[0.14em]">Player settings</p>
                                <button type="button" role="switch" aria-checked={subtitleBackground} onClick={() => setSubtitleBackground(value => !value)} className="flex h-8 w-full items-center justify-between rounded-md bg-transparent px-1.5 text-[10px] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:h-10 sm:px-2 sm:text-xs"><span>Subtitle background</span><span className={`relative h-4 w-7 rounded-full transition-colors sm:h-5 sm:w-9 ${subtitleBackground ? "bg-white" : "bg-zinc-700"}`}><span className={`absolute top-1 h-2 w-2 rounded-full transition-all sm:h-3 sm:w-3 ${subtitleBackground ? "left-4 bg-zinc-950 sm:left-5" : "left-1 bg-zinc-300"}`} /></span></button>
                                <button type="button" role="switch" aria-checked={hotkeysEnabled} onClick={() => setHotkeysEnabled(value => !value)} className="flex h-8 w-full items-center justify-between rounded-md bg-transparent px-1.5 text-[10px] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:h-10 sm:px-2 sm:text-xs"><span>Hotkeys</span><span className={`relative h-4 w-7 rounded-full transition-colors sm:h-5 sm:w-9 ${hotkeysEnabled ? "bg-white" : "bg-zinc-700"}`}><span className={`absolute top-1 h-2 w-2 rounded-full transition-all sm:h-3 sm:w-3 ${hotkeysEnabled ? "left-4 bg-zinc-950 sm:left-5" : "left-1 bg-zinc-300"}`} /></span></button>
                                <div className="mt-1 border-t border-white/10 px-2 pt-2">
                                    <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-zinc-500 sm:mb-2 sm:text-[10px] sm:tracking-[0.12em]">Time bar color</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {(Object.keys(TIMELINE_COLORS) as TimelineColor[]).map(color => <button type="button" key={color} onClick={() => setTimelineColor(color)} className={`flex h-7 items-center justify-center gap-1 rounded-md border text-[8px] font-semibold transition-colors sm:h-8 sm:gap-1.5 sm:text-[10px] ${timelineColor === color ? "border-white/30 bg-white/10 text-white" : "border-transparent bg-white/[.03] text-zinc-500 hover:bg-white/10 hover:text-zinc-200"}`}><span className="h-1.5 w-1.5 rounded-full border border-white/20 sm:h-2 sm:w-2" style={{backgroundColor: TIMELINE_COLORS[color]}} />{color}</button>)}
                                    </div>
                                </div>
                            </div>}
                            <button type="button" onClick={() => { setSettingsMenuOpen(value => !value); setSpeedMenuOpen(false); }} aria-label="Player settings" title="Settings" className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center bg-transparent p-0 text-zinc-300 transition-colors hover:text-white sm:h-9 sm:w-9"><FaGear/></button>
                        </div>
                        <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center bg-transparent p-0 text-zinc-300 transition-colors hover:text-white sm:h-9 sm:w-9"><FaExpand/></button>
                    </div>
                </div>
                {subtitleError && <p className="mt-1 text-xs text-red-400">{subtitleError}</p>}
            </div>

            <style jsx>{`
                .video-timeline-input { appearance: none; background: transparent; outline: none; }
                .video-timeline-input::-webkit-slider-runnable-track { height: 4px; background: transparent; }
                .video-timeline-input::-webkit-slider-thumb { width: 12px; height: 12px; margin-top: -4px; appearance: none; border-radius: 9999px; background: var(--player-accent); transform: scale(0); transition: transform 120ms ease; }
                .video-timeline:hover .video-timeline-input::-webkit-slider-thumb, .video-timeline-input:focus::-webkit-slider-thumb { transform: scale(1); }
                .video-timeline-input::-moz-range-track, .video-timeline-input::-moz-range-progress { height: 4px; background: transparent; }
                .video-timeline-input::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 9999px; background: var(--player-accent); }
                .video-volume-input { appearance: none; background: transparent; outline: none; }
                .video-volume-input::-webkit-slider-runnable-track { height: 3px; border-radius: 9999px; background: rgba(255,255,255,.55); }
                .video-volume-input::-webkit-slider-thumb { width: 8px; height: 8px; margin-top: -2.5px; appearance: none; border-radius: 9999px; background: #e4e4e7; transition: background-color 120ms ease, transform 120ms ease; }
                .video-volume-input:focus::-webkit-slider-thumb, .video-volume-input:active::-webkit-slider-thumb { background: var(--player-accent); transform: scale(1.08); }
                .video-volume-input::-moz-range-track { height: 3px; border-radius: 9999px; background: rgba(255,255,255,.55); }
                .video-volume-input::-moz-range-thumb { width: 8px; height: 8px; border: 0; border-radius: 9999px; background: #e4e4e7; transition: background-color 120ms ease, transform 120ms ease; }
                .video-volume-input:focus::-moz-range-thumb, .video-volume-input:active::-moz-range-thumb { background: var(--player-accent); transform: scale(1.08); }
                video.subtitles-no-background::cue { background: transparent; text-shadow: 0 1px 3px #000, 0 0 5px #000; }
                video.subtitles-with-background::cue { background: rgba(0,0,0,.75); }
            `}</style>
        </div>
    );
}
