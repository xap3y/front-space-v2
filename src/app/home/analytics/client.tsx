"use client";

import dynamic from "next/dynamic";
import {useMemo, useState} from "react";
import type {EChartsOption} from "echarts";
import {
    FaCalendarDays,
    FaChartLine,
    FaDatabase,
    FaEnvelope,
    FaEye,
    FaImages,
    FaLink,
    FaPaste,
    FaRotateRight,
} from "react-icons/fa6";
import {getUserAnalytics} from "@/lib/apiGetters";
import type {AnalyticsCategory, UserAnalytics} from "@/types/analytics";

const AnalyticsChart = dynamic(() => import("@/components/analytics/AnalyticsChart"), {
    ssr: false,
    loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-white/[0.025]" />,
});

type Preset = "7d" | "1m" | "3m" | "6m" | "1y" | "all" | "custom";

type Props = {
    apiKey: string;
    accountCreatedAt: string | null;
    initialData: UserAnalytics | null;
    initialFrom: string;
    initialTo: string;
};

const fallbackAllFrom = "2025-01-01";

const colors = {
    images: "#34d399",
    pastes: "#f59e0b",
    urls: "#38bdf8",
    mails: "#a78bfa",
    storage: "#2dd4bf",
};

const axis = {
    axisLine: {lineStyle: {color: "rgba(148,163,184,.25)"}},
    axisTick: {show: false},
    axisLabel: {color: "#94a3b8", fontSize: 11, hideOverlap: true},
};

function formatBytes(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const amount = value / 1024 ** unit;
    return `${amount.toFixed(unit === 0 ? 0 : amount >= 10 ? 1 : 2)} ${units[unit]}`;
}

function shortDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {month: "short", day: "numeric"}).format(new Date(`${value}T00:00:00`));
}

function accountCreatedDate(value: string | null) {
    if (!value) return fallbackAllFrom;

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return fallbackAllFrom;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    const isValid = parsed.getUTCFullYear() === year
        && parsed.getUTCMonth() === month - 1
        && parsed.getUTCDate() === day;

    return isValid ? `${match[1]}-${match[2]}-${match[3]}` : fallbackAllFrom;
}

