'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

type Dataset = {
    label: string;
    data: number[];
    borderColor?: string;
    fill?: boolean;
};

type ChartData = {
    labels: string[];
    datasets: Dataset[];
};

export default function DateChartECharts({ data }: { data: ChartData }) {
    const option = useMemo(() => {
        const colors = data.datasets.map(ds => ds.borderColor || '#4ade80');

        return {
            backgroundColor: 'transparent',
            color: colors,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(12, 12, 12, 0.92)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
                textStyle: {
                    color: '#e5e7eb',
                },
                axisPointer: {
                    type: 'cross',
                    label: {
                        color: '#111827',
                        backgroundColor: '#e5e7eb'
                    }
                }
            },
            grid: {
                left: 12,
                right: 12,
                top: 20,
                bottom: 24,
                containLabel: true,
            },
            xAxis: {
                type: 'category',
                data: data.labels,
                boundaryGap: false,
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.25)' } },
                axisLabel: {
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 10,
                    interval: 'auto',
                    hideOverlap: true,
                },
                axisTick: { show: false },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                axisLine: { show: false },
                axisLabel: { color: 'rgba(255,255,255,0.8)' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
            },
            series: data.datasets.map((ds) => ({
                name: ds.label,
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    width: 2,
                    color: ds.borderColor || '#4ade80',
                },
                areaStyle: ds.fill
                    ? { opacity: 0.15 }
                    : undefined,
                emphasis: { focus: 'series' },
                data: ds.data
            })),
        };
    }, [data]);

    return (
        <ReactECharts
            option={option}
            notMerge
            lazyUpdate
            style={{ width: '100%', height: '100%' }}
        />
    );
}