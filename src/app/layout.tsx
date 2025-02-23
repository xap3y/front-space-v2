import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Space Frontend v2",
    description: "XAP3Y's space",
    keywords: ["XAP3Y", "XAP3X", "Martin Hoke", "ksapeks", "xapex", "xapey", "xap3j", "Hoke Martin", "ксап3й", "ксапей"],
    openGraph: {
        title: "XAP3Y's space",
        description: "Frontend for XAP3Y's space API",
        type: "website",
        locale: "en_US",
        siteName: "XAP3Y's space",
        url: "https://sp.xap3y.tech",
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
        <body
            cz-shortcut-listen="true"
            className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased bg-primary text-whitesmoke font-source-code`}
        >
        {children}
        <Analytics />
        <ToastContainer theme={"dark"} />
        </body>
        </html>
    );
}
