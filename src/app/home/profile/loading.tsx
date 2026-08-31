export default function ProfileLoading() {
    return <section className="flex-1 min-w-0 px-3 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
            <div className="box-primary flex flex-col items-center gap-5 p-5 md:p-7 sm:flex-row">
                <div className="h-24 w-24 shrink-0 rounded-full bg-white/[.07]" />
                <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="mx-auto h-8 w-44 rounded bg-white/[.07] sm:mx-0" />
                    <div className="mx-auto h-4 w-56 rounded bg-white/[.05] sm:mx-0" />
                    <div className="mx-auto h-3 w-36 rounded bg-white/[.04] sm:mx-0" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({length: 4}).map((_, index) => <div key={index} className="box-primary space-y-3 p-4"><div className="h-9 w-9 rounded-lg bg-white/[.06]"/><div className="h-7 w-20 rounded bg-white/[.07]"/><div className="h-3 w-14 rounded bg-white/[.04]"/></div>)}
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
                <div className="box-primary space-y-4 p-5 md:p-6"><div className="h-10 w-52 rounded bg-white/[.06]"/>{Array.from({length: 4}).map((_, index) => <div key={index} className="h-14 rounded-lg bg-white/[.04]"/>)}</div>
                <div className="box-primary space-y-4 p-5 md:p-6"><div className="h-10 w-44 rounded bg-white/[.06]"/>{Array.from({length: 3}).map((_, index) => <div key={index} className="h-14 rounded-lg bg-white/[.04]"/>)}</div>
            </div>
            <div className="box-primary h-44" />
        </div>
    </section>;
}
