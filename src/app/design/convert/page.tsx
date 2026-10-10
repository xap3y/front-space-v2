import type { Metadata } from "next";
import ConvertShowcase from "./showcase";

export const metadata: Metadata = {
    title: "Konverze videa / Design / Space",
    robots: { index: false, follow: false },
};

export default function ConvertDesignPage() {
    return <ConvertShowcase />;
}
