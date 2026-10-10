import SystemPageClient from "@/app/admin/system/client";
import type { DefaultResponse } from "@/types/core";
import {getSystemMetrics} from "@/lib/apiGetters";
import type {SystemSnapshot} from "@/types/system";

export const dynamic = "force-dynamic";

export default async function Page() {
    const res: DefaultResponse = await getSystemMetrics();

    const metrics = (res?.data ?? {}) as SystemSnapshot;

    return <SystemPageClient initialMetrics={metrics} initialError={res?.error ? String(res?.message ?? "") : ""} />;
}
