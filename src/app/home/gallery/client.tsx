"use client";


import {usePage} from "@/context/PageContext";
import {useEffect, useState} from "react";
import {useUser} from "@/hooks/useUser";
import LoadingPage from "@/components/LoadingPage";
import {getUserImages} from "@/lib/apiGetters";
import {UploadedImage} from "@/types/image";
import {useTranslation} from "@/hooks/useTranslation";
import {copyToClipboard, deleteImageApi, errorToast, okToast} from "@/lib/client";
import {ErrorPage} from "@/components/ErrorPage";
import {useRouter} from "next/navigation";
import {IoMdTrash} from "react-icons/io";
import {FaDownload} from "react-icons/fa6";
import {toast} from "react-toastify";
import {MdArrowRightAlt, MdReport} from "react-icons/md";
import {FaExternalLinkAlt} from "react-icons/fa";
import {isVideoFile} from "@/lib/core";
import Image from "next/image";

export default function HomeGalleryPage() {

    const { user, loadingUser, error } = useUser();
    const { pageName, setPage } = usePage();
    const [ loading, setLoading ] = useState<boolean>(true)
    const [ images, setImages ] = useState<UploadedImage[]>([])
    const lang = useTranslation();
    const [fetchError, setFetchError] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setPage("gallery")

        if (loadingUser) {
            return;
        }
        else if (error == 'User not found.') {
            return router.push("/login");
        }

        const fetchImages = async () => {
            const imagesFromApi: UploadedImage[] | null = await getUserImages(user?.uid + "");
            if (imagesFromApi != null) {
                setImages(imagesFromApi);
                console.log(imagesFromApi)
            } else {
                setFetchError(true);
            }
            setLoading(false)
        };
        fetchImages()
    }, [user, loadingUser, error])

    if (loading || !user) return <LoadingPage/>

    if (fetchError) {
        return <ErrorPage message={"Failed to fetch images"} lang={lang} callBack={()=> {
            router.replace("/")
        }} />
    }

    const openImageLink = (img: UploadedImage) => {
        if (!img || !img.urlSet || !img.urlSet.rawUrl) {
            errorToast("Image URL not found");
            return;
        }
        window.open(img.urlSet.portalUrl, "_blank");
    }

    const deleteImage = async (img: UploadedImage) => {
        setLoading(true)
        if (!img || !user || !user.apiKey) {
            errorToast("You need to be logged!")
            return;
        }

        const toastId = toast.loading("Deleting image...");

        const res: boolean = await deleteImageApi(img.uniqueId, user.apiKey);

        if (res) {
            toast.update(toastId, {
                render: "Image deleted successfully",
                type: "success",
                autoClose: 1200,
                closeOnClick: true,
                isLoading: false
            })
            setImages(prevImages => prevImages.filter(image => image.uniqueId !== img.uniqueId));
        } else {
            toast.update(toastId, {
                render: "Failed to delete image",
                type: "error",
                autoClose: 1200,
                closeOnClick: true,
                isLoading: false
            })
        }
        setLoading(false)
    }

    const downloadImage = async (img: UploadedImage) => {
        if (!img) return;
        try {
            const a = document.createElement("a");
            a.href = (img.urlSet.rawUrl || "") + "?download=true";
            a.download = img.uniqueId + "." + img.type;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(img.urlSet.rawUrl||"");
            document.body.removeChild(a);
            okToast("Image downloaded successfully", 500);
        } catch (error) {
            console.error("Download error:", error);
        }
    }

    return (
        <>
            <div className={"w-full max-h-screen overflow-y-scroll"}>
                <div className={"flex justify-center flex-row flex-wrap p-20 gap-8"}>
                    {images.filter(image => image.isPublic).map((image, index) => (
                        <div className={"flex flex-col rounded-xl bg-secondary p-2 h-auto"} key={image.uniqueId}>
                            <div className={"text-center px-10"}>
                                <p
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-content={"Click to copy"}
                                    data-tooltip-place="top"
                                    className={"text-xl font-bold text-telegram cursor-pointer hover:underline"}
                                    onClick={() => copyToClipboard(image.urlSet.rawUrl, lang.toasts.success.copied_to_clipboard)}
                                >
                                    {image.uniqueId + "." + image.type}
                                </p>
                            </div>

                            <div className={"text-center"}>
                                <p>{Math.round(image.size / 1024) + " Kb"}</p>
                            </div>

                            <div className={"my-2 items-center justify-center flex h-full rounded-xl max-h-[250px] p-4 max-w-[250px] bg-primary_light"}>
                                {isVideoFile(image.type) ? (
                                    <video className={"max-h-[240px] rounded shadow-lg"} controls>
                                        <source src={image.urlSet.rawUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ):<img className={"rounded object-contain w-full"} src={image.urlSet.rawUrl} alt={image.uniqueId} />}
                            </div>

                            <div className={"flex flex-row gap-4 justify-between w-full"}>
                                <button className={"w-full justify-center lg:h-11 h-9 flex items-center gap-2 bg-blue-600 text-white px-2 rounded"} onClick={() => openImageLink(image)} >
                                    <FaExternalLinkAlt />
                                </button>

                                <button className={"w-full justify-center lg:h-11 h-9 flex items-center gap-2 bg-green-600 text-white px-2 rounded"} onClick={() => downloadImage(image)}>
                                    <FaDownload />
                                </button>

                                <button className={"w-full justify-center lg:h-11 h-9 flex items-center gap-2 bg-red-700 text-white px-2 rounded"} onClick={() => deleteImage(image)} >
                                    <IoMdTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}