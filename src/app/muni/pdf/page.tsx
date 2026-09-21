import type {Metadata} from "next";
import MuniPdfClient from "./client";

export const metadata: Metadata = {
    title: "Space - MUNI PDF Downloader",
};

export default function MuniPdfPage() {
    return <MuniPdfClient/>;
}
