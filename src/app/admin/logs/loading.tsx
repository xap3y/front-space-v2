export default function LogsLoading() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {/* Header skeleton */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2">
                        <div className="h-7 w-48 bg-white/10 rounded" />
                        <div className="h-4 w-32 bg-white/5 rounded" />
                    </div>
                    <div className="h-9 w-24 bg-white/5 rounded-md" />
                </div>
            </div>

            {/* Filters & Pagination skeleton */}
            <div className="box-primary p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="h-5 w-24 bg-white/10 rounded" />
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full lg:w-auto">
                        <div className="h-10 w-full lg:w-[220px] bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-full lg:w-[180px] bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-full lg:w-[180px] bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-full lg:w-[160px] bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-full lg:w-[280px] bg-white/5 rounded border border-white/5" />
                    </div>
                </div>

                {/* List Skeleton */}
                <div className="mt-4 grid gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl box-primary p-3 shadow-sm shadow-black/30 flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex flex-col flex-1 gap-2 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-28 bg-white/10 rounded" />
                                    <div className="h-6 w-6 rounded-full bg-white/5" />
                                    <div className="h-4 w-20 bg-white/5 rounded" />
                                </div>
                                <div className="h-3 w-2/3 bg-white/5 rounded" />
                            </div>
                            <div className="h-5 w-5 bg-white/5 rounded-full ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
