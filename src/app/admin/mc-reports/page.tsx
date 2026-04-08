
import type { DefaultResponse, MinecraftServerReports } from "@/types/core";
import {getTranscriptUsers} from "@/lib/apiGetters";
import McReportsAdmin from "./client";

export default async function Page() {
    const res: DefaultResponse = await getTranscriptUsers();

    const metrics = (res?.data ?? {}) as MinecraftServerReports[];

    return <McReportsAdmin initialData={metrics} initialError={res?.error ? String(res?.message ?? "") : ""} />;
}