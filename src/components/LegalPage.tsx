'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';

export type TocItem = { id: string; label: string };

export default function LegalPage({
                                      title,
                                      updatedAt,
                                      children,
                                      backHref = '/home/dashboard',
                                      brand = "XAP3Y's Space",
                                      toc = [],
                                  }: {
    title: string;
    updatedAt?: string;
    children: React.ReactNode;
    backHref?: string;
    brand?: string;
    toc?: TocItem[];
}) {
    const handlePrint = useCallback(() => {
        if (typeof window !== 'undefined') window.print();
    }, []);

    const hasToc = useMemo(() => toc && toc.length > 0, [toc]);

    return (
        <div className="min-h-dvh bg-[#0b0d10] text-gray-200">
            {/* Top bar */}
            <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1216]/90 backdrop-blur print:hidden">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-tight">{brand}</div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={backHref}
                            className="px-3 py-1.5 rounded-md border border-white/10 bg-[#151a21] hover:bg-[#1b212a] text-xs transition-colors"
                        >
                            Zpět
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="px-3 py-1.5 rounded-md border border-white/10 bg-[#151a21] hover:bg-[#1b212a] text-xs transition-colors"
                            title="Tisk nebo uložení do PDF"
                        >
                            Tisk / PDF
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div className="bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(47,117,255,0.18),transparent),radial-gradient(800px_500px_at_90%_20%,rgba(0,212,134,0.12),transparent)] border-b border-white/10">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
                    {updatedAt && (
                        <p className="text-xs text-gray-400 mt-2">
                            Poslední aktualizace: <span className="font-mono tabular-nums">{updatedAt}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Content + TOC */}
            <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6">
                    {/* Content */}
                    <article className="min-w-0">
                        <div className="rounded-2xl border border-white/10 bg-[#12161c] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] p-5 md:p-7">
                            {/* Typographic wrapper */}
                            <div className="space-y-6">
                                {children}
                            </div>
                        </div>
                    </article>

                    {/* TOC */}
                    {hasToc && (
                        <aside className="print:hidden">
                            <div className="sticky top-[88px] rounded-2xl border border-white/10 bg-[#12161c] p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                    Obsah
                                </div>
                                <nav className="space-y-1">
                                    {toc.map(item => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className="block text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md px-2 py-1 transition-colors"
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </aside>
                    )}
                </div>
            </main>

            {/* Print */}
            <style jsx global>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          body { background: #fff !important; }
          .rounded-2xl, .rounded-xl { border-radius: 0 !important; }
          .border, .border-white\\/10, .shadow-\\[.*\\] { border: none !important; box-shadow: none !important; }
          main { padding: 0 !important; }
        }
        /* Content typography */
        article h2 {
          font-size: 1.125rem;
          line-height: 1.6;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        article h3 {
          font-size: 1rem;
          line-height: 1.6;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
        }
        article p { color: #cfd6e4; }
        article ul { list-style: disc; padding-left: 1.25rem; color: #cfd6e4; }
        article li + li { margin-top: 0.25rem; }
        article a { color: #7cc7ff; }
        article a:hover { color: #a5d9ff; }
        article .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0.75rem 0; }
        article .card {
          border: 1px solid rgba(255,255,255,0.08);
          background: #0f1318;
          border-radius: 12px;
          padding: 12px;
        }
        article .callout {
          border: 1px solid rgba(47,117,255,0.35);
          background: rgba(47,117,255,0.08);
          color: #d7e6ff;
          border-radius: 12px;
          padding: 12px;
        }
      `}</style>
        </div>
    );
}