import SystemPageClient from "@/app/admin/system/client";
import type { DefaultResponse } from "@/types/core";
import {getSystemMetrics} from "@/lib/apiGetters";

export default async function Page() {
    const res: DefaultResponse = await getSystemMetrics();

    const metrics = (res?.data ?? {}) as Record<string, number>;

    return <SystemPageClient initialMetrics={metrics} initialError={res?.error ? String(res?.message ?? "") : ""} />;
}