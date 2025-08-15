'use client';

import Script from 'next/script';
import { useEffect } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

export default function GoogleAnalytics() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.dataLayer) window.dataLayer = [];
        window.gtag = function gtag(){ window.dataLayer.push(arguments as any); } as any;
        window.gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            security_storage: 'granted',
        });

        const stored = localStorage.getItem('cookie_consent');
        if (stored === 'granted') {
            window.gtag('consent', 'update', {
                analytics_storage: 'granted',
            });
            if (GA_ID) {
                window.gtag('js', new Date());
                window.gtag('config', GA_ID, { anonymize_ip: true });
            }
        }
    }, []);

    if (!GA_ID) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
        `}
            </Script>
        </>
    );
}