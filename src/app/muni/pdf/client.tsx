"use client";
import { SelectionInput } from "@/components/ui/SelectionInput";


import {useEffect, useState} from "react";
import {FaEye, FaFileArrowDown, FaFloppyDisk, FaKey, FaPlay} from "react-icons/fa6";
import HoverDiv from "@/components/HoverDiv";
import MainStringInput from "@/components/MainStringInput";
import {getApiUrl} from "@/lib/core";

type DownloadedPdf = {
    fileName: string;
    link: string;
    size: number;
};

type ServerEvent = {
    event: string;
    data: string;
};

const API_KEY_STORAGE_KEY = "muni_pdf_api_key";
const SAVE_API_KEY_STORAGE_KEY = "muni_pdf_save_api_key";

function formatBytes(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parseSseEvents(buffer: string): {events: ServerEvent[]; remainder: string} {
    const chunks = buffer.split(/\r?\n\r?\n/);
    const remainder = chunks.pop() ?? "";
    const events = chunks.map(chunk => {
        const lines = chunk.split(/\r?\n/);
        const event = lines.find(line => line.startsWith("event:"))?.slice(6).trim() ?? "message";
        const data = lines
            .filter(line => line.startsWith("data:"))
            .map(line => line.slice(5).trim())
            .join("\n");

        return {event, data};
    }).filter(item => item.data.length > 0);

    return {events, remainder};
}

function isCredentialDiagnostic(message: string) {
    return message.startsWith("__Host-") || message.startsWith("User-Agent:");
}

export default function MuniPdfClient() {
    const [apiKey, setApiKey] = useState("");
    const [urls, setUrls] = useState("");
    const [saveApiKey, setSaveApiKey] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [files, setFiles] = useState<DownloadedPdf[]>([]);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const shouldSave = localStorage.getItem(SAVE_API_KEY_STORAGE_KEY) === "true";
        setSaveApiKey(shouldSave);

        if (shouldSave) {
            setApiKey(localStorage.getItem(API_KEY_STORAGE_KEY) ?? "");
        }
    }, []);

    const updateSaveApiKey = (shouldSave: boolean) => {
        setSaveApiKey(shouldSave);
        localStorage.setItem(SAVE_API_KEY_STORAGE_KEY, String(shouldSave));

        if (shouldSave) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        } else {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
    };

    const updateApiKey = (value: string) => {
        setApiKey(value);
        if (saveApiKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, value);
        }
    };

    const handleEvent = (serverEvent: ServerEvent) => {
        try {
            const payload = JSON.parse(serverEvent.data) as unknown;

            if (serverEvent.event === "log" && typeof payload === "object" && payload !== null && "message" in payload) {
                const message = (payload as {message: unknown}).message;
                if (typeof message === "string" && !isCredentialDiagnostic(message)) {
                    setLogs(current => [...current, message]);
                }
            }

            if (serverEvent.event === "file" && typeof payload === "object" && payload !== null) {
                const file = payload as DownloadedPdf;
                if (typeof file.fileName === "string" && typeof file.link === "string" && typeof file.size === "number") {
                    setFiles(current => [...current, file]);
                }
            }

            if (serverEvent.event === "error" && typeof payload === "object" && payload !== null && "message" in payload) {
                const message = (payload as {message: unknown}).message;
                setError(typeof message === "string" ? message : "The download failed.");
            }
        } catch {
            setLogs(current => [...current, "Received an unreadable update from the server."]);
        }
    };

    const downloadPdfs = async () => {
        const requestedUrls = urls.split("\n").map(value => value.trim()).filter(Boolean);

        if (!apiKey.trim()) {
            setError("Enter your MUNI PDF API key.");
            return;
        }

        if (requestedUrls.length === 0) {
            setError("Enter at least one MUNI PDF link.");
            return;
        }

        setIsDownloading(true);
        setError(null);
        setFiles([]);
        setLogs(["Starting MUNI PDF download."]);

        try {
            const response = await fetch(`${getApiUrl()}/v1/muni/pdfs`, {
                method: "POST",
                headers: {"Content-Type": "application/json", "Accept": "text/event-stream"},
                body: JSON.stringify({apiKey: apiKey.trim(), urls: requestedUrls}),
            });

            if (!response.ok || !response.body) {
                throw new Error("The server could not start the PDF download.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const {done, value} = await reader.read();
                buffer += decoder.decode(value ?? new Uint8Array(), {stream: !done});

                const parsed = parseSseEvents(buffer);
                buffer = parsed.remainder;
                parsed.events.forEach(handleEvent);

                if (done) break;
            }
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "The PDF download failed.");
        } finally {
            setIsDownloading(false);
        }
    };

    const viewPdf = (file: DownloadedPdf) => {
        window.open(file.link, "_blank", "noopener,noreferrer");
    };

    const savePdf = async (file: DownloadedPdf) => {
        setDownloadingFile(file.link);

        try {
            const response = await fetch(`/api/muni/pdf-download?link=${encodeURIComponent(file.link)}`);
            if (!response.ok) {
                throw new Error("The PDF could not be downloaded.");
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = file.fileName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "The PDF could not be downloaded.");
        } finally {
            setDownloadingFile(null);
        }
    };

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
            <section className="rounded-2xl border border-white/10 bg-primary1 p-5 shadow-2xl sm:p-8">
                <div className="mb-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">MUNI tools</p>
                    <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Download MUNI PDFs</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Add one link per line.</p>
                </div>

                <div className="grid gap-6">
                    <div className="space-y-5">
                        <label className="block space-y-2">
                        <span className="text-sm font-medium text-zinc-200">API key</span>
                        <MainStringInput
                            type="password"
                            value={apiKey}
                            onChange={updateApiKey}
                            placeholder="API key"
                            autoComplete="off"
                            suffix={<FaKey/>}
                        />
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
                            <SelectionInput
                                type="checkbox"
                                checked={saveApiKey}
                                onChange={event => updateSaveApiKey(event.target.checked)}
                                className="h-4 w-4 accent-emerald-500"
                            />
                            <span className="inline-flex items-center gap-2"><FaFloppyDisk className="text-emerald-300"/> Save key on this device</span>
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-zinc-200">MUNI PDF links</span>
                            <div className="relative">
                                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 select-none overflow-hidden border-r border-white/10 bg-black/20 py-3 text-right font-mono text-sm leading-5 text-zinc-600">
                                    {Array.from({length: Math.max(7, urls.split("\n").length)}, (_, index) => <div key={index} className="pr-3">{index + 1}</div>)}
                                </div>
                                <MainStringInput
                                    multiline
                                    value={urls}
                                    onChange={setUrls}
                                    rows={9}
                                    placeholder={"https://is.muni.cz/.../lecture.pdf\nhttps://is.muni.cz/.../another.pdf"}
                                    inputClassName="pl-16 font-mono text-sm leading-5"
                                />
                            </div>
                        </label>

                        <HoverDiv
                            type="SAVE"
                            icon={<FaPlay/>}
                            onClick={() => void downloadPdfs()}
                            disabled={isDownloading}
                            className="w-full px-4 py-3 font-semibold sm:w-auto"
                        >
                            {isDownloading ? "Downloading PDFs…" : "Download PDFs"}
                        </HoverDiv>
                    </div>

                    {/*<section className="min-h-64 rounded-xl border border-white/10 bg-black/20 p-4 lg:sticky lg:top-5 lg:h-[calc(100vh-5rem)] lg:max-h-[650px]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-white">Live activity</h2>
                                <p className="mt-1 text-xs text-zinc-500">Progress is shared as each file is processed.</p>
                            </div>
                            <span className={isDownloading ? "h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" : "h-2.5 w-2.5 rounded-full bg-zinc-700"}/>
                        </div>
                        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-zinc-400 lg:max-h-[calc(100%-4rem)]">{logs.length ? logs.join("\n") : "Waiting to start."}</pre>
                    </section>*/}
                </div>

                {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>}

                <div className="mt-8">
                    <section className="min-h-44 rounded-xl border border-white/10 bg-black/20 p-4">
                        <h2 className="text-sm font-semibold text-white">Downloaded files</h2>
                        {files.length === 0 ? <p className="mt-3 text-sm text-zinc-500">Files will appear here as each download finishes.</p> : <div className="mt-3 space-y-2">
                            {files.map(file => <div key={file.link} className="flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-emerald-100">{file.fileName}</p>
                                    <p className="mt-1 text-xs text-emerald-300">{formatBytes(file.size)}</p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <HoverDiv type="INFO" icon={<FaEye/>} onClick={() => viewPdf(file)} className="px-3 py-2 text-xs">View</HoverDiv>
                                    <HoverDiv type="SAVE" icon={<FaFileArrowDown/>} onClick={() => void savePdf(file)} disabled={downloadingFile === file.link} className="px-3 py-2 text-xs">{downloadingFile === file.link ? "Saving…" : "Download"}</HoverDiv>
                                </div>
                            </div>)}
                        </div>}
                    </section>
                </div>
            </section>
        </main>
    );
}
