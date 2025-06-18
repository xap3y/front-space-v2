import type {Metadata, ResolvingMetadata} from "next";
import {getImageInfoApi} from "@/lib/apiGetters";


async function fetchImageData(uid: string) {
    const res = await getImageInfoApi(uid + "");
    if (res == null) return null;
    return res;
}

export default async function Layout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ uid: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { uid } = await params
    const imageData = await fetchImageData(uid);

    if (!imageData) {
        return {
            title: "Image not found",
            description: "The requested image could not be found.",
        };
    }

    return {
        title: `${imageData.uniqueId}.${imageData.type}`,
        description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
        openGraph: {
            title: `${imageData.uniqueId}.${imageData.type}`,
            description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
            images: [imageData.urlSet.rawUrl],
            url: `${imageData.urlSet.portalUrl}`
        },
    };
}