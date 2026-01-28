"use client";

import dynamic from 'next/dynamic'
import { useState } from "react";
import { FaFilter } from "react-icons/fa6";
import { getImageCountStatsOnDate } from "@/lib/apiGetters";
import {DatePickerComp} from "@/components/DatePickerComp";
import {DiscordConnection} from "@/types/discord";

const DateChartECharts = dynamic(() => import("@/components/DateChartECharts"), {
    ssr: false,
    loading: () => <div className="box-primary p-4 text-sm text-gray-400">Loading chart…</div>,
});

type Props = {
    initialStats: any;
    initialFrom: Date;
    initialTo: Date;
    apiKey: string;
}

export default function StatsClient({ initialStats, initialFrom, initialTo, apiKey }: Props) {
    const [data, setData] = useState(() => normalize(initialStats));
    const [range, setRange] = useState({ from: new Date(initialFrom), to: new Date(initialTo) });

    const update = async (from: Date, to: Date) => {
        setRange({ from, to });
        const stats = await getImageCountStatsOnDate(
            from.toISOString().split("T")[0],
            to.toISOString().split("T")[0],
            apiKey
        );
        setData(normalize(stats));
    };

    return (
        <div className="box-primary p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <p className="text-2xl md:text-3xl font-bold">Stats</p>
                <div className="flex items-center gap-3 sm:gap-5 py-2 px-3 sm:px-5 bg-black/40 rounded-full border border-white/10">
                    <div className="flex items-center text-base">
                        <FaFilter />
                        <span className="ml-2">Filter by</span>
                    </div>
                    <DatePickerComp onDateChangeAction={update} />
                </div>
            </div>

            <div className="mt-4 rounded-xl" style={{ height: "320px" }}>
                <DateChartECharts
                    data={{
                        labels: data.labels,
                        datasets: [
                            { label: "Images Uploaded", data: data.images, borderColor: "#ef4444", fill: true },
                            { label: "Pastes Created", data: data.pastes, borderColor: "#f59e0b", fill: false },
                            { label: "URL Shortened", data: data.urls, borderColor: "#22d3ee", fill: false },
                        ],
                    }}
                />
            </div>
        </div>
    );
}

function normalize(stats: any) {
    const arrImages = stats.message.imagesPerDay ?? [];
    const arrPastes = stats.message.pastesPerDay ?? [];
    const arrUrls = stats.message.urlsPerDay ?? [];
    return {
        labels: arrImages.map((p: any) => p.first),
        images: arrImages.map((p: any) => p.second),
        pastes: arrPastes.map((p: any) => p.second),
        urls: arrUrls.map((p: any) => p.second),
    };
}