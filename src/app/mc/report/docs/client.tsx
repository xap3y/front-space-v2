"use client";

import dynamic from "next/dynamic";
import {useEffect} from "react";

const RedocStandalone = dynamic(
    () => import("redoc").then((module) => module.RedocStandalone),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-white px-4 py-10 text-zinc-900">
                <div className="mx-auto max-w-6xl animate-pulse space-y-5">
                    <div className="h-9 w-72 rounded bg-zinc-200" />
                    <div className="h-4 w-full max-w-xl rounded bg-zinc-100" />
                    <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-4">
                        <div className="space-y-3 md:col-span-1">
                            {Array.from({ length: 7 }).map((_, index) => (
                                <div key={index} className="h-5 rounded bg-zinc-100" />
                            ))}
                        </div>
                        <div className="space-y-4 md:col-span-3">
                            <div className="h-10 rounded bg-zinc-200" />
                            <div className="h-36 rounded bg-zinc-100" />
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
);

export default function ReportsApiDocsPage() {

    useEffect(() => {
        const removeLink = () => {
            document
                .querySelector('a[href^="https://redocly.com/redoc/"]')
                ?.remove();
        };

        removeLink();

        const observer = new MutationObserver(removeLink);

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="!bg-white">
            <RedocStandalone
                specUrl="/mc/report/docs/openapi.json"
                options={{ nativeScrollbars: true, hideDownloadButton: false, expandResponses: "200,201" }}
            />
        </div>
    );
}
