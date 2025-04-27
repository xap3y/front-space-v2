'use client';

import {useParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import NotFound from "next/dist/client/components/not-found-error";
import {useImage} from "@/context/ImageContext";
import {getApiUrl, isVideoFile} from "@/lib/core";
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
    const [isReadOnly, setIsReadOnly] = useState(true);

    const lang = useTranslation();

    useEffect(() => {

        const savedPassword = localStorage.getItem("image_password_" + uid);

        const fetchImage = async () => {
            const imageDto: UploadedImage | null = await getImageInfoApi(uid + "");
            console.log("IMGAGE DTO: ", imageDto)
            if (imageDto?.requiresPassword || !imageDto?.isPublic) {
                console.log("SETTINGS PASSWORD REQUIRED")
                if (savedPassword) {
                    setPassword(savedPassword);
                    setPasswordRequired(false);
                    setShowImage(true)
                    console.log("GETTING WITH SAVED PASS")
                    await fetchImageBlob(savedPassword);
                } else {
                    setPasswordRequired(true)
                }
            } else {
                setImageUrl(imageDto.urlSet.rawUrl);
                console.log(imageDto.urlSet.rawUrl)
                setShowImage(true)
            }
            setImage(imageDto);
            setLoading(false)
        };

        if (!image) {
            console.log("Fetching new image")
            fetchImage();
        } else {
            if (image.requiresPassword || !image.isPublic) {
                if (savedPassword) {
                    setPassword(savedPassword);
                    setPasswordRequired(false);
                    setShowImage(true)
                    fetchImageBlob(savedPassword);
                    return;
                }
                setShowImage(false)
                setPasswordRequired(true)
            }
            console.log("Using cached image")
            setImageUrl(image.urlSet.rawUrl);
            setShowImage(true)
            setLoading(false)
        }
        console.log(image)
    }, [uid, setImage]);

    const copyToClipboard = () => {
        console.log(image?.urlSet.shortUrl)
        //navigator.clipboard.writeText(getApiUrl() + "/v1/image/get/" + uid);
        navigator.clipboard.writeText(image?.urlSet.shortUrl || "")
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

    const fetchImageBlob = async (pass?: string) => {
        const toastId = toast.loading(lang.toasts.loading.fetching_image);
        setLoading(true)
        try {
            const res = await fetch(`${getApiUrl()}/v1/image/get/${uid}`, {
                headers: { "x-password": pass ? pass : password },
            });

            if (res.status == 401 || res.status == 403) {
                toast.update(toastId, {
                    render: lang.toasts.error.invalid_password,
                    type: "error",
                    autoClose: 1500,
                    closeOnClick: true,
                    isLoading: false
                })
                setPasswordRequired(true)
                setShowImage(false)
                setPassword("")
                localStorage.removeItem("image_password_" + uid);
                return;
            }

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
            console.log("RES: ", res)
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
            setShowImage(true);
            setPasswordRequired(false);
            toast.update(toastId, {
                render: "Image fetched successfully",
                type: "success",
                autoClose: 1200,
                closeOnClick: true,
                isLoading: false
            })
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
            a.href = (imageUrl || "") + "?download=true";
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
        localStorage.setItem("image_password_" + uid, password);
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
            {(!passwordRequired && showImage && image.type) ? (
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
                                {isVideoFile(image.type) ? (
                                    <>
                                        <video className={"rounded shadow-lg max-h-[600px] video-js vjs-default-skin"} controls>
                                            <source src={imageUrl || ""} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </>

                                ) : (<>
                                        <img className={"rounded"} src={imageUrl || ""} alt={image.uniqueId} />
                                    </>)}
                            </div>

                            <div className={"mt-5 flex flex-col gap-2 text-center"}>
                                <span className={"text-lg"}>
                                    {lang.pages.image_viewer.uploaded_on} {image.uploadedAt}
                                </span>

                                <span className={"text-lg font-bold"}>
                                    {image.size > 1024 ? ((image.size / 1024).toFixed(2) + " MB") : (image.size.toFixed(2) + " KB")}

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
                            autoComplete="off"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmitPassword();
                            }}
                            className="flex flex-col gap-2"
                        >
                            <input
                                type="text"
                                name={"new-adwd-field-unique"}
                                autoComplete="off"
                                readOnly={isReadOnly}
                                onClick={() => {
                                    setIsReadOnly(false);
                                }}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={lang.pages.image_viewer.password_placeholder}
                                className="text-security-disc p-2 rounded text-whitesmoke outline-none bg-secondary shadow-xl border border-dark-grey2 focus:border-blue-500 transition duration-200"
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