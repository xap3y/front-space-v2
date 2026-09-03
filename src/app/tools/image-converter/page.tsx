import type {Metadata} from "next";
import ImageConverterClient from "./client";

export const metadata: Metadata = {title: "Space - Image Converter"};

export default function ImageConverterPage() {
    return <ImageConverterClient/>;
}
