"use client";

import dynamic from "next/dynamic";

// Dynamically import RedocStandalone to prevent bundling it in the initial client bundle.
const RedocStandalone = dynamic(
    () => import("redoc").then((mod) => mod.RedocStandalone),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-primaryDotted bg-primaryDottedSize pt-10 px-4 md:px-6 animate-pulse">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-zinc-700 rounded" />
                        <div className="h-4 w-96 bg-zinc-800 rounded" />
                    </div>
                    {/* Content skeleton */}
                    <div className="grid grid-cols-4 gap-6">
                        {/* Sidebar skeleton */}
                        <div className="col-span-1 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-5 bg-zinc-800 rounded w-full" />
                            ))}
                        </div>
                        {/* Main spec body skeleton */}
                        <div className="col-span-3 space-y-6">
                            <div className="h-10 bg-zinc-700 rounded w-3/4" />
                            <div className="h-4 bg-zinc-800 rounded w-full" />
                            <div className="h-4 bg-zinc-800 rounded w-5/6" />
                            <div className="h-32 bg-zinc-900 rounded w-full" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
);

export default function Page() {
    return (
        <div className="bg-transparent">
            <RedocStandalone 
                specUrl="/apidocs.json" 
                options={{
                    nativeScrollbars: true,
                }}
            />
        </div>
    );
}