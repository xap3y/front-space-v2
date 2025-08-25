import type { Metadata } from "next";
/*import { Geist, Geist_Mono } from "next/font/google";*/

import "./globals.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/next';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {ClientRoot} from "@/components/ClientRoot";
import Head from "next/head";
import { SpeedInsights } from "@vercel/speed-insights/next"
import CookieConsent from "@/components/CookieConsent";
import { GoogleAnalytics } from '@next/third-parties/google'

/*const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});*/

export const metadata: Metadata = {
    title: "Space Frontend v2",
    description: "XAP3Y's space",
    keywords: ["XAP3Y", "XAP3X", "ksapeks", "xapex", "xapey", "xap3j", "ксап3й", "ксапей"],
    openGraph: {
        title: "XAP3Y's space",
        description: "Frontend for XAP3Y's space API",
        type: "website",
        locale: "en_US",
        siteName: "XAP3Y's space",
        url: "https://xap3y.space",
    },
    twitter: {
        title: "XAP3Y's space",
        description: "Frontend for XAP3Y's space API",
        site: "XAP3Y's space",
        card: "summary_large_image",
    },
    creator: "XAP3Y",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <body
            cz-shortcut-listen="true"
            className={`dark h-full w-full antialiased bg-primary text-whitesmoke font-source-code`}
        >
        <ClientRoot>
            {children}
        </ClientRoot>
        <SpeedInsights />
        <ToastContainer theme={"dark"} />
        <CookieConsent />
        </body>
        </html>
    );
}
