import type {Metadata} from "next";
import {getImageInfoApi} from "@/lib/apiGetters";


async function fetchImageData(uid: string) {
    const res = await getImageInfoApi(uid + "");
    if (res == null) throw new Error("Failed to fetch image data");
    return res;
}

export async function generateMetadata({ params }: { params: { uid: string } }): Promise<Metadata> {
    const imageData = await fetchImageData(params.uid);

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


export default function Layout({
                                        children,
                                        params
                                    }: {
    children: React.ReactNode;
    params: { uid: string };
}) {
    return {children}
}