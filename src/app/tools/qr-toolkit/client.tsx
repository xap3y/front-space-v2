"use client";

import {useState} from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {FaDownload, FaQrcode, FaWandMagicSparkles} from "react-icons/fa6";

export default function QrToolkitClient() {
    const [value, setValue] = useState(""); const [image, setImage] = useState(""); const [decoded, setDecoded] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
    const generate = async () => { if (!value || value.length > 4096) return; setLoading(true); setError(""); try { setImage(await QRCode.toDataURL(value, {width: 720, margin: 2, errorCorrectionLevel: "H"})); } catch { setError("Could not generate that QR code."); } finally { setLoading(false); } };
    const scan = async (file?: File) => {
        if (!file) return; if (file.size > 10 * 1024 * 1024) { setError("Image limit is 10 MB."); return; }
        setLoading(true); setDecoded(""); setError("");
        try {
            const bitmap = await createImageBitmap(file);
            if (bitmap.width * bitmap.height > 20_000_000) { bitmap.close(); throw new Error("Image dimensions are too large to scan safely."); }
            const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
            const context = canvas.getContext("2d", {willReadFrequently: true}); if (!context) throw new Error("Could not read this image.");
            context.drawImage(bitmap, 0, 0); bitmap.close();
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(pixels.data, pixels.width, pixels.height, {inversionAttempts: "attemptBoth"});
            if (!result) throw new Error("No QR code was found in this image."); setDecoded(result.data);
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not scan this QR code."); }
        finally { setLoading(false); }
    };
    return <div className="mx-auto max-w-6xl pb-16"><header className="mb-5"><div className="flex items-center gap-3"><FaQrcode className="text-xl text-violet-400"/><h1 className="text-2xl font-bold">QR toolkit</h1></div><p className="mt-1 text-sm text-zinc-500">Generate high-quality QR codes or scan one from an image.</p></header>{loading && <div className="mb-3 h-16 animate-pulse rounded-xl bg-zinc-900"/>}<div className="grid gap-4 lg:grid-cols-2"><section className="box-primary rounded-xl p-4"><h2 className="mb-3 text-sm font-semibold">Generate</h2><MainStringInput multiline rows={7} value={value} onChange={setValue} placeholder="Text, URL, Wi-Fi details…" className="border-zinc-800 bg-zinc-950"/><HoverDiv type="SAVE" icon={<FaWandMagicSparkles/>} onClick={generate} disabled={!value || loading} className="mt-3 px-4 py-2 text-sm">Generate QR</HoverDiv>{image && <div className="mt-4 rounded-xl border border-zinc-800 bg-white p-3"><img src={image} alt="Generated QR code" className="mx-auto max-h-72"/></div>}{image && <a href={image} download="qr-code.png"><HoverDiv type="INFO" icon={<FaDownload/>} className="mt-2 px-4 py-2 text-sm">Download PNG</HoverDiv></a>}</section><section className="box-primary rounded-xl p-4"><h2 className="mb-3 text-sm font-semibold">Scan image</h2><label className="block cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-8 text-center text-sm text-zinc-500 hover:border-zinc-500"><input type="file" accept="image/*" className="hidden" onChange={event => void scan(event.target.files?.[0])}/>Choose QR image</label>{decoded && <div className="mt-4 break-all rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3 font-mono text-xs text-emerald-300">{decoded}</div>}</section></div>{error && <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>}</div>;
}
