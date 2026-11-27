import type {Metadata} from "next";
import {PreviewLayout} from "../preview-layout";
import FloatPreviews from "./previews";

export const metadata: Metadata = {title: "Hover karty / Space", robots: {index: false, follow: false}};

export default function FloatDesignPage() {
    return (
        <PreviewLayout section="/design/float" description="Pět variant se stejnými údaji. Najeď na jméno xap3y nebo na něj přejdi klávesou Tab a vyzkoušej plovoucí kartu.">
            <FloatPreviews />
        </PreviewLayout>
    );
}
