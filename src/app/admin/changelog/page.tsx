import {readFile} from "node:fs/promises";
import {join} from "node:path";
import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {Fragment} from "react";
import {getUserServer} from "@/app/_server/getUser";
import Surface from "@/components/ui/Surface";
import {getApiUrl} from "@/lib/core";
import {canAccessAdminPath, firstAdminPath} from "@/lib/permissions";

export const metadata: Metadata = {
    title: "Space - Changelog",
};

const markerColors: Partial<Record<string, string>> = {
    "+": "text-emerald-300",
    "*": "text-amber-300",
    "~": "text-sky-300",
};

async function getBackendChangelog(apiKey: string): Promise<string> {
    const response = await fetch(getApiUrl() + "/v1/admin/changelog", {
        cache: "no-store",
        headers: {Accept: "text/plain", "X-API-Key": apiKey},
        signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("text/plain")) {
        throw new Error("Could not load the backend changelog");
    }
    return response.text();
}

function ChangelogPanel({title, result}: {title: string; result: PromiseSettledResult<string>}) {
    const text = result.status === "fulfilled" ? result.value.trimEnd() : "";
    return (
        <Surface className="box-primary min-w-0 p-4 sm:p-5">
            <section aria-label={title}>
                <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
                {text ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-zinc-200">
                        {text.split(/\r?\n/).map((line, index) => {
                            const markerColor = markerColors[line.charAt(0)];
                            return (
                                <Fragment key={index}>
                                    {markerColor ? (
                                        <>
                                            <span className={markerColor}>{line.charAt(0)}</span>
                                            {line.slice(1)}
                                        </>
                                    ) : line}
                                    {"\n"}
                                </Fragment>
                            );
                        })}
                    </pre>
                ) : (
                    <p className="text-sm text-zinc-400">
                        {result.status === "rejected" ? "Changelog is temporarily unavailable." : "No entries yet."}
                    </p>
                )}
            </section>
        </Surface>
    );
}

export default async function ChangelogPage() {
    const user = await getUserServer();
    if (!user) {
        redirect("/login");
    }
    if (!canAccessAdminPath(user, "/admin/changelog")) {
        redirect(firstAdminPath(user) ?? "/home/dashboard");
    }

    const [frontend, backend] = await Promise.allSettled([
        readFile(join(process.cwd(), "CHANGELOG.txt"), "utf8"),
        getBackendChangelog(user.apiKey),
    ]);

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <header className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Changelog</h1>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                    <li><span className={markerColors["+"]}>+</span> Feature</li>
                    <li><span className={markerColors["*"]}>*</span> Fix</li>
                    <li><span className={markerColors["~"]}>~</span> Note</li>
                </ul>
            </header>
            <div className="grid gap-4 2xl:grid-cols-2">
                <ChangelogPanel title="Frontend" result={frontend} />
                <ChangelogPanel title="Backend" result={backend} />
            </div>
        </div>
    );
}
