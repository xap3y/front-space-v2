import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {getUserServer} from "@/app/_server/getUser";
import {getUserAnalytics} from "@/lib/apiGetters";
import AnalyticsClient from "@/app/home/analytics/client";
import type {UserAnalytics} from "@/types/analytics";

export const metadata: Metadata = {
    title: "Space - Analytics",
};

export const dynamic = "force-dynamic";

function dateValue(date: Date) {
    return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
    const user = await getUserServer();
    if (!user) redirect("/login?after=/home/analytics");

    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - 1);
    const initialData = await getUserAnalytics(dateValue(from), dateValue(to), user.apiKey) as UserAnalytics | null;

    return (
        <AnalyticsClient
            apiKey={user.apiKey}
            accountCreatedAt={user.createdAt ?? null}
            initialData={initialData}
            initialFrom={dateValue(from)}
            initialTo={dateValue(to)}
        />
    );
}
