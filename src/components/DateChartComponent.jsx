/* eslint-disable react/prop-types */
"use client";

import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    Decimation,
} from "chart.js";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Decimation);

// Vertical crosshair plugin
const CrosshairPlugin = {
    id: "crosshairPlugin",
    afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chart.tooltip || !chart.tooltip.getActiveElements) return;
        const active = chart.tooltip.getActiveElements();
        if (!active || !active.length) return;
        const x = active[0].element.x;

        ctx.save();
        ctx.strokeStyle = "rgba(148,163,184,0.45)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
    },
};
Chart.register(CrosshairPlugin);

const NAMED_COLORS = {
    red: "#ef4444",
    orange: "#f59e0b",
    cyan: "#06b6d4",
    blue: "#3b82f6",
    green: "#22c55e",
    purple: "#a855f7",
    pink: "#ec4899",
    yellow: "#eab308",
    lime: "#84cc16",
    teal: "#14b8a6",
    sky: "#0ea5e9",
    indigo: "#6366f1",
    slate: "#94a3b8",
};

function toRgb(color) {
    if (typeof color === "string" && color.startsWith("#")) {
        const c = color.replace("#", "");
        const hex = c.length === 3 ? c.split("").map((v) => v + v).join("") : c;
        const bigint = parseInt(hex, 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }
    const rgbMatch = typeof color === "string" && color.match(/^rgba?\((\d+),\s?(\d+),\s?(\d+)/i);
    if (rgbMatch) return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
    if (typeof color === "string" && NAMED_COLORS[color]) return toRgb(NAMED_COLORS[color]);
    return { r: 99, g: 102, b: 241 }; // indigo fallback
}

function gradientFill(ctx, chartArea, color) {
    const { r, g, b } = toRgb(color);
    const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.28)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.03)`);
    return grad;
}

export function DateChartNew({ data }) {
    const processedData = useMemo(() => {
        const labels = Array.isArray(data?.labels) ? [...data.labels] : [];
        const datasets = Array.isArray(data?.datasets) ? data.datasets : [];

        return {
            labels,
            datasets: datasets.map((ds) => {
                const baseColor = ds.borderColor || "#6366f1";
                return {
                    ...ds,
                    borderColor: baseColor,
                    borderWidth: 2,
                    // Sharp lines: no smoothing
                    tension: 0,
                    cubicInterpolationMode: "default",
                    // Optional: set ds.stepped = true in your data to get step-lines
                    // stepped: ds.stepped ?? false,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    pointHoverBorderWidth: 2,
                    fill: ds.fill ?? true,
                    backgroundColor: (context) => {
                        const { chart } = context;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return `rgba(99,102,241,0.15)`;
                        return gradientFill(ctx, chartArea, baseColor);
                    },
                };
            }),
        };
    }, [data]);

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false, axis: "x" },
            plugins: {
                decimation: { enabled: true, algorithm: "lttb", samples: 200 },
                legend: {
                    display: true,
                    position: "bottom",
                    align: "start",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "line",
                        boxWidth: 10,
                        color: "#cbd5e1",
                        padding: 16,
                        font: { size: 12 },
                    },
                },
                tooltip: {
                    enabled: true,
                    intersect: false,
                    mode: "index",
                    backgroundColor: "rgba(17,24,39,0.95)",
                    borderColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        title: (items) => (items?.length ? String(items[0].label ?? "") : ""),
                        label: (ctx) => `${ctx.dataset?.label ?? ""}: ${ctx.parsed?.y ?? 0}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { color: "rgba(255,255,255,0.06)", drawBorder: false },
                    ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true, padding: 6 },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255,255,255,0.06)", drawBorder: false },
                    ticks: {
                        color: "#9ca3af",
                        precision: 0,
                        stepSize: 1,
                        callback: (value) => {
                            const n = Number(value);
                            return Number.isFinite(n) ? n.toFixed(0) : value;
                        },
                    },
                },
            },
        }),
        []
    );

    return (
        <div className="w-full">
            <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96">
                <Line data={processedData} options={options} />
            </div>
        </div>
    );
}