import {FaExternalLinkAlt} from "react-icons/fa";
import {Album} from "@/types/album";
import {isVideoFile} from "@/lib/core";
import {errorToast} from "@/lib/client";
import {FaDownload, FaPlay} from "react-icons/fa6";
import {useState} from "react";


export type AlbumGridProps = {
    album: Album;
};

export function AlbumGrid({album}: AlbumGridProps) {

    const [activeVideos, setActiveVideos] = useState<number[]>([]);

    const handleActivateVideo = (idx: number) => {
        setActiveVideos((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    };

    return (
        <>
            <div className="mt-10 w-full grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {album.images.map((image, idx) => (
                    <div
                        className="flex flex-col rounded-xl bg-secondary p-2 h-auto"
                        key={image.uniqueId}
                    >
                        <div className="text-center px-10">
                            <p
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content="Click to copy"
                                data-tooltip-place="top"
                                className="text-xl font-bold text-telegram cursor-pointer hover:underline"
                                onClick={() => errorToast("Lang is not presented!")}
                            >
                                {image.uniqueId + "." + image.type}
                            </p>
                        </div>

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

                        <div className="flex flex-row gap-4 justify-between w-full">
                            <button
                                className="w-full justify-center lg:h-11 h-9 flex items-center gap-2 bg-blue-600 text-white px-2 rounded"
                                onClick={() => errorToast("Lang is not presented!")}
                            >
                                <FaExternalLinkAlt />
                            </button>
                            <button
                                className="w-full justify-center lg:h-11 h-9 flex items-center gap-2 bg-green-600 text-white px-2 rounded"
                                onClick={() => errorToast("Lang is not presented!")}
                            >
                                <FaDownload />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}