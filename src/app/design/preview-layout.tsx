import type {ReactNode} from "react";
import Link from "next/link";

const sections = [
    {href: "/design/float", label: "Hover karty"},
    {href: "/design/profile", label: "Profilové menu"},
    {href: "/design/image", label: "Akce obrázku"},
] as const;

export function PreviewLayout({section, description, children}: {
    section: typeof sections[number]["href"];
    description: string;
    children: ReactNode;
}) {
    return (
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 text-zinc-200 sm:px-6 sm:pt-14">
            <header className="mb-7 space-y-4 border-b border-white/10 pb-6">
                <nav aria-label="Návrhy" className="flex flex-wrap items-center gap-1 text-xs">
                    <Link href="/design" className="rounded-md px-2.5 py-2 text-zinc-500 hover:text-white">← Design</Link>
                    {sections.map(({href, label}) => (
                        <Link key={href} href={href} aria-current={href === section ? "page" : undefined}
                            className="rounded-md px-2.5 py-2 text-zinc-400 hover:bg-white/5 hover:text-white aria-[current=page]:bg-sky-400/10 aria-[current=page]:text-sky-200">
                            {label}
                        </Link>
                    ))}
                </nav>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{sections.find(({href}) => href === section)?.label}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">{children}</div>
        </main>
    );
}

export function PreviewOption({name, description, children}: {name: string; description: string; children: ReactNode}) {
    return (
        <section className="flex min-w-0 flex-col rounded-xl border border-white/10 bg-[#0e0e10]">
            <div className="border-b border-white/[.07] px-4 py-3.5 sm:px-5">
                <h2 className="text-sm font-semibold text-zinc-100">{name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
            </div>
            {children}
        </section>
    );
}
