'use client';

import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPasteApi } from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import { usePaste } from "@/context/PasteContext";
import { PasteDto } from "@/types/paste";
import LanguageModel from "@/types/LanguageModel";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/utils";
import { useHoverCard } from "@/hooks/useHoverCard";
import { FaArrowDown } from "react-icons/fa6";
import { infoToast, okToast } from "@/lib/client";
import { FaCopy } from "react-icons/fa";
import { UserObj } from "@/types/user";
import { UserPopupCard } from "@/components/UserPopupCard";
import {BundledTheme} from "shiki/themes";

const zoomOptions = [75, 90, 100, 110, 125, 150];

const themeOptions: BundledTheme[] = [
    "github-dark",
    "github-light",
    "nord",
    "dracula",
    "solarized-dark",
    "solarized-light",
    "aurora-x",
    "monokai",
    "rose-pine",
    "tokyo-night",
];

function transformLogHtml(html: string) {
    const withTimes = html.replace(/\b(\d{2}:\d{2}:\d{2}\.\d{3})\b/g, '<span class="log-time">$1</span>');
    return withTimes.replace(/\b(INFO|WARN|ERROR|DEBUG|TRACE|FATAL)\b/g, (_m, lvl) => {
        return `<span class="log-level log-${lvl}">${lvl}</span>`;
    });
}

function parseHash(hash: string) {
    // #L10 or #L10-L20
    if (!hash.startsWith("#L")) return null;
    const clean = hash.slice(2);
    const parts = clean.split("-L").map((p) => parseInt(p, 10)).filter((n) => !Number.isNaN(n));
    if (parts.length === 1) return { start: parts[0], end: parts[0] };
    if (parts.length === 2) return { start: Math.min(parts[0], parts[1]), end: Math.max(parts[0], parts[1]) };
    return null;
}

