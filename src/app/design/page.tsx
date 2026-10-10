import type { Metadata } from "next";
import DesignShowcase from "./showcase";

export const metadata: Metadata = {
    title: "Design / Space",
    robots: { index: false, follow: false },
};

export default function DesignPage() {
    return <DesignShowcase />;
}
