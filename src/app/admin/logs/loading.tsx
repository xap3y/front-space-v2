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
                    <div className="flex gap-2"><div className="h-9 w-[154px] bg-white/5 rounded-md"/><div className="h-9 w-24 bg-white/5 rounded-md" /></div>
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
                <div className="mt-2 grid gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-lg box-primary p-1.5 shadow-sm shadow-black/30 flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex flex-1 min-w-0 items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-24 bg-white/10 rounded" />
                                    <div className="h-5 w-5 rounded-full bg-white/5" />
                                    <div className="h-3 w-16 bg-white/5 rounded" />
                                </div>
                                <div className="ml-auto hidden h-2.5 w-28 bg-white/5 rounded sm:block" />
                            </div>
                            <div className="h-5 w-5 bg-white/5 rounded-full ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
