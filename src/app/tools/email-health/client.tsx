"use client";

import {useState} from "react";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {useUser} from "@/hooks/useUser";
import {getApiUrl} from "@/lib/core";
import {FaArrowRotateRight, FaCheck, FaEnvelope, FaMagnifyingGlass, FaTriangleExclamation, FaXmark} from "react-icons/fa6";

type Check = {name: string; status: "pass" | "warning" | "fail"; detail: string};
type TextRecord = {host: string; value: string};
type Health = {domain: string; checks: Check[]; checkedSelectors: string[]; mx: string[]; spf: string[]; dmarc: string[]; dkim: TextRecord[]; bimi: TextRecord[]; mtaSts: string[]; tlsReporting: string[]};

export default function EmailHealthClient() {
    const {user} = useUser();
    const [domain, setDomain] = useState("");
    const [selectors, setSelectors] = useState("");
    const [result, setResult] = useState<Health | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const check = async () => {
        if (!domain.trim() || !user?.apiKey || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const response = await fetch(`${getApiUrl()}/v1/tools/network/email-health?domain=${encodeURIComponent(domain.trim())}&selectors=${encodeURIComponent(selectors.trim())}`, {cache: "no-store", credentials: "include", headers: {"X-API-Key": user.apiKey, "Cache-Control": "no-cache"}});
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "Email health check failed");
            setResult(data);
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Email health check failed"); }
        finally { setLoading(false); }
    };

    const score = result ? Math.round(result.checks.reduce((total, item) => total + (item.status === "pass" ? 100 : item.status === "warning" ? 50 : 0), 0) / result.checks.length) : 0;
    const scoreTone = score >= 80 ? "text-emerald-400 border-emerald-500/40" : score >= 50 ? "text-amber-400 border-amber-500/40" : "text-red-400 border-red-500/40";

    return <div className="mx-auto max-w-6xl pb-16 xl:pb-0">
        <header className="mb-5"><div className="flex items-center gap-3"><FaEnvelope className="text-xl text-emerald-400"/><h1 className="text-2xl font-bold text-white">Email health check</h1></div><p className="mt-1 text-sm text-zinc-500">Check authentication, delivery, transport security, and brand indicator policies.</p></header>
        <div className="box-primary rounded-xl p-4 sm:p-5"><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Email domain</label><div className="flex flex-col gap-2 sm:flex-row"><MainStringInput type="text" value={domain} onChange={setDomain} onKeyDown={event => {if (event.key === "Enter") void check();}} placeholder="example.com" className="min-w-0 flex-1 rounded-lg border-zinc-800 bg-black/25" inputClassName="py-2.5 font-mono text-sm"/><HoverDiv type="SAVE" icon={loading ? <FaArrowRotateRight className="animate-spin"/> : <FaMagnifyingGlass/>} onClick={check} disabled={!domain.trim() || loading} className="px-5 py-2.5 text-sm font-semibold">{loading ? "Checking…" : "Check health"}</HoverDiv></div><div className="mt-4 max-w-sm"><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Custom DKIM selectors · optional</label><MainStringInput type="text" value={selectors} onChange={setSelectors} onKeyDown={event => {if (event.key === "Enter") void check();}} placeholder="selector1, google" className="rounded-lg border-zinc-800 bg-black/20" inputClassName="py-2 font-mono text-xs"/><p className="mt-1.5 text-[9px] leading-4 text-zinc-700">Up to 10, separated by commas. Do not include ._domainkey.</p></div></div>
        {error && <div className="mt-3 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
        {result && <><section className="box-primary mt-4 flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center"><div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 ${scoreTone}`}><strong className="text-3xl leading-none">{score}</strong><span className="mt-1 text-[9px] uppercase tracking-wider">of 100</span></div><div><h2 className="text-base font-semibold text-white">{score >= 80 ? "Healthy configuration" : score >= 50 ? "Needs attention" : "Important issues found"}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">Passing checks receive full credit, warnings receive half credit, and failed checks receive none.</p><div className="mt-2 flex gap-3 text-[10px]"><span className="text-emerald-400">{result.checks.filter(item => item.status === "pass").length} passed</span><span className="text-amber-400">{result.checks.filter(item => item.status === "warning").length} warnings</span><span className="text-red-400">{result.checks.filter(item => item.status === "fail").length} failed</span></div></div></section><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{result.checks.map(item => <CheckCard key={item.name} item={item} records={recordsFor(result, item.name)}/>)}</div><p className="mt-3 break-all font-mono text-[9px] text-zinc-700">DKIM selectors checked: {result.checkedSelectors.join(", ")}</p></>}
        <p className="mt-4 text-[10px] leading-4 text-zinc-600">DKIM selectors cannot be enumerated by DNS. Common names are checked; custom selectors may exist without appearing here. BIMI is optional.</p>
    </div>;
}

function CheckCard({item, records}: {item: Check; records: string[]}) {
    const tone = item.status === "pass" ? "text-emerald-400 border-emerald-900/50" : item.status === "warning" ? "text-amber-400 border-amber-900/50" : "text-red-400 border-red-900/50";
    const Icon = item.status === "pass" ? FaCheck : item.status === "warning" ? FaTriangleExclamation : FaXmark;
    return <article className={`box-primary rounded-xl border p-4 ${tone}`}><div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/10"><Icon className="h-3 w-3"/></span><h2 className="text-sm font-semibold text-zinc-100">{item.name}</h2></div><p className="text-xs leading-5 text-zinc-400">{item.detail}</p>{records.length > 0 && <div className="mt-3 space-y-1 border-t border-zinc-800 pt-3">{records.map((record, index) => <p key={`${record}-${index}`} className="break-all font-mono text-[10px] leading-4 text-zinc-600">{record}</p>)}</div>}</article>;
}

function recordsFor(result: Health, name: string): string[] {
    if (name === "MX") return result.mx;
    if (name === "SPF") return result.spf;
    if (name === "DMARC") return result.dmarc;
    if (name === "DKIM") return result.dkim.map(item => `${item.host}: ${item.value}`);
    if (name === "BIMI") return result.bimi.map(item => `${item.host}: ${item.value}`);
    if (name === "MTA-STS") return result.mtaSts;
    if (name === "TLS reporting") return result.tlsReporting;
    return [];
}
