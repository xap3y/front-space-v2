'use client';

import { useEffect, useState, useCallback } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function CookieConsent() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('cookie_consent');
        if (!stored) setOpen(true);
    }, []);

    const accept = useCallback(() => {
        localStorage.setItem('cookie_consent', 'granted');
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', { analytics_storage: 'granted' });
            if (GA_ID) {
                window.gtag('js', new Date());
                window.gtag('config', GA_ID, { anonymize_ip: true });
            }
        }
        setOpen(false);
    }, []);

    const decline = useCallback(() => {
        localStorage.setItem('cookie_consent', 'denied');
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', { analytics_storage: 'denied' });
        }
        setOpen(false);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 print:hidden">
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#12161c] shadow-2xl overflow-hidden">
                <div className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold">Cookies a analytika</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Používáme nezbytné cookies pro fungování webu a Google Analytics pro statistiky.
                                Pro Analytics potřebujeme váš souhlas. Více viz{' '}
                                <a className="underline decoration-white/30 hover:text-white" href="/legal/privacy">
                                    Zásady ochrany osobních údajů
                                </a>.
                            </p>
                        </div>

                        <div className="flex gap-2 mt-3 md:mt-0">
                            <button
                                onClick={decline}
                                className="px-3 py-2 rounded-md text-sm border border-white/15 bg-[#161b22] hover:bg-[#1b212a] transition-colors"
                            >
                                Pouze nezbytné
                            </button>
                            <button
                                onClick={accept}
                                className="px-3 py-2 rounded-md text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                                Povolit Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}