'use client';
import VideoConversionControl from "@/components/VideoConversionControl";
import { versionedVideoUrl } from "@/lib/videoConversion";
import Surface from "@/components/ui/Surface";

import { NativeButton } from "@/components/ui/NativeButton";


import {notFound, useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import {useImage} from "@/context/ImageContext";
import {getApiUrl, isVideoFile} from "@/lib/core";
import {UploadedImage} from "@/types/image";
import {FaLock} from "react-icons/fa6";
import {toast} from "react-toastify";
import {useTranslation} from "@/hooks/useTranslation";
import {useUser} from "@/hooks/useUser";
import {UserHoverCard} from "@/components/UserPopupCard";
import {useHoverCard} from "@/hooks/useHoverCard";
import {useIsMobile} from "@/hooks/utils";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import MainStringInput from "@/components/MainStringInput";
import AuthenticatedPageNavClient from "@/components/AuthenticatedPageNavClient";
import {hasPermission} from "@/lib/permissions";
import ResourceDeleteButton from "@/components/ResourceDeleteButton";
import ImageActions from "./ImageActions";
import ui from "@/components/ui/ui.module.css";

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
    const [videoVersion, setVideoVersion] = useState("");
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const lang = useTranslation();

    const isMobile = useIsMobile();
    const rawVideoUrl = image?.location === "R2" && !imageUrl?.startsWith("blob:")
        ? image.urlSet.rawUrl || imageUrl
        : imageUrl;
    const videoUrl = rawVideoUrl ? versionedVideoUrl(rawVideoUrl, videoVersion) : rawVideoUrl;

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
                if (imageDto && user && (imageDto.uploader?.uid == user.uid || hasPermission(user, "BYPASS_IMAGE_PASSWORD"))) {
                    console.log("USER IS UPLOADER, NO PASS NEEDED")
                    const url = imageDto.location == "LOCAL" ? `/api/images/${imageDto.uniqueId}?id=${encodeURIComponent(imageDto.uniqueId)}` : imageDto.urlSet.rawUrl;
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
                if (user && (image.uploader?.uid === user.uid || hasPermission(user, "BYPASS_IMAGE_PASSWORD"))) {
                    setimageUrl(image.location === "LOCAL"
                        ? `/api/images/${image.uniqueId}?id=${encodeURIComponent(image.uniqueId)}`
                        : image.urlSet.rawUrl);
                    setPasswordRequired(false);
                    setShowImage(true);
                    setLoading(false);
                    return;
                }
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

    const handleSubmitPassword = async () => {
        localStorage.setItem("image_password_" + uid, password);
        await fetchImageBlob();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center pb-56 bg-primaryDottedSize bg-primaryDotted">
                <Surface className="p-4 mt-2 mx-4 lg:mx-0 shadow-sm flex flex-col items-center box-primary w-full max-w-lg animate-pulse">
                    <div className="flex flex-col items-center justify-center p-2 w-full space-y-2">
                        <div className="h-7 w-48 bg-zinc-700 rounded" />
                        <div className="h-5 w-24 bg-zinc-800 rounded" />
                    </div>
                    <div className="mt-2 h-5 w-40 bg-zinc-800 rounded" />
                    <div className="mt-4 w-full aspect-video bg-zinc-700 rounded-md" />
                    <div className="mt-5 h-4 w-48 bg-zinc-800 rounded" />
                    <div className="flex flex-row gap-4 mt-6 justify-center w-full">
                        <div className="h-10 w-28 bg-zinc-700 rounded-md" />
                        <div className="h-10 w-28 bg-zinc-700 rounded-md" />
                    </div>
                </Surface>
            </div>
        );
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
            <AuthenticatedPageNavClient />
            {(!passwordRequired && showImage && image.type) ? (
                <>
                    <div className="overflow-x-clip">

                        <div className={"flex min-h-screen w-full items-center justify-center lg:mb-0 pb-56"}>
                            <Surface className={"p-4 mt-2 mx-4 lg:mx-0 shadow-sm flex flex-col items-center box-primary"} onMouseMove={handleMouseMove}>
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
                                            <a
                                                onMouseEnter={handleMouseEnter}
                                                onMouseLeave={handleMouseLeave}
                                                className="font-bold underline text-telegram hover:underline"
                                                href={`/user/${image.uploader.uid}`}
                                            >
                                                {image.uploader.username}
                                            </a>
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
                                            <video
                                                src={videoUrl || ""}
                                                className="max-h-[600px] max-w-full rounded shadow-lg video-js vjs-default-skin"
                                                controls
                                                preload="metadata"
                                                playsInline
                                            >
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


                                <ImageActions image={image} password={password} viewerId={user?.uid}>
                                    {image.type?.toLowerCase() === "mp4" && user?.uid === image.uploader?.uid && (
                                        <VideoConversionControl
                                            kind="image"
                                            id={image.uniqueId}
                                            size={image.size}
                                            apiKey={user?.apiKey}
                                            onComplete={setVideoVersion}
                                        />
                                    )}

                                </ImageActions>

                            </Surface>
                        </div>

                    </div>

                    {
                        image.uploader && (
                            <UserHoverCard open={showCard} position={position} user={image.uploader} memberSince={lang.global.member_since} />
                        )
                    }
                </>
            ) : passwordRequired ? (
                <>
                    <section className="min-h-screen w-full flex items-center justify-center px-4 py-8">
                        <Surface className="w-full max-w-md box-primary rounded-2xl shadow-xl p-5 sm:p-6">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-base sm:text-xl font-bold leading-tight text-whitesmoke">
                                    {lang?.pages?.image_viewer?.password_required}
                                </h1>
                                <ResourceDeleteButton kind="image" id={image.uniqueId} ownerId={image.uploader?.uid} className={ui.button} />
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
                                        className="w-full sm:text-sm text-xs"
                                        inputClassName="pr-12"
                                        required
                                        autoComplete="off"
                                        type={showPassword ? "text" : "password"}
                                        name="image"
                                        id="image"
                                        value={password}
                                        aria-invalid={!!error}
                                        onChange={(e) => setPassword(e)}
                                    />

                                    <div className="absolute inset-y-0 right-2 flex items-center">
                                        <NativeButton
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            variant="ghost"
                                            className="text-gray-300 hover:text-white"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <FaEyeSlash className="h-3 w-3" />
                                            ) : (
                                                <FaEye className="h-3 w-3" />
                                            )}
                                        </NativeButton>
                                    </div>
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

                                <NativeButton variant="primary"
                                    type="submit"
                                    className="w-full bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500/30 transition"
                                >
                                    {lang?.pages?.image_viewer?.view_image_button_placeholder}
                                </NativeButton>
                            </form>
                        </Surface>
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
