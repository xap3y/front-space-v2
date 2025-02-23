'use client';

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import NotFound from "next/dist/client/components/not-found-error";
import {useImage} from "@/context/ImageContext";
import {getApiUrl} from "@/lib/core";
import {UploadedImage} from "@/types/image";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const { image, setImage } = useImage();

    useEffect(() => {
        const fetchImage = async () => {
            const imageDto: UploadedImage | null = await getImageInfoApi(uid + "");
            setImage(imageDto);
            setLoading(false)
        };

        if (!image) {
            console.log("Fetching new image")
            fetchImage();
        } else {
            console.log("Using cached image")
            setLoading(false)
        }
        console.log(image)
    }, [uid, image, setImage]);

    return (
        <>
            {loading && (
                <LoadingPage/>
            )}

            {(!image && !loading) && (
                <NotFound/>
            )}

            {image && (
                <div className="min-h-screen flex items-center justify-center bg-dark-grey2">
                    <img src={getApiUrl() + "/v1/image/get/" + uid} alt={image.uniqueId} />
                </div>
            )}
        </>
    )
}