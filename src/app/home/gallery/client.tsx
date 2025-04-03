"use client";


import {usePage} from "@/context/PageContext";
import {useEffect, useState} from "react";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {getUserImages} from "@/lib/apiGetters";
import {UploadedImage} from "@/types/image";
import {toast} from "react-toastify";
import {useTranslation} from "@/hooks/useTranslation";

export default function HomeGalleryPage() {

    const { user, loadingUser, error } = useUser();
    const { pageName, setPage } = usePage();
    const [ loading, setLoading ] = useState<boolean>(true)
    const [ images, setImages ] = useState<UploadedImage[]>([])
    const lang = useTranslation();

    useEffect(() => {
        setPage("gallery")

        if (loadingUser) {
            return;
        }

        const fetchImages = async () => {
            const imagesFromApi: UploadedImage[] | null = await getUserImages(user?.uid + "");
            if (imagesFromApi != null) {
                setImages(imagesFromApi);
                console.log(imagesFromApi)
            }
            setLoading(false)
        };
        fetchImages()
    }, [user, loadingUser])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(lang.toasts.success.copied_to_clipboard, {
            autoClose: 500,
            closeOnClick: true
        });
    }

    if (loading) return <LoadingPage/>

    return (
        <>
            <div className={"w-full"}>
                <div className={"flex justify-center flex-row flex-wrap p-20 gap-8"}>
                    {images.map((image, index) => (
                        <div className={"flex flex-col rounded-xl bg-secondary p-2"} key={image.uniqueId}>
                            <div className={"text-center px-10"}>
                                <p
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-content={"Click to copy"}
                                    data-tooltip-place="top"
                                    className={"text-xl font-bold text-telegram cursor-pointer hover:underline"}
                                    onClick={() => copyToClipboard(image.urlSet.rawUrl)}
                                >
                                    {image.uniqueId + "." + image.type}
                                </p>
                            </div>

                            <div className={"text-center"}>
                                <p>{Math.round(image.size / 1024) + " Kb"}</p>
                            </div>

                            <div className={"my-2 rounded-xl p-4 max-w-[250px] bg-primary_light"}>
                                {image.type == "mp4" && (
                                    <video className={"max-h-[600px] rounded shadow-lg"} controls>
                                        <source src={image.urlSet.rawUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}

                                {image.type != "mp4" && (
                                    <img className={"rounded"} src={image.urlSet.rawUrl} alt={image.uniqueId} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}