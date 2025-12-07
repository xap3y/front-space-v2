'use client';

import {notFound, useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import {useImage} from "@/context/ImageContext";
import {getApiUrl, isVideoFile} from "@/lib/core";
import {UploadedImage} from "@/types/image";
import {FaArrowDown, FaDownload, FaLock} from "react-icons/fa6";
import {toast} from "react-toastify";
import {useTranslation} from "@/hooks/useTranslation";
import {IoMdTrash} from "react-icons/io";
import {useUser} from "@/hooks/useUser";
import {UserPopupCard} from "@/components/UserPopupCard";
import {UserObj} from "@/types/user";
import {useHoverCard} from "@/hooks/useHoverCard";
import {useIsMobile} from "@/hooks/utils";
import {copyToClipboard, deleteImageApi, errorToast, infoToast} from "@/lib/client";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import MainStringInput from "@/components/MainStringInput";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const { image, setImage } = useImage();

    const { user, loadingUser } = useUser();

    const [password, setPassword] = useState("");
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [showImage, setShowImage] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setimageUrl] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [open, setOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            //console.log("IMGAGE DTO: ", imageDto)
            if ((imageDto?.requiresPassword || !imageDto?.isPublic)) {
                if (user && imageDto?.uploader?.uid == user.uid) {
                    console.log("USER IS UPLOADER, NO PASS NEEDED")
                    const url = imageDto.location == "LOCAL" ? `/api/images/` + imageDto.uniqueId : imageDto.urlSet.rawUrl;
                    setimageUrl(url);
                    setShowImage(true);
                    setImage(imageDto);
                    setLoading(false)
                    return;
                }
                //console.log("SETTINGS PASSWORD REQUIRED")
                if (savedPassword) {
                    setPassword(savedPassword);
                    setPasswordRequired(false);
                    setShowImage(true)
                    //console.log("GETTING WITH SAVED PASS")
                    await fetchImageBlob(savedPassword);
                } else {
                    setPasswordRequired(true)
                }
            } else {
                setimageUrl(imageDto.urlSet.customUrl || imageDto.urlSet.rawUrl);
                //console.log(imageDto.urlSet.customUrl)
                setShowImage(true)
            }
            setImage(imageDto);
            setLoading(false)
        };

        if (!image && !loadingUser) {
            console.log("Fetching new image")
            fetchImage();
        } else if (image) {
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
            setimageUrl(image.urlSet.customUrl || image.urlSet.rawUrl);
            setShowImage(true)
            setLoading(false)
        }
        //console.log(image)
    }, [uid, setImage, loadingUser]);

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
            //console.log("RES: ", res)
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setimageUrl(url);
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
        return notFound();
    }

    if (!image) {
        return notFound();
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
                    <div className={"overflow-y-scroll overflow-x-hidden"}>

                        <div className={"flex min-h-screen w-full items-center justify-center lg:mb-0 pb-56"}>
                            <div className={"p-4 mt-2 mx-4 lg:mx-0 shadow-sm flex flex-col items-center box-primary"} onMouseMove={handleMouseMove}>
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


                                <div className={"flex flex-row gap-4 mt-4 flex-wrap justify-center w-full lg:text-base text-sm font-bold"}>

                                    {/*<button className={"lg:h-11 h-9 flex items-center gap-2 bg-green-600 text-white px-2 rounded"} onClick={downloadImage}>
                                        <FaDownload />
                                        {lang.pages.image_viewer.download_button_text}
                                    </button>*/}

                                    <a
                                        className={"lg:h-11 h-9 flex items-center gap-2 text-white px-2 rounded border border-white/10 bg-primary hover:bg-secondary"}
                                        href={image.urlSet.rawUrl + "?download=true&password="+password || ""}
                                        target={"_self"}
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            infoToast("Downloading image")
                                        }}
                                    >
                                        <FaDownload className="h-4 w-4" />
                                        {lang.pages.image_viewer.download_button_text}
                                    </a>

                                    {/*<button className={"lg:h-11 h-9 flex items-center gap-2 bg-telegram text-white px-2 rounded"} onClick={copyToClipboard}>
                                        <FaRegCopy />
                                        {lang.pages.image_viewer.copy_button_text}
                                    </button>*/}

                                    <div className="relative inline-block text-left">
                                        <button
                                            className="lg:h-11 h-9 flex items-center gap-2 border text-white px-2 rounded border-white/10 bg-primary hover:bg-secondary"
                                            onClick={toggleDropdown}
                                        >
                                            <FaArrowDown className={`h-4 w-4 ${open ? "rotate-180" : ""} duration-200`} />
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
                                                    copyToClipboard(image?.urlSet.portalUrl || "https://xap3y.space/i/" + uid, lang)
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

                                    {/*<button className={"lg:h-11 h-9 flex items-center gap-2 bg-red-600 text-white px-2 rounded"} onClick={reportImage} >
                                        <MdReport />
                                        {lang.pages.image_viewer.report_button_text}
                                    </button>*/}

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
                    <section className="min-h-screen w-full flex items-center justify-center px-4 py-8">
                        <div className="w-full max-w-md box-primary rounded-2xl shadow-xl p-5 sm:p-6">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-base sm:text-xl font-bold leading-tight text-whitesmoke">
                                    {lang?.pages?.image_viewer?.password_required}
                                </h1>
                            </div>

                            {/* Form */}
                            <form
                                autoComplete="off"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSubmitPassword();
                                }}
                                className="space-y-3"
                                noValidate
                            >
                                <label className="block text-sm font-medium text-gray-300">
                                    {lang?.pages?.image_viewer?.password_placeholder}
                                </label>

                                <div className="relative">
                                    <MainStringInput
                                        placeholder={lang?.pages?.image_viewer?.password_placeholder}
                                        className={`w-full sm:text-sm text-xs ${(isFocused && !showPassword) ? "text-dots" : ""}`}
                                        required
                                        autoComplete="off"
                                        type="text"
                                        name="image"
                                        onFocus={() => {
                                            setTimeout(() => setIsFocused(true), 100);
                                        }}
                                        id="image"
                                        value={password}
                                        aria-invalid={!!error}
                                        onChange={(e) => setPassword(e)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="h-5 w-5" />
                                        ) : (
                                            <FaEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                {error ? (
                                    <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-md p-2 text-sm">
                                        {error}
                                    </div>
                                ) : (
                                    /*<p className="text-xs text-gray-400">
                                        {lang?.pages?.image_viewer?.view_image_button_placeholder}
                                    </p>*/
                                    <></>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500/30 transition"
                                >
                                    {lang?.pages?.image_viewer?.view_image_button_placeholder}
                                </button>
                            </form>
                        </div>
                    </section>
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