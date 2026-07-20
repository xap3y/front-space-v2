export default function SystemLoading() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {/* Header skeleton */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2">
                        <div className="h-7 w-24 bg-white/10 rounded" />
                        <div className="h-4 w-96 bg-white/5 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-20 bg-white/5 rounded-lg" />
                        <div className="h-9 w-24 bg-white/5 rounded-lg" />
                    </div>
                </div>

                {/* Quick summary cards grid */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="box-primary p-4 space-y-2">
                            <div className="h-3.5 w-20 bg-white/10 rounded" />
                            <div className="h-6 w-16 bg-white/15 rounded" />
                            <div className="h-3.5 w-24 bg-white/5 rounded" />
                        </div>
                    ))}
                </div>

                {/* Search skeleton */}
                <div className="mt-4 box-primary p-4 space-y-3">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="flex gap-2">
                        <div className="h-10 flex-1 bg-white/5 rounded-lg border border-white/5" />
                        <div className="h-10 w-20 bg-white/5 rounded-lg border border-white/5" />
                    </div>
                    <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
            </div>

            {/* Metrics table skeleton */}
            <div className="box-primary p-4 space-y-4">
                <div className="h-4 w-28 bg-white/10 rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="box-primary p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-white/10 rounded" />
                            <div className="h-3 w-16 bg-white/5 rounded" />
                        </div>
                        <div className="space-y-2 pt-2">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="flex gap-4 border-b border-white/5 pb-2">
                                    <div className="h-4 w-1/3 bg-white/15 rounded" />
                                    <div className="h-4 w-1/4 bg-white/10 rounded" />
                                    <div className="h-4 w-1/4 bg-white/5 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
