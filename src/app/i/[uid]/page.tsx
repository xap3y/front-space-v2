'use client';

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import NotFound from "next/dist/client/components/not-found-error";
import {useImage} from "@/context/ImageContext";
import {getApiUrl} from "@/lib/core";
import {UploadedImage} from "@/types/image";
import { FaDownload } from "react-icons/fa6";
import { MdReport } from "react-icons/md";
import { FaRegCopy } from "react-icons/fa";
import {toast} from "react-toastify";
import {useTranslation} from "@/hooks/useTranslation";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const { image, setImage } = useImage();

    const lang = useTranslation();

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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getApiUrl() + "/v1/image/get/" + uid);
        toast.success(lang.toasts.success.copied_to_clipboard, {
            autoClose: 500,
            closeOnClick: true
        });
    }

    const reportImage = () => {
        toast.error("Not implemented yet!", {
            autoClose: 500,
            closeOnClick: true
        })
    }

    const downloadImage = async () => {
        if (!image) return;
        try {
            const response = await fetch(image.urlSet.rawUrl || "", {
                method: "GET",
            });

            if (!response.ok) throw new Error("Failed to download");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = image.uniqueId + "." + image.type;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
        }
    }

    return (
        <>
            {loading && (
                <LoadingPage/>
            )}

            {(!image && !loading) && (
                <NotFound/>
            )}


            {image && (

                <>
                    <div className={"flex items-center justify-center"}>
                        <div className={"p-4 mt-10 lg:mt-20 mx-4 lg:mx-0 rounded-lg shadow-sm flex flex-col items-center bg-secondary"}>
                            <div className={"flex p-2"}>
                                <h1 className={"text-3xl font-bold"}>{image.uniqueId + "." + image.type}</h1>
                            </div>

                            <div>
                            <span className={"text-lg"}>
                                {lang.pages.image_viewer.uploaded_by} <a className={"font-bold text-telegram hover:underline"} href={"/user/" + image.uploader.username}>{image.uploader.username}</a>
                            </span>
                            </div>

                            <div className={"mt-4"}>
                                {image.type == "mp4" && (
                                    <video className={"max-h-[600px] rounded shadow-lg"} controls>
                                        <source src={getApiUrl() + "/v1/image/get/" + uid} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}

                                {image.type != "mp4" && (
                                    <img className={"rounded"} src={getApiUrl() + "/v1/image/get/" + uid} alt={image.uniqueId} />
                                )}
                            </div>

                            <div className={"mt-5"}>
                                <span className={"text-lg"}>
                                    {lang.pages.image_viewer.uploaded_on} {image.uploadedAt}
                                </span>
                            </div>

                            <div className={"flex flex-row gap-6 mt-4"}>

                                <button className={"flex items-center gap-2 bg-green-600 text-white p-2 rounded mt-2"} onClick={downloadImage}>
                                    <FaDownload />
                                    {lang.pages.image_viewer.download_button_text}
                                </button>

                                <button className={"flex items-center gap-2 bg-telegram text-white p-2 rounded mt-2"} onClick={copyToClipboard}>
                                    <FaRegCopy />
                                    {lang.pages.image_viewer.copy_button_text}
                                </button>

                                <button className={"flex items-center gap-2 bg-red-700 text-white p-2 rounded mt-2"} onClick={reportImage} >
                                    <MdReport />
                                    {lang.pages.image_viewer.report_button_text}
                                </button>
                            </div>

                        </div>
                    </div>
                </>

                /*<div className="min-h-screen w-full flex items-center justify-center bg-dark-grey2">

                    {image.type == "mp4" && (
                        <video className={"max-h-[900px]"} controls>
                            <source src={getApiUrl() + "/v1/image/get/" + uid} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {image.type != "mp4" && (
                        <img src={getApiUrl() + "/v1/image/get/" + uid} alt={image.uniqueId} />
                    )}
                </div>*/
            )}
        </>
    )
}