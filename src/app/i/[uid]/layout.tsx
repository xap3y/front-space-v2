import type {Metadata, ResolvingMetadata} from "next";
import {getImageInfoApi} from "@/lib/apiGetters";

export const dynamic = "force-dynamic";

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

    /*const metadataBuilder = {
        title: `${imageData.uniqueId}.${imageData.type}`,
        description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
        openGraph: {
            title: `${imageData.uniqueId}.${imageData.type}`,
            description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
            images: [imageData.urlSet.customUrl || imageData.urlSet.rawUrl],
            url: `${imageData.urlSet.portalUrl}`
        },
    }*/

    const metadataBuilder: any = {
        title: `${imageData.uniqueId}.${imageData.type}`,
        description: `Uploaded by ${imageData.uploader?.username || 'N/A'}`,
    };

    const webhookSettings = imageData.webhookSettings;

    //console.log("Webhook settings: " + JSON.stringify(webhookSettings));
    //console.log("Webhook settings desc: " + JSON.stringify(webhookSettings));

    if (webhookSettings && webhookSettings.enabled) {
        const newTitle = (webhookSettings.title || metadataBuilder.title)
            .replaceAll("{uid}", imageData.uniqueId)
            .replaceAll("{size}", `${imageData.size}`)
            .replaceAll("{filetype}", imageData.type);

        const newDescription = (webhookSettings.description || metadataBuilder.description)
            .replaceAll("{uid}", imageData.uniqueId)
            .replaceAll("{size}", `${imageData.size}`)
            .replaceAll("{filetype}", imageData.type)
            .replaceAll("{uploader}", imageData.uploader?.username || 'N/A');

        const titleUrl = (webhookSettings.titleUrl || imageData.urlSet.portalUrl || "")
            .replaceAll("{uid}", imageData.uniqueId)

        metadataBuilder.title = newTitle;
        metadataBuilder.description = newDescription;

        if (webhookSettings.color) {
            if (/^#([0-9A-F]{3}){1,2}$/i.test(webhookSettings.color)) {
                metadataBuilder.other = { "theme-color": webhookSettings.color};
            } else if (webhookSettings.color.toLowerCase() === "random") {
                metadataBuilder.other = { "theme-color": '#' + Math.floor(Math.random() * 16777215).toString(16)};
            }
        }

        metadataBuilder.openGraph = {
            title: newTitle,
            description: newDescription,
            images: imageData.urlSet.rawUrl,
            url: titleUrl,
            siteName: webhookSettings.authorName || ""
        };

    }

    //console.log("Generated metadata: ", metadataBuilder);

    return metadataBuilder;
}