export default function Loading() {
    return (
        <section className="mx-auto w-full max-w-5xl space-y-4 animate-pulse">
            <div className="h-16 rounded-xl bg-white/[.04]" />
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="h-72 rounded-xl bg-white/[.04]" />
                <div className="h-72 rounded-xl bg-white/[.04]" />
            </div>
        </section>
    );
}
