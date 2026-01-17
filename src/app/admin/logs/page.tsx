import LogsPage from "@/app/admin/logs/client";
import {DefaultResponse} from "@/types/core";
import {AuditLog} from "@/types/auditLog";
import {getAuditLogs} from "@/lib/apiGetters";
import LogsClient from "@/app/admin/logs/client";

export default async function LogsPage({
                                           searchParams,
                                       }: {
    searchParams?: Promise<Record<string, string | undefined>>;
}) {
    const sp = (await searchParams) ?? {};

    const res: DefaultResponse = await getAuditLogs();
    const logs = (res.data ?? []) as AuditLog[];

    return (
        <LogsClient
            initialLogs={logs}
            initialError={res.error ? String(res.message ?? "Failed to load logs") : ""}
            fetchedAt={res.timestamp ?? ""}
            totalCount={res.count ?? logs.length}
            initialQuery={{
                q: sp.q ?? "",
                type: sp.type ?? "",
                user: sp.user ?? "",
                page: sp.page ? Number(sp.page) || 1 : 1,
            }}
        />
    );
}