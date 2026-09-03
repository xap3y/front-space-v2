"use client";

import Image from "next/image";
import {useRef, useState} from "react";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {useUser} from "@/hooks/useUser";
import {getApiUrl} from "@/lib/core";
import {FaArrowRotateRight, FaLocationDot, FaMagnifyingGlass} from "react-icons/fa6";

type GeoResult = {provider: string; success: boolean; error?: string; responseMs: number; country?: string; countryCode?: string; region?: string; city?: string; latitude?: number; longitude?: number; timezone?: string; isp?: string};
type ProviderState = {id: string; name: string; status: "loading" | "done"; result?: GeoResult};

const providers = [
    ["ipwhois", "ipwhois.io"], ["country-is", "Country.is"], ["ipapi-co", "ipapi.co"],
    ["db-ip", "DB-IP"], ["ipwhois-app", "ipwhois.app"], ["really-free-geoip", "Really Free GeoIP"],
    ["ip-guide", "IP.Guide"], ["geolocation-db", "Geolocation-DB"], ["ipapi-is", "ipapi.is"],
] as const;

export default function IpGeoClient() {
    const {user} = useUser();
    const [ip, setIp] = useState("");
    const [cards, setCards] = useState<ProviderState[]>([]);
    const [error, setError] = useState("");
    const requestId = useRef(0);

    const lookup = async () => {
        if (!ip.trim() || !user?.apiKey) return;
        const currentRequest = ++requestId.current;
        setError("");
        setCards(providers.map(([id, name]) => ({id, name, status: "loading"})));
        providers.forEach(([providerId]) => void fetchProvider(providerId, currentRequest));
    };

    const fetchProvider = async (providerId: string, currentRequest: number) => {
        try {
            const response = await fetch(`${getApiUrl()}/v1/tools/network/geo/provider?ip=${encodeURIComponent(ip.trim())}&provider=${encodeURIComponent(providerId)}`, {
                cache: "no-store", credentials: "include",
                headers: {"X-API-Key": user!.apiKey, "Cache-Control": "no-cache"},
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "IP lookup failed");
            if (requestId.current === currentRequest) setCards(current => current.map(card => card.id === providerId ? {...card, status: "done", result: data} : card));
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : "Provider unavailable";
            if (requestId.current === currentRequest) setCards(current => current.map(card => card.id === providerId ? {...card, status: "done", result: {provider: card.name, success: false, error: message, responseMs: 0}} : card));
        }
    };

    const loading = cards.some(card => card.status === "loading");
    const successful = cards.filter(card => card.result?.success).length;

    return <div className="mx-auto max-w-6xl pb-16 xl:pb-0">
        <header className="mb-5">
            <div className="flex items-center gap-3"><FaLocationDot className="text-xl text-rose-400"/><h1 className="text-2xl font-bold text-white">IP geolocation</h1></div>
            <p className="mt-1 text-sm text-zinc-500">Compare approximate location and network data from nine independent providers.</p>
        </header>

        <div className="box-primary rounded-xl p-4 sm:p-5">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Public IPv4 or IPv6 address</label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <MainStringInput type="text" value={ip} onChange={setIp} onKeyDown={event => {if (event.key === "Enter") void lookup();}} placeholder="8.8.8.8" className="min-w-0 flex-1 rounded-lg border-zinc-800 bg-black/25" inputClassName="py-2.5 font-mono text-sm"/>
                <HoverDiv type="INFO" icon={loading ? <FaArrowRotateRight className="animate-spin"/> : <FaMagnifyingGlass/>} onClick={lookup} disabled={!ip.trim()} className="px-5 py-2.5 text-sm font-semibold">{loading ? "Checking 9 sources…" : "Locate IP"}</HoverDiv>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-zinc-600">Only public IP addresses are accepted. The address is sent to the listed geolocation providers to obtain their results.</p>
        </div>

        {error && <div className="mt-3 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
        {cards.length > 0 && <div className="mt-4">
            <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-sm font-semibold text-white">Provider results</h2><span className="text-[10px] text-zinc-500">{successful} of {cards.length} responded</span></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards.map(card => <GeoCard key={card.id} card={card}/>) }
            </div>
        </div>}
    </div>;
}

function GeoCard({card}: {card: ProviderState}) {
    if (card.status === "loading") return <article className="box-primary animate-pulse rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between"><span className="h-4 w-28 rounded bg-zinc-800"/><span className="h-4 w-12 rounded bg-zinc-800"/></div>
        <div className="space-y-3">{["w-4/5", "w-3/5", "w-2/3", "w-full"].map(width => <div key={width} className={`h-3 rounded bg-zinc-900 ${width}`}/>)}</div>
    </article>;
    const result = card.result!;
    const rawCountryCode = result.countryCode?.toLowerCase();
    const countryCode = rawCountryCode === "uk" ? "gb" : rawCountryCode;
    return <article className={`box-primary rounded-xl p-4 ${result.success ? "" : "opacity-70"}`}>
        <div className="mb-3 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2">{countryCode && <Image src={`/countries_svg/${countryCode}.svg`} alt={`${result.country || countryCode} flag`} width={20} height={14} className="h-3.5 w-5 rounded-sm object-cover"/>}<h3 className="truncate text-sm font-semibold text-white">{result.provider}</h3></div><span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] ${result.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{result.success ? `${result.responseMs} ms` : "failed"}</span></div>
        {result.success ? <dl className="space-y-2 text-xs">
            <Row label="Location" value={[result.city, result.region, result.countryCode || result.country].filter(Boolean).join(", ")}/>
            <Row label="Coordinates" value={result.latitude != null && result.longitude != null ? `${result.latitude}, ${result.longitude}` : undefined}/>
            <Row label="Timezone" value={result.timezone}/>
            <Row label="Network" value={result.isp}/>
        </dl> : <p className="text-xs text-red-300/80">{result.error || "Provider unavailable"}</p>}
    </article>;
}

function Row({label, value}: {label: string; value?: string}) {
    return <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2"><dt className="text-zinc-600">{label}</dt><dd className="break-words text-zinc-300">{value || "—"}</dd></div>;
}