function presetDates(preset: Preset, accountCreatedAt: string | null) {
    const to = new Date();
    const from = new Date(to);
    if (preset === "7d") from.setDate(from.getDate() - 7);
    if (preset === "1m") from.setMonth(from.getMonth() - 1);
    if (preset === "3m") from.setMonth(from.getMonth() - 3);
    if (preset === "6m") from.setMonth(from.getMonth() - 6);
    if (preset === "1y") from.setFullYear(from.getFullYear() - 1);
    return {
        from: preset === "all" ? accountCreatedDate(accountCreatedAt) : from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

function breakdownOption(data: AnalyticsCategory[], centerLabel: string): EChartsOption {
    const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
    return {
        color: ["#34d399", "#38bdf8", "#a78bfa", "#f59e0b", "#fb7185", "#2dd4bf"],
        tooltip: {
            trigger: "item",
            backgroundColor: "rgba(8,10,18,.96)",
            borderColor: "rgba(148,163,184,.22)",
            textStyle: {color: "#e5e7eb"},
        },
        legend: {
            bottom: 0,
            type: "scroll",
            textStyle: {color: "#94a3b8", fontSize: 10},
            pageTextStyle: {color: "#94a3b8"},
        },
        graphic: [{
            type: "text",
            left: "center",
            top: "39%",
            style: {
                text: `${total}\n${centerLabel}`,
                align: "center",
                fill: "#e5e7eb",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 19,
            },
        }],
        series: [{
            type: "pie",
            radius: ["48%", "70%"],
            center: ["50%", "42%"],
            itemStyle: {borderColor: "#101014", borderWidth: 4, borderRadius: 5},
            label: {show: false},
            emphasis: {scale: true, scaleSize: 5},
            data: data.map(item => ({name: item.label, value: item.count})),
        }],
    };
}

function MetricCard({label, value, hint, icon}: {label: string; value: string; hint: string; icon: React.ReactNode}) {
    return (
        <div className="box-primary min-w-0 p-3.5 md:p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-gray-500">{label}</p>
                    <p className="mt-2 truncate text-xl font-semibold text-white md:text-2xl">{value}</p>
                    <p className="mt-1 truncate text-[11px] text-gray-500">{hint}</p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-gray-300">
                    {icon}
                </span>
            </div>
        </div>
    );
}

export default function AnalyticsClient({apiKey, accountCreatedAt, initialData, initialFrom, initialTo}: Props) {
    const [data, setData] = useState<UserAnalytics | null>(initialData);
    const [from, setFrom] = useState(initialFrom);
    const [to, setTo] = useState(initialTo);
    const [preset, setPreset] = useState<Preset>("1m");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialData ? "" : "Analytics could not be loaded.");
    const [updatedAt, setUpdatedAt] = useState(() => new Date());

    const load = async (nextFrom = from, nextTo = to) => {
        if (!nextFrom || !nextTo || nextFrom > nextTo) {
            setError("Choose a valid date range.");
            return;
        }
        setLoading(true);
        setError("");
        const response = await getUserAnalytics(nextFrom, nextTo, apiKey) as UserAnalytics | null;
        if (response) {
            setData(response);
            setUpdatedAt(new Date());
        } else {
            setError("Could not refresh analytics. Please try again.");
        }
        setLoading(false);
    };

    const selectPreset = (next: Preset) => {
        if (next === "custom") {
            setPreset(next);
            return;
        }
        const range = presetDates(next, accountCreatedAt);
        setPreset(next);
        setFrom(range.from);
        setTo(range.to);
        void load(range.from, range.to);
    };

    const activityOption = useMemo<EChartsOption>(() => ({
        animationDuration: 500,
        color: [colors.images, colors.pastes, colors.urls, colors.mails],
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(8,10,18,.96)",
            borderColor: "rgba(148,163,184,.22)",
            textStyle: {color: "#e5e7eb"},
            axisPointer: {type: "cross", lineStyle: {color: "rgba(148,163,184,.35)"}},
        },
        legend: {top: 2, right: 8, textStyle: {color: "#a1a1aa"}, itemWidth: 18, itemHeight: 8},
        toolbox: {
            showTitle: false,
            right: 4,
            top: 28,
            tooltip: {
                show: true,
                position: "top",
                confine: true,
                formatter: "{title}",
                backgroundColor: "rgba(8,10,18,.98)",
                borderColor: "rgba(148,163,184,.22)",
                textStyle: {color: "#e5e7eb", fontSize: 11},
            },
            feature: {dataZoom: {yAxisIndex: "none"}, restore: {}, saveAsImage: {name: "space-activity"}},
            iconStyle: {borderColor: "#94a3b8"},
            emphasis: {iconStyle: {borderColor: "#e5e7eb"}},
        },
        grid: {left: 12, right: 18, top: 58, bottom: 76, containLabel: true},
        xAxis: {
            type: "category",
            boundaryGap: false,
            data: data?.daily.map(point => shortDate(point.date)) ?? [],
            ...axis,
        },
        yAxis: {
            type: "value",
            minInterval: 1,
            ...axis,
            splitLine: {lineStyle: {color: "rgba(148,163,184,.11)"}},
        },
        dataZoom: [
            {type: "inside", start: 0, end: 100, zoomOnMouseWheel: true, moveOnMouseMove: true},
            {
                type: "slider", start: 0, end: 100, height: 26, bottom: 15,
                borderColor: "rgba(148,163,184,.25)", backgroundColor: "rgba(2,6,23,.35)",
                fillerColor: "rgba(52,211,153,.12)", handleStyle: {color: colors.images, borderColor: "#a7f3d0"},
                textStyle: {color: "#64748b"},
            },
        ],
        series: [
            {name: "Images", type: "line", smooth: .28, showSymbol: false, lineStyle: {width: 2.5}, areaStyle: {opacity: .12}, data: data?.daily.map(point => point.images) ?? []},
            {name: "Pastes", type: "line", smooth: .28, showSymbol: false, lineStyle: {width: 2}, data: data?.daily.map(point => point.pastes) ?? []},
            {name: "Short URLs", type: "line", smooth: .28, showSymbol: false, lineStyle: {width: 2}, data: data?.daily.map(point => point.urls) ?? []},
            {name: "Temp mails", type: "line", smooth: .28, showSymbol: false, lineStyle: {width: 2}, data: data?.daily.map(point => point.tempMails) ?? []},
        ],
    }), [data]);

    const storageOption = useMemo<EChartsOption>(() => ({
        color: [colors.storage, "#6366f1"],
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(8,10,18,.96)",
            borderColor: "rgba(148,163,184,.22)",
            textStyle: {color: "#e5e7eb"},
            valueFormatter: (value: unknown) => formatBytes(Number(value)),
        },
        legend: {top: 2, right: 8, textStyle: {color: "#a1a1aa"}},
        grid: {left: 12, right: 15, top: 45, bottom: 67, containLabel: true},
        xAxis: {type: "category", data: data?.daily.map(point => shortDate(point.date)) ?? [], ...axis},
        yAxis: [
            {type: "value", ...axis, axisLabel: {...axis.axisLabel, formatter: (value: number) => formatBytes(value)}, splitLine: {lineStyle: {color: "rgba(148,163,184,.11)"}}},
            {type: "value", show: false},
        ],
        dataZoom: [
            {type: "inside", start: 0, end: 100},
            {type: "slider", start: 0, end: 100, height: 22, bottom: 14, borderColor: "rgba(148,163,184,.2)", fillerColor: "rgba(45,212,191,.13)", textStyle: {color: "#64748b"}},
        ],
        series: [
            {name: "Storage used", type: "line", smooth: true, showSymbol: false, lineStyle: {width: 2.5}, areaStyle: {opacity: .16}, data: data?.daily.map(point => point.storageBytes) ?? []},
            {name: "Added that day", type: "bar", yAxisIndex: 1, barMaxWidth: 12, itemStyle: {opacity: .42, borderRadius: [3, 3, 0, 0]}, data: data?.daily.map(point => point.storageAddedBytes) ?? []},
        ],
    }), [data]);

    const fileTypeOption = useMemo<EChartsOption>(() => ({
        color: ["#34d399", "#38bdf8", "#a78bfa", "#f59e0b", "#fb7185", "#2dd4bf", "#818cf8"],
        tooltip: {
            trigger: "item",
            backgroundColor: "rgba(8,10,18,.96)",
            borderColor: "rgba(148,163,184,.22)",
            textStyle: {color: "#e5e7eb"},
        },
        legend: {type: "scroll", bottom: 0, textStyle: {color: "#94a3b8", fontSize: 10}, pageTextStyle: {color: "#94a3b8"}},
        series: [{
            name: "File types",
            type: "pie",
            radius: ["42%", "70%"],
            center: ["50%", "43%"],
            roseType: "radius",
            itemStyle: {borderColor: "#101014", borderWidth: 4, borderRadius: 6},
            label: {color: "#cbd5e1", fontSize: 10, formatter: "{b}  {c}"},
            labelLine: {lineStyle: {color: "#475569"}},
            data: data?.fileTypes.map(item => ({name: item.label.toUpperCase(), value: item.count})) ?? [],
        }],
    }), [data]);

    const weekdayOption = useMemo<EChartsOption>(() => {
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const values = Array(7).fill(0) as number[];
        for (const point of data?.daily ?? []) {
            const day = new Date(`${point.date}T00:00:00`).getDay();
            values[day] += point.images + point.pastes + point.urls + point.tempMails;
        }
        return {
            color: [colors.images],
            tooltip: {trigger: "axis", backgroundColor: "rgba(8,10,18,.96)", borderColor: "rgba(148,163,184,.22)", textStyle: {color: "#e5e7eb"}},
            grid: {left: 8, right: 8, top: 20, bottom: 16, containLabel: true},
            xAxis: {type: "category", data: weekdays, ...axis},
            yAxis: {type: "value", minInterval: 1, ...axis, splitLine: {lineStyle: {color: "rgba(148,163,184,.1)"}}},
            series: [{type: "bar", data: values, barMaxWidth: 28, itemStyle: {borderRadius: [6, 6, 0, 0], color: colors.images}}],
        };
    }, [data]);

    const activityTotal = data?.daily.reduce((sum, point) => sum + point.images + point.pastes + point.urls + point.tempMails, 0) ?? 0;
    const activeDays = data?.daily.filter(point => point.images + point.pastes + point.urls + point.tempMails > 0).length ?? 0;
    const busiest = data?.daily.reduce((best, point) => {
        const amount = point.images + point.pastes + point.urls + point.tempMails;
        return amount > best.amount ? {date: point.date, amount} : best;
    }, {date: "", amount: 0}) ?? {date: "", amount: 0};

    const presets: {value: Preset; label: string}[] = [
        {value: "7d", label: "7d"}, {value: "1m", label: "1m"}, {value: "3m", label: "3m"},
        {value: "6m", label: "6m"}, {value: "1y", label: "1y"}, {value: "all", label: "All"},
    ];

    return (
        <section className="min-w-0 flex-1 px-3 pb-10 pt-0 md:px-6">
            <div className="mx-auto w-full max-w-[100rem] space-y-4">
                <header className="flex flex-col gap-3 pb-1 pt-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"><FaChartLine /></span>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Analytics</h1>
                                <p className="text-xs text-gray-500 sm:text-sm">Your Space activity, uploads, and storage over time</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Updated {updatedAt.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</p>
                </header>

                <div className="box-primary p-3 md:p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 xl:pb-0">
                            {presets.map(item => (
                                <button key={item.value} onClick={() => selectPreset(item.value)} disabled={loading}
                                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${preset === item.value ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.025] text-gray-400 hover:border-white/20 hover:text-white"}`}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="hidden h-7 w-px bg-white/10 xl:block" />
                        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
                            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-gray-400">
                                <FaCalendarDays className="shrink-0" />
                                <span>From</span>
                                <input type="date" value={from} max={to} onChange={event => {setFrom(event.target.value); setPreset("custom");}}
                                    className="min-w-0 flex-1 bg-transparent text-gray-200 outline-none [color-scheme:dark]" />
                            </label>
                            <span className="hidden text-gray-600 sm:block">→</span>
                            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-gray-400">
                                <span>To</span>
                                <input type="date" value={to} min={from} onChange={event => {setTo(event.target.value); setPreset("custom");}}
                                    className="min-w-0 flex-1 bg-transparent text-gray-200 outline-none [color-scheme:dark]" />
                            </label>
                            <button onClick={() => void load()} disabled={loading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-50">
                                <FaRotateRight className={loading ? "animate-spin" : ""} /> {loading ? "Loading" : "Apply"}
                            </button>
                        </div>
                    </div>
                    {error ? <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">{error}</p> : null}
                </div>

                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
                    <MetricCard label="Images" value={String(data?.summary.images ?? 0)} hint="uploaded in range" icon={<FaImages />} />
                    <MetricCard label="Pastes" value={String(data?.summary.pastes ?? 0)} hint="created in range" icon={<FaPaste />} />
                    <MetricCard label="Short URLs" value={String(data?.summary.urls ?? 0)} hint="links created" icon={<FaLink />} />
                    <MetricCard label="Temp mails" value={String(data?.summary.tempMails ?? 0)} hint="addresses created" icon={<FaEnvelope />} />
                    <MetricCard label="Storage" value={formatBytes(data?.summary.storageBytes ?? 0)} hint={`${formatBytes(data?.summary.storageAddedBytes ?? 0)} added`} icon={<FaDatabase />} />
                    <MetricCard label="URL visits" value={(data?.summary.urlVisits ?? 0).toLocaleString()} hint="across links in range" icon={<FaEye />} />
                </div>

                <div className="box-primary overflow-hidden p-3 md:p-4">
                    <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
                        <div><h2 className="text-base font-semibold text-white">Daily activity</h2><p className="text-xs text-gray-500">Scroll or pinch to zoom · drag the navigator to focus a period</p></div>
                        <div className="flex gap-3 text-[11px] text-gray-500"><span>{activityTotal} events</span><span>{activeDays} active days</span><span>{busiest.amount ? `Peak ${busiest.amount} · ${shortDate(busiest.date)}` : "No peak yet"}</span></div>
                    </div>
                    <AnalyticsChart option={activityOption} height={390} />
                </div>

                <div className="box-primary overflow-hidden p-3 md:p-4">
                    <div className="px-1"><h2 className="text-base font-semibold text-white">Storage used</h2><p className="text-xs text-gray-500">Cumulative retained uploads with daily additions</p></div>
                    <AnalyticsChart option={storageOption} height={340} />
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                    <div className="box-primary p-3 md:p-4 lg:col-span-3">
                        <div className="px-1"><h2 className="text-base font-semibold text-white">Uploaded file types</h2><p className="text-xs text-gray-500">Format mix for the selected period</p></div>
                        <AnalyticsChart option={fileTypeOption} height={330} />
                    </div>
                    <div className="box-primary p-3 md:p-4 lg:col-span-2">
                        <div className="px-1"><h2 className="text-base font-semibold text-white">Activity by weekday</h2><p className="text-xs text-gray-500">When you create the most</p></div>
                        <AnalyticsChart option={weekdayOption} height={330} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="box-primary p-3"><h2 className="px-1 text-sm font-semibold">Upload visibility</h2><AnalyticsChart option={breakdownOption(data?.visibility ?? [], "uploads")} height={260} /></div>
                    <div className="box-primary p-3"><h2 className="px-1 text-sm font-semibold">Storage location</h2><AnalyticsChart option={breakdownOption(data?.storageLocations ?? [], "uploads")} height={260} /></div>
                    <div className="box-primary p-3"><h2 className="px-1 text-sm font-semibold">Paste languages</h2><AnalyticsChart option={breakdownOption(data?.pasteLanguages ?? [], "pastes")} height={260} /></div>
                    <div className="box-primary p-3"><h2 className="px-1 text-sm font-semibold">Temp-mail status</h2><AnalyticsChart option={breakdownOption(data?.mailStatuses ?? [], "addresses")} height={260} /></div>
                </div>
            </div>
        </section>
    );
}
