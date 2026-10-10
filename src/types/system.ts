export type MetricSeries = {
    name: string;
    type: string;
    unit: string | null;
    tags: Record<string, string>;
    measurements: Record<string, number>;
};

export type SystemSnapshot = {
    runtime?: Record<string, number | string | boolean>;
    series?: MetricSeries[];
    collectedAt?: string;
    measurementCount?: number;
    [key: string]: unknown;
};
