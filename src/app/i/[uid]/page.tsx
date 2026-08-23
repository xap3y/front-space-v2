'use client';

import {notFound, useParams, useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {getImageInfoApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import {useImage} from "@/context/ImageContext";
import {getApiUrl, isVideoFile} from "@/lib/core";
import {UploadedImage} from "@/types/image";
import {FaArrowDown, FaCheck, FaDownload, FaGlobe, FaImage, FaLink, FaLock} from "react-icons/fa6";
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
import AuthenticatedPageNavClient from "@/components/AuthenticatedPageNavClient";

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
    const [copiedOption, setCopiedOption] = useState<string | null>(null);
    const copyMenuRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const toggleDropdown = () => setOpen(!open);

    const handleCopyUrl = (option: string, value: string) => {
        if (!value) return errorToast(`${option} is not available`);
        copyToClipboard(value, lang);
        setCopiedOption(option);
        window.setTimeout(() => {
            setOpen(false);
            setCopiedOption(null);
        }, 650);
    };

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
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (!copyMenuRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", close);
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", close);
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

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

        try {
            await deleteImageApi(image.uniqueId, user.apiKey);
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
        } catch (err) {
            toast.update(toastId, {
                render: err instanceof Error ? err.message : "Failed to delete image",
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
        return (
            <div className="flex min-h-screen w-full items-center justify-center pb-56 bg-primaryDottedSize bg-primaryDotted">
                <div className="p-4 mt-2 mx-4 lg:mx-0 shadow-sm flex flex-col items-center box-primary w-full max-w-lg animate-pulse">
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
                </div>
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

                                    <div ref={copyMenuRef} className="relative inline-block text-left">
                                        <button
                                            type="button"
                                            aria-haspopup="menu"
                                            aria-expanded={open}
                                            className={`lg:h-11 h-9 flex items-center gap-2 border px-3 rounded-lg transition ${open ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-primary text-white hover:bg-secondary"}`}
                                            onClick={toggleDropdown}
                                        >
                                            <FaLink className="h-4 w-4" />
                                            {lang.pages.image_viewer.copy_button_text}
                                            <FaArrowDown className={`ml-1 h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                                        </button>

                                        <div
                                            role="menu"
                                            className={`absolute bottom-full right-0 z-50 mb-2 max-h-[calc(100vh-2rem)] w-[min(290px,calc(100vw-1.5rem))] origin-bottom-right overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 text-left shadow-2xl shadow-black/60 backdrop-blur-xl transition duration-150 ${
                                                open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-1 scale-[.98] opacity-0"
                                            }`}
                                        >
                                            <div className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">Copy image link</div>
                                            {[
                                                {key: "Short URL", description: "Compact link for sharing", value: image?.urlSet.shortUrl || "", icon: <FaLink/>},
                                                {key: "Portal URL", description: "Opens this image viewer", value: image?.urlSet.portalUrl || `https://space.xap3y.eu/i/${uid}`, icon: <FaGlobe/>},
                                                {key: "Raw URL", description: "Direct link to the media file", value: image?.urlSet.rawUrl || "", icon: <FaImage/>},
                                            ].map(option => <button
                                                type="button"
                                                role="menuitem"
                                                key={option.key}
                                                disabled={!option.value}
                                                onClick={() => handleCopyUrl(option.key, option.value)}
                                                className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/[.07] focus-visible:bg-white/[.07] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${copiedOption === option.key ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[.035] text-zinc-400 group-hover:text-white"}`}>{copiedOption === option.key ? <FaCheck/> : option.icon}</span>
                                                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-100">{copiedOption === option.key ? "Copied" : option.key}</span><span className="block truncate text-[11px] font-normal text-zinc-500">{option.description}</span></span>
                                            </button>)}
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
