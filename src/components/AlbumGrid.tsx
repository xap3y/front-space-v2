import {FaExternalLinkAlt} from "react-icons/fa";
import {Album} from "@/types/album";
import {isVideoFile} from "@/lib/core";
import {copyToClipboard, errorToast} from "@/lib/client";
import {FaArrowDown, FaDownload, FaPlay} from "react-icons/fa6";
import {useEffect, useState} from "react";
import {useTranslation} from "@/hooks/useTranslation";

export type AlbumGridProps = {
    album: Album;
};

export function AlbumGrid({album}: AlbumGridProps) {

    const [activeVideos, setActiveVideos] = useState<number[]>([]);

    const [openedDropdown, setOpenCopyDropbox] = useState<number | null>(null);

    const toggleDropdown = (idx: number) => {
        if (openedDropdown === idx) {
            setOpenCopyDropbox(null);
        } else {
            setOpenCopyDropbox(idx);
        }
    }

    const closeAllDropdowns = () => {
        setOpenCopyDropbox(null);
    }

    const lang = useTranslation();

    const handleActivateVideo = (idx: number) => {
        setActiveVideos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    };

    const handleVideoLoad = (idx: number) => {
        console.log("Loading video for index:", idx);
        setActiveVideos((prev) => {
            if (!prev.includes(idx)) {
                return [...prev, idx];
            }
            return prev;
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            console.log("LOAD");
            if (activeVideos.length < album.images.length) {
                handleVideoLoad(activeVideos.length);
            }
        }, 2000);

        return () => {
            console.log("Clearing interval for album images loading");
            clearInterval(interval)
        };
    }, [album, activeVideos])

    return (
        <>
            <div className="mt-10 w-full grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {album.images.map((image, idx) => (
                    <div
                        className="flex flex-col rounded-xl bg-secondary p-2 h-auto"
                        key={image.uniqueId}
                    >
                        <div className="text-center px-10 flex items-center justify-center gap-2">
                            <p
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content="Click to copy"
                                data-tooltip-place="top"
                                className="text-xl font-bold text-telegram cursor-pointer hover:underline"
                                onClick={() => copyToClipboard(image.uniqueId, lang)}
                            >
                                {image.uniqueId + "." + image.type}
                            </p>
                            {!activeVideos.includes(idx) && (
                                <svg
                                    className="animate-spin ml-2 h-4 w-4 text-telegram inline"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                            )}
                        </div>

                        {
                            image.description && (
                                <div className="text-center text-xs text-white">
                                    <p>{image.description}</p>
                                </div>
                            )
                        }

                        <div className="text-center text-white">
                            <p>{Math.round(image.size / 1024) + " Kb"}</p>
                        </div>

                        <div className="my-2 flex items-center justify-center h-full rounded-xl p-4 max-w-[550px] bg-primary_light mx-auto">
                            {isVideoFile(image.type) ? (
                                activeVideos.includes(idx) ? (
                                    <video
                                        className="max-h-[240px] rounded shadow-lg bg-black"
                                        controls
                                        onError={e => {
                                            return;
                                        }}
                                    >
                                        <source src={image.urlSet.rawUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="w-full min-h-[120px] min-w-[300px] h-full flex items-center justify-center bg-black rounded relative">
                                        <button
                                            className="absolute inset-0 flex items-center justify-center"
                                            onClick={() => handleActivateVideo(idx)}
                                        >
                                        <span className="bg-black bg-opacity-60 rounded-full p-4">
                                          <FaPlay className="text-white text-3xl" />
                                        </span>
                                                            </button>
                                                        </div>
                                                    )
                            ) : (
                                <img
                                    className="rounded object-contain w-full max-h-[240px] bg-black"
                                    src={image.urlSet.rawUrl}
                                    alt={image.uniqueId}
                                />
                            )}
                        </div>

                        <div className="flex flex-row gap-4 w-full lg:h-11 h-9">
                            <button
                                className="w-full justify-center flex items-center gap-2 bg-blue-600 text-white px-2 rounded"
                                onClick={() => window.open(image.urlSet.portalUrl, "_blank")}
                            >
                                <FaExternalLinkAlt />
                            </button>
                            <button
                                className="w-full justify-center  flex items-center gap-2 bg-green-600 text-white px-2 rounded"
                                onClick={() => window.open(image.urlSet.rawUrl + "?download=true", "_blank")}
                            >
                                <FaDownload />
                            </button>

                            <div className="w-full relative inline-block text-left">
                                <button
                                    className="w-full justify-center flex items-center gap-2 bg-telegram text-white px-2 rounded"
                                    onClick={() => toggleDropdown(idx)}
                                >
                                    <FaArrowDown className={`${(openedDropdown == idx) ? "rotate-180" : ""} duration-200`} />
                                    {lang.pages.image_viewer.copy_button_text}
                                </button>

                                <div
                                    className={`absolute right-0 mt-1 min-w-52 bg-zinc-900 rounded border border-zinc-700 shadow-lg z-50 overflow-hidden transform transition-all duration-300 ease-in-out origin-top ${
                                        (openedDropdown == idx) ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
                                    }`}
                                >

                                    <button
                                        key={"short"}
                                        onClick={() => {
                                            closeAllDropdowns()
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
                                            closeAllDropdowns()
                                            copyToClipboard(image.urlSet.portalUrl, lang)
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 text-white"
                                    >
                                        Portal URL
                                    </button>

                                    <hr className="border-zinc-700" />

                                    <button
                                        key={"raw"}
                                        onClick={() => {
                                            closeAllDropdowns()
                                            copyToClipboard(image?.urlSet.rawUrl || "", lang)
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 text-white"
                                    >
                                        Raw URL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}