export default function Page() {
    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
    const { paste, setPaste } = usePaste();
    const [zoom, setZoom] = useState(100);
    const [theme, setTheme] = useState<BundledTheme>("github-dark");
    const [themeOpen, setThemeOpen] = useState(false);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [wrap, setWrap] = useState(true);
    const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);
    const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
    const lang: LanguageModel = useTranslation();
    const isMobile = useIsMobile();
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const dropdownRefTheme = useRef<HTMLDivElement | null>(null);
    const initialMobileZoomSet = useRef(false);

    const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);

    useEffect(() => {
        const fetchPaste = async () => {
            const pasteDto: PasteDto | null = await getPasteApi(String(uid));
            setPaste(pasteDto);
            setLoading(false);
        };

        if (!paste) {
            fetchPaste();
        } else {
            setLoading(false);
        }
    }, [uid, paste, setPaste]);

    const guessedLanguage = useMemo(() => {
        if (!paste?.title) return "text";
        const ext = paste.title.split(".").pop()?.toLowerCase() || "";
        const commonMap: Record<string, string> = {
            js: "javascript",
            jsx: "jsx",
            ts: "typescript",
            tsx: "tsx",
            py: "python",
            rb: "ruby",
            java: "java",
            cs: "csharp",
            cpp: "cpp",
            c: "c",
            go: "go",
            rs: "rust",
            php: "php",
            html: "html",
            css: "css",
            scss: "scss",
            json: "json",
            md: "markdown",
            sh: "bash",
            yml: "yaml",
            yaml: "yaml",
            swift: "swift",
            kt: "kotlin",
            log: "plaintext",
            txt: "plaintext",
        };
        return commonMap[ext] || "text";
    }, [paste?.title]);

    useEffect(() => {
        let cancelled = false;

        const runHighlight = async () => {
            if (!paste || paste.title.endsWith(".raw")) {
                setHighlightedHtml(null);
                return;
            }

            try {
                const shiki = await import("shiki");
                const { codeToHtml, bundledLanguages, bundledThemes } = shiki;

                const langKey =
                    guessedLanguage in bundledLanguages ? guessedLanguage : "plaintext";

                const themeKey =
                    theme in bundledThemes ? theme : "nord";

                /** @type {import("shiki").BundledLanguage | "plaintext"} */
                const safeLang = langKey as any;
                /** @type {import("shiki").BundledTheme} */
                const safeTheme = themeKey as any;

                // @ts-ignore
                let html = await codeToHtml(paste?.content || "", {
                    lang: safeLang,
                    theme: safeTheme,
                });

                const isLog = paste.title.toLowerCase().endsWith(".log");
                if (isLog) {
                    html = transformLogHtml(html);
                }

                if (!cancelled) setHighlightedHtml(html);
            } catch (e) {
                console.error("Shiki highlight failed, falling back to plain text", e);
                if (!cancelled) setHighlightedHtml(null);
            }
        };

        runHighlight();
        return () => {
            cancelled = true;
        };
    }, [paste, guessedLanguage, theme]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!dropdownRef.current) return;
            if (!dropdownRef.current.contains(e.target as Node)) {
                setZoomOpen(false);
            }
        };
        if (zoomOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [zoomOpen]);

    // Set default zoom for mobile once
    useEffect(() => {
        if (isMobile && !initialMobileZoomSet.current) {
            setZoom(75);
            initialMobileZoomSet.current = true;
        }
    }, [isMobile]);

    // Parse hash on load & hash changes to restore selection
    useEffect(() => {
        const applyHash = () => {
            if (typeof window === "undefined") return;
            const parsed = parseHash(window.location.hash || "");
            if (parsed) {
                setSelectionAnchor(parsed.start);
                setSelectedRange(parsed);
                const target = document.getElementById(`L${parsed.start}`);
                if (target) {
                    target.scrollIntoView({ block: "center", behavior: "smooth" });
                }
            } else {
                setSelectionAnchor(null);
                setSelectedRange(null);
            }
        };
        applyHash();
        window.addEventListener("hashchange", applyHash);
        return () => window.removeEventListener("hashchange", applyHash);
    }, []);

    const shikiLines = useMemo(() => {
        if (!highlightedHtml) return null;
        const codeMatch = highlightedHtml.match(/<code[^>]*>([\s\S]*?)<\/code>/);
        if (!codeMatch) return null;
        const inner = codeMatch[1] || "";
        const parts = inner.split('<span class="line">').slice(1);
        return parts.map((raw, idx) => {
            const cleaned = raw.replace(/<\/span>\s*$/, "");
            return { idx, html: cleaned };
        });
    }, [highlightedHtml]);

    const plainLines = useMemo(() => (paste?.content || "").split("\n"), [paste?.content]);
    const safeContent = paste?.content || "";

    // Global Ctrl/C (or Cmd/C on macOS) handler to copy selected lines or full content when nothing is selected
    useEffect(() => {
        if (typeof window === "undefined") return;

        const isMac = () =>
            typeof navigator !== "undefined" &&
            /mac/i.test(navigator.platform || navigator.userAgent);

        const onKeyDown = async (e: KeyboardEvent) => {
            const combo = isMac() ? e.metaKey : e.ctrlKey;
            if (!combo || e.key.toLowerCase() !== "c") return;

            const target = e.target as HTMLElement | null;
            if (target) {
                const tag = target.tagName?.toLowerCase();
                if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
            }

            const domSelection = window.getSelection();
            if (domSelection && domSelection.toString().trim()) return;

            const selectedText =
                selectedRange
                    ? plainLines
                        .slice(selectedRange.start - 1, selectedRange.end)
                        .join("\n")
                    : "";

            const textToCopy = selectedText || safeContent;
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                infoToast(selectedText ? "Selected lines copied" : "Paste copied");
            } catch (err) {
                console.error("Copy failed", err);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [plainLines, selectedRange, safeContent]);

    if (loading) return <LoadingPage />;
    if (!paste) return notFound();

    const showRaw = paste.title.endsWith(".raw");
    const createdAt = new Date(paste.createdAt).toLocaleString();
    const shortUrl = paste.urlSet?.shortUrl || "";
    const fontSizePx = 13 * (zoom / 100);

    const setHashRange = (start: number, end: number) => {
        const hash = start === end ? `#L${start}` : `#L${start}-L${end}`;
        if (typeof window !== "undefined") {
            window.history.replaceState(null, "", hash);
        }
    };

    const clearHash = () => {
        if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    }

    const handleLineClick = (lineNumber: number, event: React.MouseEvent) => {
        if (event.shiftKey && selectionAnchor) {
            const start = Math.min(selectionAnchor, lineNumber);
            const end = Math.max(selectionAnchor, lineNumber);
            setSelectedRange({start, end});
            setHashRange(start, end);
        } else if (event.ctrlKey) {
            setSelectionAnchor(null);
            setSelectedRange(null);
            clearHash();
        } else {
            if (isSelected(lineNumber) && (selectedRange == null || selectedRange.start == selectedRange.end)) {
                setSelectionAnchor(null);
                setSelectedRange(null);
                clearHash();
            } else {
                setSelectionAnchor(lineNumber);
                setSelectedRange({ start: lineNumber, end: lineNumber });
                setHashRange(lineNumber, lineNumber);
            }
        }
    };

    const getSelectedContent = () => {
        if (!selectedRange) return "";
        const { start, end } = selectedRange;
        const lines = plainLines.slice(start - 1, end);
        return lines.join("\n");
    };

    const copySelectedContent = async () => {
        const text = getSelectedContent();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            infoToast("Selected lines copied");
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const copyPermalink = async () => {
        if (!selectedRange) return;
        const { start, end } = selectedRange;
        const hash = start === end ? `#L${start}` : `#L${start}-L${end}`;
        const url = `${window.location.origin}${window.location.pathname}${hash}`;
        try {
            await navigator.clipboard.writeText(url);
            infoToast("Permalink copied");
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const isSelected = (line: number) =>
        !!selectedRange && line >= selectedRange.start && line <= selectedRange.end;

    const showSelectionActions = !!selectedRange;

    return (
        <>
            <div
                className="min-h-screen w-full text-gray-100 px-3 py-6 flex justify-center relative"
            >
                <div className="w-full max-w-6xl flex flex-col gap-6">
                    {/* Header */}
                    <div className="bg-dark-grey3/70 backdrop-blur box-primary p-5 shadow-lg rounded-2xl">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4" onMouseMove={handleMouseMove}>
                            <div className="flex flex-row items-center gap-3 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-semibold leading-tight break-words break-all">
                                    {paste.title}
                                </h1>
                                <p className="text-sm text-white/60 break-all">({paste.uniqueId})</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base">
                                <div className="flex items-center gap-2 text-white/80">
                                    <span className="text-white/60">by</span>
                                    <a
                                        href={`/user/${paste.uploader.username}`}
                                        className="text-telegram font-semibold hover:underline break-all"
                                        onMouseLeave={handleMouseLeave}
                                        onMouseEnter={handleMouseEnter}
                                    >
                                        {paste.uploader.username}
                                    </a>
                                </div>
                                <span className="hidden md:inline text-white/40">•</span>
                                <span className="text-white/60">Created: {createdAt}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/70">
              <span className="px-2.5 py-1 rounded-full box-primary break-all">
                {showRaw ? "Raw view" : guessedLanguage}
              </span>
                            <span className="flex items-center gap-2 px-2.5 py-1 rounded-full box-primary break-all">
                <span className="break-all">{shortUrl}</span>
                <button
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(shortUrl);
                            infoToast("Short URL copied to clipboard!");
                        } catch (err) {
                            console.error("Copy failed", err);
                        }
                    }}
                    className="px-0.5 text-[15px]"
                >
                  <FaCopy />
                </button>
              </span>
                        </div>
                    </div>

                    {/* Code / snippet */}
                    <div className="box-primary shadow-lg overflow-hidden">
                        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-start lg:items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-dark-grey3/60">
                            {/* Left label */}
                            <div className="flex items-center gap-3 text-sm text-white/70">
                                <span className="font-mono uppercase tracking-[0.12em] text-[11px] text-white/50">
                                  Snippet
                                </span>
                                {!showRaw && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs border border-white/10">
                                        {guessedLanguage}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div
                                className="flex flex-wrap items-center gap-2 sm:gap-3"
                                ref={dropdownRef}
                            >
                                {/* Theme */}
                                <div className="relative">
                                    <button
                                        onClick={() => setThemeOpen((v) => !v)}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs box-primary transition"
                                    >
                                        Theme: {theme}
                                        <span className={`transition-transform ${themeOpen ? "rotate-180" : ""}`}>
                                          <FaArrowDown />
                                        </span>
                                    </button>
                                    {themeOpen && (
                                        <div className="absolute right-0 mt-2 w-32 rounded-xl bg-dark-grey3/90 box-primary shadow-xl overflow-hidden z-10">
                                            {themeOptions.map((z, idx) => (
                                                <button
                                                    key={z}
                                                    onClick={() => {
                                                        setTheme(z);
                                                        setThemeOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition ${
                                                        idx !== themeOptions.length - 1 ? "border-b border-white/5" : ""
                                                    } ${z === theme ? "bg-white/10 text-white" : "text-white/80"}`}
                                                >
                                                    {z}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Zoom */}
                                <div className="relative">
                                    <button
                                        onClick={() => setZoomOpen((v) => !v)}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs box-primary transition"
                                    >
                                        Zoom: {zoom}%
                                        <span className={`transition-transform ${zoomOpen ? "rotate-180" : ""}`}>
                                          <FaArrowDown />
                                        </span>
                                    </button>
                                    {zoomOpen && (
                                        <div className="absolute right-0 mt-2 w-32 rounded-xl bg-dark-grey3/90 box-primary shadow-xl overflow-hidden z-10">
                                            {zoomOptions.map((z, idx) => (
                                                <button
                                                    key={z}
                                                    onClick={() => {
                                                        setZoom(z);
                                                        setZoomOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition ${
                                                        idx !== zoomOptions.length - 1 ? "border-b border-white/5" : ""
                                                    } ${z === zoom ? "bg-white/10 text-white" : "text-white/80"}`}
                                                >
                                                    {z}%
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Copy all */}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(safeContent);
                                        infoToast("Copied to clipboard!");
                                    }}
                                    className="rounded-lg px-3 py-1.5 text-xs box-primary"
                                >
                                    Copy
                                </button>

                                {/* Wrap toggle */}
                                <button
                                    onClick={() => setWrap((w) => !w)}
                                    className="rounded-lg px-3 py-1.5 text-xs box-primary"
                                >
                                    Wrap: {wrap ? "On" : "Off"}
                                </button>

                                {/* Selection actions (shown only when a range is selected) */}
                                {showSelectionActions && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={copySelectedContent}
                                            className="rounded-lg px-3 py-1.5 text-xs box-primary"
                                        >
                                            Copy lines
                                        </button>
                                        <button
                                            onClick={copyPermalink}
                                            className="rounded-lg px-3 py-1.5 text-xs box-primary"
                                        >
                                            Copy link
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            {!showRaw && highlightedHtml === null && (
                                <div className="animate-pulse p-4 sm:p-6 space-y-3">
                                    <div className="h-4 bg-white/10 rounded w-11/12" />
                                    <div className="h-4 bg-white/10 rounded w-9/12" />
                                    <div className="h-4 bg-white/10 rounded w-10/12" />
                                    <div className="h-4 bg-white/10 rounded w-7/12" />
                                </div>
                            )}

                            <div
                                className={`overflow-auto max-h-[72vh] nice-scrollbar ${
                                    wrap ? "" : "wide-scrollbar"
                                }`}
                            >
                                {/* Line-numbered view with selection, wrap toggle, and Shiki highlighting */}
                                {showRaw || highlightedHtml === null || !shikiLines ? (
                                    <ol
                                        className={`code-grid ${wrap ? "wrap-on" : "wrap-off"}`}
                                        style={{ fontSize: `${fontSizePx}px` }}
                                    >
                                        {plainLines.map((line, i) => {
                                            const lineNumber = i + 1;
                                            return (
                                                <li
                                                    key={lineNumber}
                                                    id={`L${lineNumber}`}
                                                    className={`code-line ${isSelected(lineNumber) ? "line-selected" : ""}`}
                                                >
                                                    <button
                                                        className="line-num"
                                                        onClick={(e) => handleLineClick(lineNumber, e)}
                                                        aria-label={`Line ${lineNumber}`}
                                                    >
                                                        {lineNumber}
                                                    </button>
                                                    <span className="line-content">{line || " "}</span>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : (
                                    <div
                                        className={`shiki code-grid ${wrap ? "wrap-on" : "wrap-off"}`}
                                        style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.6 }}
                                    >
                                        {shikiLines.map(({ idx, html }) => {
                                            const lineNumber = idx + 1;
                                            return (
                                                <div
                                                    key={lineNumber}
                                                    id={`L${lineNumber}`}
                                                    className={`code-line ${isSelected(lineNumber) ? "line-selected" : ""}`}
                                                >
                                                    <button
                                                        className="line-num"
                                                        onClick={(e) => handleLineClick(lineNumber, e)}
                                                        aria-label={`Line ${lineNumber}`}
                                                    >
                                                        {lineNumber}
                                                    </button>
                                                    <span
                                                        className="line-content"
                                                        dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`pointer-events-none transition-all duration-200 ease-out transform ${
                    showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                } absolute box-primary p-4 z-50 flex flex-row gap-4`}
                style={{ top: position.y + 10, left: position.x + 20 }}
            >
                <UserPopupCard user={paste.uploader as UserObj} lang={lang} />
            </div>

            <style jsx global>{`
                .nice-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.25) transparent;
                }
                .nice-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .nice-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .nice-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12));
                    border-radius: 9999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }
                .nice-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.18));
                    background-clip: padding-box;
                }
                .wide-scrollbar {
                    scrollbar-width: auto;
                }
                .wide-scrollbar::-webkit-scrollbar {
                    width: 14px;
                    height: 14px;
                }

                .code-grid {
                    counter-reset: line;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: grid;
                    grid-auto-rows: auto;
                }
                .code-grid .code-line {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 0.75rem;
                    padding: 0.05rem 1rem 0.05rem 0.75rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
                }
                .code-grid .code-line:last-child {
                    border-bottom: none;
                }
                .line-num {
                    text-align: right;
                    color: rgba(255, 255, 255, 0.45);
                    font-variant-numeric: tabular-nums;
                    user-select: none;
                    min-width: 2.5rem;
                    padding-right: 0.25rem;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }
                .line-num:hover {
                    color: #e5e7eb;
                }
                .line-content {
                    color: #e5e7eb;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .wrap-off .line-content {
                    white-space: pre;
                    word-break: normal;
                }
                .line-selected {
                    background: rgba(79, 70, 229, 0.12);
                }
                /* Shiki wrap control */
                .wrap-on pre,
                .wrap-on code {
                    white-space: pre-wrap !important;
                    word-break: break-word !important;
                }
                .wrap-off pre,
                .wrap-off code {
                    white-space: pre !important;
                    word-break: normal !important;
                }
                /* Log highlighting */
                .log-time {
                    color: #7dd3fc;
                    font-weight: 600;
                }
                .log-level {
                    font-weight: 700;
                }
                .log-INFO { color: #a3e635; }
                .log-WARN { color: #f59e0b; }
                .log-ERROR { color: #f87171; }
                .log-DEBUG { color: #60a5fa; }
                .log-TRACE { color: #c084fc; }
                .log-FATAL { color: #f43f5e; }
            `}</style>
        </>
    );
}