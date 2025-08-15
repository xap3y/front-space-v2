import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Legal | XAP3Y's Space",
    robots: { index: true, follow: true },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return children;
}