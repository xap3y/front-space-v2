export default function InvitesLoading() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {/* Header + Filter skeleton */}
            <div className="box-primary p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-2">
                        <div className="h-7 w-24 bg-white/10 rounded" />
                        <div className="h-4 w-96 bg-white/5 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-10 bg-white/5 rounded" />
                        <div className="h-9 w-44 bg-white/5 rounded-lg border border-white/5" />
                    </div>
                </div>

                {/* Create & Pagination skeletons */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2 box-primary p-4 space-y-3">
                        <div className="h-5 w-32 bg-white/10 rounded" />
                        <div className="h-3 w-64 bg-white/5 rounded" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="h-10 bg-white/5 rounded border border-white/5" />
                            <div className="sm:col-span-1 h-10 bg-white/5 rounded border border-white/5" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-9 w-20 bg-white/5 rounded-lg border border-white/5" />
                            <div className="h-9 w-20 bg-white/5 rounded-lg border border-white/5" />
                        </div>
                    </div>

                    <div className="box-primary p-4 space-y-3">
                        <div className="h-5 w-24 bg-white/10 rounded" />
                        <div className="h-3 w-16 bg-white/5 rounded" />
                        <div className="h-10 w-full bg-white/5 rounded border border-white/5" />
                        <div className="flex items-center justify-between">
                            <div className="h-9 w-14 bg-white/5 rounded" />
                            <div className="h-4 w-16 bg-white/5 rounded" />
                            <div className="h-9 w-14 bg-white/5 rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Skeleton */}
            <div className="box-primary p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="h-5 w-28 bg-white/10 rounded" />
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="h-10 w-44 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-44 bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-[230px] bg-white/5 rounded border border-white/5" />
                        <div className="h-10 w-44 bg-white/5 rounded border border-white/5" />
                    </div>
                </div>

                {/* Table structure */}
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-400">
                        <tr className="border-b border-white/10">
                            <th className="text-left py-2 pr-2 w-1/6">Code</th>
                            <th className="text-left py-2 pr-2 w-1/12">Status</th>
                            <th className="text-left py-2 pr-2 w-1/6">Created</th>
                            <th className="text-left py-2 pr-2 w-1/5">Created by</th>
                            <th className="text-left py-2 pr-2 w-1/6">Used</th>
                            <th className="text-left py-2 pr-2 w-1/5">Used by</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <tr key={i}>
                                <td className="py-4 pr-2">
                                    <div className="h-6 w-28 bg-white/10 rounded" />
                                </td>
                                <td className="py-4 pr-2">
                                    <div className="h-6 w-16 bg-white/10 rounded-full" />
                                </td>
                                <td className="py-4 pr-2">
                                    <div className="h-4 w-28 bg-white/5 rounded" />
                                </td>
                                <td className="py-4 pr-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-white/5" />
                                        <div className="h-4 w-20 bg-white/10 rounded" />
                                    </div>
                                </td>
                                <td className="py-4 pr-2">
                                    <div className="h-4 w-28 bg-white/5 rounded" />
                                </td>
                                <td className="py-4 pr-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-white/5" />
                                        <div className="h-4 w-20 bg-white/10 rounded" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
