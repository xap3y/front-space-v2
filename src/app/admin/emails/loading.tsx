export default function EmailsLoading() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {/* Header skeleton */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2">
                        <div className="h-7 w-24 bg-white/10 rounded" />
                        <div className="h-4 w-48 bg-white/5 rounded" />
                    </div>
                    <div className="h-9 w-24 bg-white/5 rounded-md" />
                </div>
            </div>

            {/* List Skeleton */}
            <div className="box-primary p-4 h-full space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="h-5 w-24 bg-white/10 rounded" />
                        <div className="h-10 w-96 bg-white/5 rounded border border-white/5" />
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <div className="h-10 w-44 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-48 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-52 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-44 bg-white/5 rounded border border-white/5" />
                    </div>
                </div>

                {/* Email cards list skeleton */}
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl box-primary p-3 shadow-sm shadow-black/30 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="space-y-2 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-48 bg-white/10 rounded" />
                                    <div className="h-4 w-8 bg-white/5 rounded" />
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="h-3.5 w-32 bg-white/5 rounded" />
                                    <div className="h-3.5 w-32 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                                <div className="h-6 w-14 bg-white/10 rounded-full" />
                                <div className="h-6 w-16 bg-white/10 rounded-full" />
                                <div className="flex items-center gap-1">
                                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10" />
                                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10" />
                                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
