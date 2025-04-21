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

    const [password, setPassword] = useState("");
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [showImage, setShowImage] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const lang = useTranslation();

    useEffect(() => {
        const fetchImage = async () => {
            const imageDto: UploadedImage | null = await getImageInfoApi(uid + "");
            if (imageDto?.requiresPassword || !imageDto?.isPublic) {
                setPasswordRequired(true)
                setShowImage(false)
            } else {
                setImageUrl(imageDto.urlSet.rawUrl);
                setShowImage(true)
            }
            setImage(imageDto);
            setLoading(false)
        };

        if (!image) {
            console.log("Fetching new image")
            fetchImage();
        } else {
            console.log("Using cached image")
            if (image.requiresPassword || !image.isPublic) {
                setPasswordRequired(true)
                setShowImage(false)
            }
            setImageUrl(image.urlSet.rawUrl);
            setShowImage(true)
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

    const fetchImageBlob = async () => {
        const toastId = toast.loading(lang.toasts.loading.fetching_image);
        setLoading(true)
        console.log("CALLING")
        try {
            const res = await fetch(`${getApiUrl()}/v1/image/get/${uid}`, {
                headers: { "x-password": password },
            });

            if (!res.ok) {
                toast.update(toastId, {
                    render: lang.toasts.error.invalid_password,
                    type: "error",
                    autoClose: 1500,
                    closeOnClick: true,
                    isLoading: false
                })
                setPassword("")
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
            setShowImage(true);
            setPasswordRequired(false);
        } catch (err) {
            setError("Failed to fetch image");
        } finally {
            setLoading(false)
        }
    };

    const downloadImage = async () => {
        if (!image) return;
        try {
            const a = document.createElement("a");
            a.href = imageUrl || "";
            a.download = image.uniqueId + "." + image.type;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(imageUrl||"");
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
        }
    }

    const handleSubmitPassword = async () => {
        await fetchImageBlob();
    };

    if (loading) {
        return <LoadingPage />;
    }

    if (!image && !loading) {
        return <NotFound />;
    }

    if (!image) {
        return <NotFound />;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <>
            {showImage ? (
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
                                        <source src={imageUrl || ""} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}

                                {image.type != "mp4" && (
                                    <img className={"rounded"} src={imageUrl || ""} alt={image.uniqueId} />
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
            ) : passwordRequired ? (
                <>
                    <div className="flex h-screen justify-center items-center flex-col gap-2">
                        <p className={"text-3xl font-bold mb-4"}>
                            {lang.pages.image_viewer.password_required}
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmitPassword();
                            }}
                            className="flex flex-col gap-2"
                        >
                            <input
                                type="password"
                                id={"img-credentials"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={lang.pages.image_viewer.password_placeholder}
                                className="p-2 rounded text-whitesmoke outline-none bg-secondary shadow-xl border border-dark-grey2 focus:border-blue-500 transition duration-200"
                            />
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200">
                                {lang.pages.image_viewer.view_image_button_placeholder}
                            </button>
                            {error && <p className="text-red-500">{error}</p>}
                        </form>
                    </div>
                </>
            ) : null}

                {/*<div className="min-h-screen w-full flex items-center justify-center bg-dark-grey2">

                    {image.type == "mp4" && (
                        <video className={"max-h-[900px]"} controls>
                            <source src={getApiUrl() + "/v1/image/get/" + uid} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {image.type != "mp4" && (
                        <img src={getApiUrl() + "/v1/image/get/" + uid} alt={image.uniqueId} />
                    )}
                </div>*/}
        </>
    )
}