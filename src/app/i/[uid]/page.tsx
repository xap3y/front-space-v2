'use client';

import {useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import NotFound from "next/dist/client/components/not-found-error";
import {useImage} from "@/context/ImageContext";
import {getApiUrl, isVideoFile} from "@/lib/core";
import {UploadedImage} from "@/types/image";
import {FaArrowDown, FaDownload} from "react-icons/fa6";
import { MdReport } from "react-icons/md";
import {toast} from "react-toastify";
import {useTranslation} from "@/hooks/useTranslation";
import {IoMdTrash} from "react-icons/io";
import {useUser} from "@/hooks/useUser";
import {UserPopupCard} from "@/components/UserPopupCard";
import {UserObj} from "@/types/user";
import {useHoverCard} from "@/hooks/useHoverCard";
import {useIsMobile} from "@/hooks/utils";
import {copyToClipboard, deleteImageApi, errorToast} from "@/lib/client";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const { image, setImage } = useImage();

    const { user, loadingUser } = useUser();

    const [password, setPassword] = useState("");
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [showImage, setShowImage] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [open, setOpen] = useState(false);

    const toggleDropdown = () => setOpen(!open);
    const closeDropdown = () => setOpen(false);

    const lang = useTranslation();
    const router = useRouter();

    const isMobile = useIsMobile();

    const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);

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
                setImageUrl(imageDto.urlSet.customUrl || imageDto.urlSet.rawUrl);
                console.log(imageDto.urlSet.customUrl)
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
            setImageUrl(image.urlSet.customUrl || image.urlSet.rawUrl);
            setShowImage(true)
            setLoading(false)
        }
        console.log(image)
    }, [uid, setImage]);

    const reportImage = () => {
        toast.error("Not implemented yet!", {
            autoClose: 500,
            closeOnClick: true
        })
    }

    const deleteImage = async () => {
        if (!image || !user || !user.apiKey) {
            errorToast("You need to be logged!")
            return;
        }

        const toastId = toast.loading("Deleting image...");

        const res: boolean = await deleteImageApi(image.uniqueId, user.apiKey);

        if (res) {
            toast.update(toastId, {
                render: "Image deleted successfully",
                type: "success",
                autoClose: 1200,
                closeOnClick: true,
                isLoading: false
            })
            setShowImage(false);
            setLoading(true)

            setTimeout(() => {
                router.push("/i")
            }, 200);
        } else {
            toast.update(toastId, {
                render: "Failed to delete image",
                type: "error",
                autoClose: 1200,
                closeOnClick: true,
                isLoading: false
            })
        }
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

    /*const downloadImage = async () => {
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
    }*/

    function downloadImage() {
        if (!image) return;
        fetch(imageUrl || "")
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = image.uniqueId + "." + image.type;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            });
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

    // image.size explain:
    // 145543 == 145.543 KB
    // 1455430 == 1.455 MB
    // 1MB = 1048576 bytes

    return (
        <>
            {(!passwordRequired && showImage && image.type) ? (
                <>
                    <div className={"max-h-screen overflow-y-scroll overflow-x-hidden"}>

                        <div className={"flex items-center justify-center lg:mb-0 pb-56"}>
                            <div className={"p-4 mt-2 lg:mt-20 mx-4 lg:mx-0 rounded-lg shadow-sm flex flex-col items-center bg-secondary"} onMouseMove={handleMouseMove}>
                                <div className={"flex flex-col items-center justify-center p-2"}>
                                    <h1 className={"lg:text-3xl text-xl font-bold"}>{image.uniqueId + "." + image.type}</h1>

                                    <span className={"lg:text-lg text-base font-bold text-gray-400"}>
                                        {image.size < 1048576 ? ((image.size / 1024).toFixed(2) + " KB") : ((image.size / 1024 / 1024).toFixed(2) + " MB")}
                                    </span>
                                </div>

                                <div>
                            <span className={"lg:text-lg text-base gap-2 flex items-center justify-center"}>
                                <span className={"font-medium"}>{lang.pages.image_viewer.uploaded_by}</span>
                                {
                                    image.uploader ? (
                                        <>
                                            <a onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={"font-bold underline text-telegram hover:underline"} href={"/user/" + image.uploader.username}>{image.uploader.username}</a>
                                        </>
                                    ) : (
                                        <>
                                            <span className={"text-zinc-500"}>N/A</span>
                                        </>
                                    )
                                }

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
                                        <img className={"rounded lg:max-h-[550px] max-h-[400px]"} src={imageUrl || ""} alt={image.uniqueId} />
                                    </>)}
                                </div>

                                <div className={"mt-5 flex flex-col gap-2 text-center"}>
                                    <span className={"lg:text-lg text-xs"}>
                                        {lang.pages.image_viewer.uploaded_on} {image.uploadedAt}
                                    </span>

                                    {image.description && (
                                        <span>
                                            {image.description}
                                        </span>
                                    )}

                                </div>


                                <div className={"flex flex-row gap-6 mt-4 flex-wrap justify-center w-full lg:text-base text-sm font-bold"}>

                                    <button className={"lg:h-11 h-9 flex items-center gap-2 bg-green-600 text-white px-2 rounded"} onClick={downloadImage}>
                                        <FaDownload />
                                        {lang.pages.image_viewer.download_button_text}
                                    </button>

                                    {/*<button className={"lg:h-11 h-9 flex items-center gap-2 bg-telegram text-white px-2 rounded"} onClick={copyToClipboard}>
                                        <FaRegCopy />
                                        {lang.pages.image_viewer.copy_button_text}
                                    </button>*/}

                                    <div className="relative inline-block text-left">
                                        <button
                                            className="lg:h-11 h-9 flex items-center gap-2 bg-telegram text-white px-2 rounded"
                                            onClick={toggleDropdown}
                                        >
                                            <FaArrowDown className={`${open ? "rotate-180" : ""} duration-200`} />
                                            {lang.pages.image_viewer.copy_button_text}
                                        </button>

                                        <div
                                            className={`absolute right-0 mt-1 min-w-52 bg-zinc-900 rounded border border-zinc-700 shadow-lg z-50 overflow-hidden transform transition-all duration-300 ease-in-out origin-top ${
                                                open ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
                                            }`}
                                        >

                                            <button
                                                key={"short"}
                                                onClick={() => {
                                                    closeDropdown()
                                                    copyToClipboard(image?.urlSet.shortUrl || "", lang)
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 text-white"
                                            >
                                                Short URL
                                            </button>

                                            <hr className="border-zinc-700" />

                                            <button
                                                key={"portal"}
                                                onClick={() => {
                                                    closeDropdown()
                                                    copyToClipboard("https://space.xap3y.tech/i/" + uid, lang)
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 text-white"
                                            >
                                                Portal URL
                                            </button>

                                            <hr className="border-zinc-700" />

                                            <button
                                                key={"raw"}
                                                onClick={() => {
                                                    closeDropdown()
                                                    copyToClipboard(image?.urlSet.rawUrl || "", lang)
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 text-white"
                                            >
                                                Raw URL
                                            </button>
                                        </div>
                                    </div>

                                    <button className={"lg:h-11 h-9 flex items-center gap-2 bg-red-600 text-white px-2 rounded"} onClick={reportImage} >
                                        <MdReport />
                                        {lang.pages.image_viewer.report_button_text}
                                    </button>

                                    {/* TODO - DELETE */}
                                    {(user && image.uploader && user.uid == image.uploader.uid) && (
                                        <button className={"lg:h-11 h-9 flex items-center gap-2 bg-red-700 text-white px-2 rounded"} onClick={deleteImage} >
                                            <IoMdTrash />
                                            {"DELETE"}
                                        </button>
                                    )}

                                </div>

                            </div>
                        </div>

                    </div>

                    {
                        image.uploader && (
                            <div
                                className={`pointer-events-none transition-all duration-200 ease-out transform ${
                                    showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                                } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                                style={{ top: position.y + 10, left: position.x + 20 }}
                            >
                                <UserPopupCard user={image.uploader as UserObj} lang={lang} />
                            </div>
                        )
                    }
                </>
            ) : passwordRequired ? (
                <>
                    <div className="flex h-screen justify-center items-center flex-col gap-2">
                        <p className={"xl:text-3xl text-2xl font-bold mb-4 text-center"}>
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
                                className="text-dots p-2 rounded text-whitesmoke outline-none bg-secondary shadow-xl border border-dark-grey2 focus:border-blue-500 transition duration-200"
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

            <>
                <a href={"/a/image"} className={"xl:text-base text-xs fixed bottom-4 left-4 z-50 flex text-telegram underline opacity-50"}>
                    Upload new {">"}
                </a>
            </>
        </>
    )
}