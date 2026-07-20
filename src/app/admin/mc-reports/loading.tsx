export default function McReportsLoading() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {/* Header skeleton */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2">
                        <div className="h-7 w-64 bg-white/10 rounded" />
                        <div className="h-4 w-32 bg-white/5 rounded" />
                    </div>
                    <div className="h-9 w-24 bg-white/5 rounded-md" />
                </div>
            </div>

            {/* List Skeleton */}
            <div className="box-primary p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="h-5 w-24 bg-white/10 rounded" />
                        <div className="h-10 w-96 bg-white/5 rounded border border-white/5" />
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <div className="h-10 w-36 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-52 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-48 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-44 bg-white/5 rounded border border-white/5" />
                    </div>
                </div>

                {/* Card list skeleton */}
                <div className="mt-4 grid gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl box-primary p-3 shadow-sm shadow-black/30 flex items-center gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-4.5 w-36 bg-white/10 rounded" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-white/5" />
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="h-3 w-32 bg-white/5 rounded" />
                                    <div className="h-3 w-32 bg-white/5 rounded" />
                                    <div className="h-3 w-32 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="h-5 w-5 bg-white/5 rounded-full ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
