import {ImageProvider} from "@/context/ImageContext";
import type {Metadata} from "next";
import {ErrorToast} from "@/components/ErrorToast";

export const metadata: Metadata = {
    title: "Space - Image finder",
};

export default function ImageLayour({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <>
            {/*<ErrorToast type={"WARN"} message={`This page is in BETA`} />*/}
            <ImageProvider>
                {children}
            </ImageProvider>
        </>
    )
}