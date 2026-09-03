"use client";

import Link from "next/link";
import {FaArrowRight, FaArrowsRotate, FaEnvelope, FaGlobe, FaImage, FaLocationDot, FaScissors, FaVideo} from "react-icons/fa6";

const tools = [
    {title: "Image studio", description: "Crop visually, resize, compress, convert, retouch, watermark, and clean image metadata.", href: "/tools/image", icon: <FaImage className="h-6 w-6"/>, details: "12 image operations"},
    {title: "Image converter", description: "Convert common images plus HEIC, HEIF, JXL, APNG, EPS, PDF, PSD, and SVG files.", href: "/tools/image-converter", icon: <FaArrowsRotate className="h-6 w-6"/>, details: "15 output formats"},
    {title: "Video studio", description: "Trim on a timeline, compress, convert, resize, extract audio, create GIFs, and more.", href: "/tools/video", icon: <FaVideo className="h-6 w-6"/>, details: "15 video operations"},
    {title: "DNS & domain lookup", description: "Inspect DNS records and public RDAP registration information for a domain.", href: "/tools/dns-lookup", icon: <FaGlobe className="h-6 w-6"/>, details: "19 DNS record types"},
    {title: "Email health", description: "Check MX, SPF, DMARC, DKIM, DNSSEC, MTA-STS, TLS reporting, and BIMI.", href: "/tools/email-health", icon: <FaEnvelope className="h-6 w-6"/>, details: "8 policy checks"},
    {title: "IP geolocation", description: "Compare approximate location and network information from nine free providers.", href: "/tools/ip-geo", icon: <FaLocationDot className="h-6 w-6"/>, details: "9 independent sources"},
];

export default function ToolsPage() {
    return (
        <div className="mx-auto min-h-full max-w-6xl px-1 py-4 sm:px-4 sm:py-8">
            <header className="mb-8 text-center sm:mb-10">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"><FaScissors className="h-5 w-5"/></div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Media tools</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">Edit images and videos with focused controls, live previews, and downloadable results.</p>
            </header>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tools.map(tool => (
                    <Link key={tool.href} href={tool.href} className="group box-primary flex min-h-56 flex-col rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-black/30">
                        <div className="mb-5 flex items-start justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-black/30 text-emerald-300 transition group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">{tool.icon}</div>
                            <FaArrowRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-1 group-hover:text-emerald-300"/>
                        </div>
                        <h2 className="text-xl font-semibold text-white transition group-hover:text-emerald-200">{tool.title}</h2>
                        <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{tool.description}</p>
                        <div className="mt-5 border-t border-zinc-800 pt-4 font-mono text-[11px] uppercase tracking-wider text-zinc-500">{tool.details}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
