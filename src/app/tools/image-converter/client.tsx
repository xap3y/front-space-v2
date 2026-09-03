"use client";

import {useCallback, useEffect, useState} from "react";
import MediaInput from "@/components/tools/MediaInput";
import ToolResult from "@/components/tools/ToolResult";
import {SelectInput} from "@/components/tools/ToolInputs";
import HoverDiv from "@/components/HoverDiv";
import MainStringInput from "@/components/MainStringInput";
import {processMedia} from "@/lib/tools-api";
import {getUserImages} from "@/lib/apiGetters";
import {useUser} from "@/hooks/useUser";
import {ImageListResponse, UploadedImagePage} from "@/types/image";
import {errorToast, okToast, uploadImageBucket} from "@/lib/client";
import {FaArrowRight, FaCheck, FaImage, FaImages, FaRotate, FaXmark} from "react-icons/fa6";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._ ()-]{0,179}$/;
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "tiff", "tif", "gif", "bmp", "avif", "ico", "psd", "svg", "heic", "heif", "jxl", "apng", "eps", "pdf"];
const ACCEPT = {
    "image/*": EXTENSIONS.map(extension => `.${extension}`),
    "application/octet-stream": [".psd", ".jxl"],
    "image/vnd.adobe.photoshop": [".psd"],
    "application/pdf": [".pdf"],
    "application/postscript": [".eps"],
};
const FORMATS = [
    {label: "PNG", value: "png"},
    {label: "JPG", value: "jpg"},
    {label: "JPEG", value: "jpeg"},
    {label: "WebP", value: "webp"},
    {label: "AVIF", value: "avif"},
    {label: "TIFF", value: "tiff"},
    {label: "GIF", value: "gif"},
    {label: "BMP", value: "bmp"},
    {label: "ICO", value: "ico"},
    {label: "PSD", value: "psd"},
    {label: "SVG", value: "svg"},
    {label: "JPEG XL", value: "jxl"},
    {label: "Animated PNG", value: "apng"},
    {label: "EPS", value: "eps"},
    {label: "PDF", value: "pdf"},
];

const HEIC_OUTPUTS = new Set(["png", "jpg", "jpeg"]);
const GALLERY_OUTPUTS = new Set(["png", "jpg", "jpeg", "webp", "tiff", "gif", "bmp", "avif", "ico", "svg"]);

function extensionOf(name: string) {
    return name.split(".").pop()?.toLowerCase() ?? "";
}

function baseNameOf(name: string) {
    const dot = name.lastIndexOf(".");
    return dot > 0 ? name.slice(0, dot) : name;
}

function canonicalFormat(format: string) {
    if (format === "jpeg") return "jpg";
    if (format === "tif") return "tiff";
    return format;
}

function safeUploadName(image: UploadedImagePage) {
    const extension = EXTENSIONS.includes(image.type.toLowerCase()) ? image.type.toLowerCase() : "png";
    return `${image.uniqueId.replace(/[^A-Za-z0-9_-]/g, "_")}.${extension}`;
}

