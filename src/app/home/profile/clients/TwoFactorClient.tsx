"use client";

import {useEffect, useState} from "react";
import QRCode from "qrcode";
import {FaCopy, FaDownload, FaKey, FaShieldHalved, FaXmark} from "react-icons/fa6";
import {getApiUrl} from "@/lib/core";
import {responseErrorMessage} from "@/lib/apiError";
import {errorToast, okToast} from "@/lib/client";

type Status = {enabled: boolean; enabledAt?: string; backupCodesRemaining: number};
type Setup = {secret: string; otpauthUri: string};

export default function TwoFactorClient({apiKey}: {apiKey: string}) {
    const [status, setStatus] = useState<Status | null>(null);
    const [setup, setSetup] = useState<Setup | null>(null);
    const [qr, setQr] = useState("");
    const [code, setCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [action, setAction] = useState<"disable" | "regenerate" | null>(null);

    const request = async (path: string, method = "GET", body?: unknown) => {
        const response = await fetch(getApiUrl() + path, {method, headers: {"x-api-key": apiKey, ...(body ? {"Content-Type": "application/json"} : {})}, body: body ? JSON.stringify(body) : undefined});
        if (!response.ok) throw new Error(await responseErrorMessage(response, "2FA request failed"));
        return response.json();
    };

    const load = async () => { try { const data = await request("/v1/user/me/2fa"); setStatus(data.message); } catch (e) { errorToast(e instanceof Error ? e.message : "Could not load 2FA status"); } };
    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const begin = async () => {
        setBusy(true);
        try { const data = await request("/v1/user/me/2fa/setup", "POST"); setSetup(data.message); setQr(await QRCode.toDataURL(data.message.otpauthUri, {width: 240, margin: 2, color: {dark: "#09090b", light: "#ffffff"}})); setCode(""); }
        catch (e) { errorToast(e instanceof Error ? e.message : "Could not start 2FA setup"); } finally { setBusy(false); }
    };

    const confirm = async () => {
        if (!/^\d{6}$/.test(code)) return errorToast("Enter the 6-digit code from your authenticator app");
        setBusy(true);
        try { const data = await request("/v1/user/me/2fa/confirm", "POST", {code}); setBackupCodes(data.message.backupCodes); setSetup(null); setCode(""); await load(); okToast("Two-factor authentication enabled"); }
        catch (e) { errorToast(e instanceof Error ? e.message : "Invalid authentication code"); } finally { setBusy(false); }
    };

    const finishAction = async () => {
        if (!code.trim()) return errorToast("Enter an authentication or backup code");
        setBusy(true);
        try {
            if (action === "disable") { await request("/v1/user/me/2fa/disable", "POST", {code}); okToast("Two-factor authentication disabled"); }
            else { const data = await request("/v1/user/me/2fa/backup-codes", "POST", {code}); setBackupCodes(data.message.backupCodes); okToast("New backup codes created"); }
            setAction(null); setCode(""); await load();
        } catch (e) { errorToast(e instanceof Error ? e.message : "2FA request failed"); } finally { setBusy(false); }
    };

    const download = () => {
        const text = `Space two-factor authentication backup codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join("\n")}\n\nEach code can be used once. Store these codes securely.`;
        const url = URL.createObjectURL(new Blob([text], {type: "text/plain"})); const a = document.createElement("a"); a.href = url; a.download = "space-2fa-backup-codes.txt"; a.click(); URL.revokeObjectURL(url);
    };

    return <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${status?.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}><FaShieldHalved /></span><div><h2 className="font-semibold">Two-factor authentication</h2><p className="text-xs text-zinc-500">Protect password logins with an authenticator app</p></div></div>
            {!status ? <span className="text-xs text-zinc-500">Loading…</span> : status.enabled ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">Enabled</span> : <button onClick={begin} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">Enable 2FA</button>}
        </div>
        {status?.enabled && <div className="mt-5 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-zinc-300">{status.backupCodesRemaining} backup codes remaining</p><p className="text-xs text-zinc-600">Each recovery code works only once.</p></div><div className="flex gap-2"><button onClick={() => {setAction("regenerate"); setCode("")}} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:bg-white/5">Regenerate codes</button><button onClick={() => {setAction("disable"); setCode("")}} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20">Disable</button></div></div>}

        {setup && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#101014] p-5 shadow-2xl"><div className="flex justify-between"><div><h2 className="text-lg font-semibold">Set up authenticator</h2><p className="text-xs text-zinc-500">Scan the QR code, then enter the generated code.</p></div><button onClick={() => setSetup(null)}><FaXmark /></button></div><div className="mt-5 flex flex-col items-center gap-4">{qr && <img src={qr} alt="Authenticator QR code" className="h-52 w-52 rounded-xl bg-white p-2" />}<div className="w-full"><p className="mb-1 text-xs text-zinc-500">Manual setup key</p><button onClick={() => {navigator.clipboard.writeText(setup.secret); okToast("Secret copied")}} className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-black/30 px-3 py-2 font-mono text-sm tracking-wider text-zinc-200"><span className="break-all text-left">{setup.secret}</span><FaCopy className="shrink-0" /></button></div><input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" className="w-full rounded-lg border border-zinc-700 bg-black/30 px-4 py-3 text-center font-mono text-xl tracking-[.5em] outline-none focus:border-blue-500" /><button onClick={confirm} disabled={busy || code.length !== 6} className="w-full rounded-lg bg-blue-600 py-3 font-semibold disabled:opacity-40">{busy ? "Verifying…" : "Verify and enable"}</button></div></div></div>}

        {backupCodes.length > 0 && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#101014] p-5"><div className="flex items-center gap-3"><FaKey className="text-amber-400" /><div><h2 className="font-semibold">Save your backup codes</h2><p className="text-xs text-zinc-500">They will not be shown again.</p></div></div><div className="my-5 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-4 font-mono text-sm">{backupCodes.map(c => <span key={c}>{c}</span>)}</div><div className="flex gap-2"><button onClick={download} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 py-2 text-sm"><FaDownload />Download .txt</button><button onClick={() => setBackupCodes([])} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold">I saved them</button></div></div></div>}

        {action && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-[#101014] p-5"><h2 className="font-semibold">{action === "disable" ? "Disable 2FA" : "Regenerate backup codes"}</h2><p className="mt-1 text-xs text-zinc-500">Enter a current authenticator code{action === "disable" ? " or backup code" : ""} to continue.</p><input value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 11))} placeholder="Authentication code" className="mt-4 w-full rounded-lg border border-zinc-700 bg-black/30 px-3 py-2 font-mono outline-none focus:border-blue-500" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setAction(null)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">Cancel</button><button onClick={finishAction} disabled={busy} className={`rounded-lg px-3 py-2 text-sm font-semibold ${action === "disable" ? "bg-red-600" : "bg-blue-600"}`}>{busy ? "Working…" : "Continue"}</button></div></div></div>}
    </div>;
}
