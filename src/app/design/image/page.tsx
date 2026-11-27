import type {Metadata} from "next";
import {PreviewLayout} from "../preview-layout";
import ImagePreviews from "./previews";

export const metadata: Metadata = {title: "Akce obrázku / Space", robots: {index: false, follow: false}};

export default function ImageDesignPage() {
    return (
        <PreviewLayout section="/design/image" description="Pět rozložení akcí pro detail obrázku. Vyzkoušej nabídku Copy se třemi odkazy a potvrzení smazání na ukázkovém souboru.">
            <ImagePreviews />
        </PreviewLayout>
    );
}
