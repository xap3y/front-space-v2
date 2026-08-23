import type {Metadata} from "next";
import ImageEditorClient from "./client";

export const metadata: Metadata = {title: "Space - Image editor"};

export default function ImageEditorPage() {
    return <ImageEditorClient/>;
}
