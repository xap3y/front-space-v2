export default function AnalyticsLoading() {
    return (
        <section className="min-w-0 flex-1 px-3 pb-10 pt-5 md:px-6">
            <div className="mx-auto w-full max-w-[100rem] animate-pulse space-y-4">
                <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white/5" /><div><div className="h-6 w-32 rounded bg-white/10" /><div className="mt-2 h-3 w-64 max-w-[65vw] rounded bg-white/5" /></div></div>
                <div className="box-primary h-20 p-4" />
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
                    {Array.from({length: 6}).map((_, index) => <div key={index} className="box-primary h-28" />)}
                </div>
                <div className="box-primary h-[430px]" />
                <div className="box-primary h-[380px]" />
                <div className="grid gap-4 lg:grid-cols-2"><div className="box-primary h-[360px]" /><div className="box-primary h-[360px]" /></div>
            </div>
        </section>
    );
}
