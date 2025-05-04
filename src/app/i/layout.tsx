import {ImageProvider} from "@/context/ImageContext";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Space - Image finder",
};

export default function ImageLayour({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return <ImageProvider>{children}</ImageProvider>
}