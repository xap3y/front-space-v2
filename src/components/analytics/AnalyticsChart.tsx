"use client";

import ReactECharts from "echarts-for-react";
import type {EChartsOption} from "echarts";

type Props = {
    option: EChartsOption;
    height?: number;
    className?: string;
};

export default function AnalyticsChart({option, height = 360, className = ""}: Props) {
    return (
        <ReactECharts
            option={option}
            notMerge
            lazyUpdate
            opts={{renderer: "canvas"}}
            className={className}
            style={{width: "100%", height}}
        />
    );
}
