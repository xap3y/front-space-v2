import type {Metadata, ResolvingMetadata} from "next";
import {getImageInfoApi} from "@/lib/apiGetters";


async function fetchImageData(uid: string) {
    const res = await getImageInfoApi(uid + "");
    if (res == null) throw new Error("Failed to fetch image data");
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

    return {
        title: `${imageData.uniqueId}'s Profile`,
        description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
        openGraph: {
            title: `${imageData.uniqueId}.${imageData.type}`,
            description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
            images: [imageData.urlSet.rawUrl],
            url: `${imageData.urlSet.portalUrl}`
        },
    };
}