export default function ImageConverterClient() {
    const {user} = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState("png");
    const [filenameMode, setFilenameMode] = useState<"preserve" | "custom">("preserve");
    const [customName, setCustomName] = useState("");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFilename, setResultFilename] = useState("");
    const [resultSize, setResultSize] = useState<number | undefined>();
    const [error, setError] = useState<string | null>(null);
    const [uploadsOpen, setUploadsOpen] = useState(false);
    const [uploadsLoading, setUploadsLoading] = useState(false);
    const [uploads, setUploads] = useState<UploadedImagePage[]>([]);
    const [inputPreviewUrl, setInputPreviewUrl] = useState<string | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const clearResult = useCallback(() => {
        setResultUrl(current => {
            if (current) URL.revokeObjectURL(current);
            return null;
        });
        setResultFilename("");
        setResultSize(undefined);
        setError(null);
        setProgress(0);
        setUploading(false);
        setUploadProgress(0);
        setUploadedUrl(null);
    }, []);

    useEffect(() => () => {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
    }, [resultUrl]);

    useEffect(() => {
        if (!file) {setInputPreviewUrl(null); return;}
        const url = URL.createObjectURL(file);
        setInputPreviewUrl(url);
        setPreviewFailed(false);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        if (!file) return;
        const input = canonicalFormat(extensionOf(file.name));
        const invalidForHeic = (input === "heic" || input === "heif") && !HEIC_OUTPUTS.has(format);
        if (canonicalFormat(format) === input || invalidForHeic) setFormat(input === "png" ? "jpg" : "png");
    }, [file, format]);

    useEffect(() => {
        if (!uploadsOpen) return;
        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape") setUploadsOpen(false);
        };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [uploadsOpen]);

    const chooseFile = useCallback((next: File) => {
        const extension = extensionOf(next.name);
        if (next.size > MAX_FILE_SIZE) return errorToast("Image must be 50 MB or smaller");
        if (!SAFE_FILENAME.test(next.name) || next.name.includes("..") || next.name.normalize("NFC") !== next.name) {
            return errorToast("Rename the file using normal letters, numbers, spaces, dots, dashes, or underscores");
        }
        if (!EXTENSIONS.includes(extension)) return errorToast("That image format is not supported");
        clearResult();
        setFile(next);
        setCustomName(baseNameOf(next.name).slice(0, 160));
    }, [clearResult]);

    const openUploads = async () => {
        if (!user?.uid) return;
        setUploadsOpen(true);
        if (uploads.length) return;
        setUploadsLoading(true);
        try {
            const response = await getUserImages(String(user.uid), 0, 48);
            setUploads((response?.data as ImageListResponse | undefined)?.images ?? []);
        } catch {
            errorToast("Could not load your uploads");
        } finally {
            setUploadsLoading(false);
        }
    };

    const chooseUpload = async (image: UploadedImagePage) => {
        try {
            const response = await fetch(image.urls.rawUrl, {credentials: "omit"});
            if (!response.ok) throw new Error("Could not download that upload");
            const blob = await response.blob();
            chooseFile(new File([blob], safeUploadName(image), {type: blob.type || `image/${image.type}`}));
            setUploadsOpen(false);
        } catch (reason) {
            errorToast(reason instanceof Error ? reason.message : "Could not select that upload");
        }
    };

    const convert = async () => {
        if (!file || !user?.apiKey || processing) return;
        clearResult();
        setProcessing(true);
        try {
            const options: Record<string, string | boolean> = {format, preserveName: filenameMode === "preserve"};
            if (filenameMode === "custom") options.fileName = customName.trim();
            const result = await processMedia("image/convert", file, options, setProgress, user.apiKey);
            setResultUrl(result.url);
            const requestedBaseName = filenameMode === "custom" ? customName.trim() : baseNameOf(file.name);
            setResultFilename(`${requestedBaseName}.${format}`);
            setResultSize(result.size);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Conversion failed");
        } finally {
            setProcessing(false);
        }
    };

    const saveToSpace = async () => {
        if (!resultUrl || !resultFilename || !user?.apiKey || uploading) return;
        if (!GALLERY_OUTPUTS.has(extensionOf(resultFilename))) return errorToast("This output format cannot be saved to the gallery");
        setUploading(true);
        setUploadProgress(0);
        try {
            const response = await fetch(resultUrl);
            const blob = await response.blob();
            const outputFile = new File([blob], resultFilename, {type: blob.type || "application/octet-stream"});
            const data = new FormData();
            data.append("file", outputFile);
            data.append("apiKey", user.apiKey);
            data.append("source", "PORTAL");
            const uploaded = await uploadImageBucket(data, user.apiKey, null, setUploadProgress);
            setUploadedUrl(uploaded.urlSet.portalUrl);
            okToast("Converted image saved to your gallery", 1800);
        } catch (reason) {
            errorToast(reason instanceof Error ? reason.message : "Could not save the converted image");
        } finally {
            setUploading(false);
        }
    };

    const inputFormat = file ? canonicalFormat(extensionOf(file.name)) : "";
    const customNameValid = filenameMode === "preserve" || (customName.trim().length > 0 && customName.trim().length <= 160 && SAFE_FILENAME.test(customName.trim()) && !customName.includes(".."));
    const outputOptions = FORMATS.map(option => ({
        ...option,
        disabled: canonicalFormat(option.value) === inputFormat
            || ((inputFormat === "heic" || inputFormat === "heif") && !HEIC_OUTPUTS.has(option.value)),
    }));

    return <div className="mx-auto max-w-6xl pb-16 text-neutral-200 xl:pb-0">
        <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Image converter</h1>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">Convert between common, modern, icon, vector, and layered image formats.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
                <MediaInput
                    accept={ACCEPT}
                    maxSize={MAX_FILE_SIZE}
                    onFile={chooseFile}
                    file={file}
                    onClear={() => {clearResult(); setFile(null);}}
                    disabled={processing}
                    label="Drop an image here"
                    hint="select from your computer • paste with Ctrl+V • maximum 50 MB"
                />
                {!file && <HoverDiv type="INFO" icon={<FaImages/>} onClick={openUploads} className="w-full py-2.5 text-xs font-semibold">Select from uploads</HoverDiv>}

                {file && <div className="box-primary grid overflow-hidden rounded-xl sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex min-h-44 items-center justify-center border-b border-zinc-800 bg-black/30 p-3 sm:border-b-0 sm:border-r">
                        {inputPreviewUrl && !previewFailed
                            ? <img src={inputPreviewUrl} alt={`Preview of ${file.name}`} onError={() => setPreviewFailed(true)} className="max-h-64 max-w-full rounded-lg object-contain"/>
                            : <div className="flex flex-col items-center gap-2 text-zinc-600"><FaImage className="h-8 w-8"/><span className="text-xs">Preview unavailable for this format</span></div>}
                    </div>
                    <div className="flex min-w-44 flex-col justify-center gap-2 p-4 text-xs">
                        <p className="max-w-48 truncate font-medium text-zinc-200" title={file.name}>{file.name}</p>
                        <div className="flex items-center gap-2 font-mono"><span className="uppercase text-zinc-400">{extensionOf(file.name)}</span><FaArrowRight className="text-zinc-600"/><span className="uppercase text-emerald-300">{format}</span></div>
                        <p className="text-[10px] text-zinc-600">{formatBytes(file.size)}</p>
                    </div>
                </div>}

                <ToolResult processing={processing} progress={progress} resultUrl={resultUrl} resultFilename={resultFilename} resultSize={resultSize} error={error} onClose={clearResult} onUpload={GALLERY_OUTPUTS.has(format) ? saveToSpace : undefined} uploading={uploading} uploadProgress={uploadProgress} uploadedUrl={uploadedUrl}/>
            </div>

            <aside className="box-primary h-fit space-y-4 rounded-xl p-4 xl:sticky xl:top-0">
                <div>
                    <h2 className="text-sm font-semibold text-white">Output</h2>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">The original file is never changed. Metadata is removed from the downloaded copy.</p>
                </div>
                <SelectInput label="File type" value={format} onChange={value => {setFormat(value); clearResult();}} options={outputOptions} disabled={processing}/>
                <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase text-neutral-500">Filename</p>
                    <div className="grid grid-cols-2 gap-2">
                        <HoverDiv onClick={() => {setFilenameMode("preserve"); clearResult();}} disabled={processing} className={`px-2 py-2 text-[11px] ${filenameMode === "preserve" ? "!border-emerald-600/70 !text-emerald-300" : ""}`}>Keep original</HoverDiv>
                        <HoverDiv onClick={() => {setFilenameMode("custom"); clearResult();}} disabled={processing} className={`px-2 py-2 text-[11px] ${filenameMode === "custom" ? "!border-emerald-600/70 !text-emerald-300" : ""}`}>Custom name</HoverDiv>
                    </div>
                    {filenameMode === "custom" && <div className="mt-2">
                        <MainStringInput
                            value={customName}
                            onChange={value => {setCustomName(value.slice(0, 160)); clearResult();}}
                            placeholder="converted-image"
                            disabled={processing}
                            suffix={`.${format}`}
                            aria-label="Custom output filename"
                            className={`rounded-lg bg-neutral-950 ${customNameValid ? "border-neutral-800" : "!border-red-700"}`}
                            inputClassName="py-2 pl-3 pr-16 text-sm"
                            suffixClassName="right-3 text-zinc-400"
                        />
                        {!customNameValid && <p className="mt-1 text-[10px] text-red-400">Use letters, numbers, spaces, dots, dashes, or underscores.</p>}
                    </div>}
                    {filenameMode === "preserve" && file && <p className="mt-2 truncate font-mono text-[10px] text-zinc-500">{baseNameOf(file.name)}.{format}</p>}
                </div>
                <div className="rounded-lg border border-zinc-800 bg-black/20 p-3 text-[10px] leading-5 text-zinc-500">
                    PNG, JPG, JPEG, WebP, TIFF, GIF, BMP, AVIF, ICO, PSD, SVG, HEIC, HEIF, JXL, APNG, EPS and PDF are accepted.
                </div>
                <HoverDiv type="SAVE" icon={processing ? <FaRotate className="animate-spin"/> : <FaCheck/>} onClick={convert} disabled={!file || processing || !customNameValid} className="w-full py-3 text-sm font-semibold">
                    {processing ? "Converting…" : `Convert to ${format.toUpperCase()}`}
                </HoverDiv>
            </aside>
        </div>

        {uploadsOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={event => {if (event.target === event.currentTarget) setUploadsOpen(false);}}>
            <div className="max-h-[82vh] w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-800 bg-[#101014] shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                    <div><h2 className="font-semibold text-white">Select from uploads</h2><p className="mt-0.5 text-xs text-zinc-500">Choose one image to convert.</p></div>
                    <HoverDiv icon={<FaXmark/>} onClick={() => setUploadsOpen(false)} className="h-9 w-9 p-0" aria-label="Close uploads"/>
                </div>
                <div className="grid max-h-[68vh] grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
                    {uploadsLoading ? <p className="col-span-full py-16 text-center text-sm text-zinc-500">Loading uploads…</p> : uploads.length ? uploads.map(image => <HoverDiv key={image.uniqueId} type="INFO" onClick={() => void chooseUpload(image)} className="group flex-col items-stretch gap-0 overflow-hidden rounded-lg bg-black/20 p-0 text-left">
                        <img src={image.urls.rawUrl} alt={image.description || image.uniqueId} className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"/>
                        <span className="truncate p-2 text-[11px] text-zinc-400">{image.description || image.uniqueId}</span>
                    </HoverDiv>) : <p className="col-span-full py-16 text-center text-sm text-zinc-500">No uploaded images found.</p>}
                </div>
            </div>
        </div>}
    </div>;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
