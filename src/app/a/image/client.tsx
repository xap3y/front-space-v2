"use client";

import React, {useEffect, useState} from "react";
import { useDropzone } from "react-dropzone";
import {useUser} from "@/hooks/useUser";
import {useTranslation} from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import {toast} from "react-toastify";
import { MdOutlineDelete } from "react-icons/md";
import {IoMdClipboard, IoMdRefresh} from "react-icons/io";
import LoadingPage from "@/components/LoadingPage";
import {ImageUploadModifiers, UploadedImage} from "@/types/image";
import {useRouter} from "next/navigation";
import {OrbitProgress} from "react-loading-indicators";
import {errorToast, uploadImage} from "@/lib/client";
import {FaArrowUp} from "react-icons/fa6";
import {useServerDropdown} from "@/hooks/useServerDropdown";
import {callServers} from "@/config/global";
import {useServerPings} from "@/hooks/useServerPings";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css'
import './tweak.css'
import {useIsMobile} from "@/hooks/utils";
import {useHoverCard} from "@/hooks/useHoverCard";
import {CallServer} from "@/types/core";
import {BetaBadge} from "@/components/GlobalComponents";


export default function ImageUploader() {

    const [file, setFile] = useState<File | null>(null);

    const [apiKey, setApiKey] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [customUid, setCustomUid] = useState<string>("");
    const [uploadMaxSize, setUploadMaxSize] = useState<string>("");
    //const [expiryDate, setExpiryDate] = useState<string>("");
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [description, setDescription] = useState<string>("");
    const [hoverServer, setHoverServer] = useState<CallServer | null>(null);

    const { user, loadingUser, error } = useUser();
    const lang: LanguageModel = useTranslation();

    const [isDatePickerOpened, setDatePickerOpened] = useState<boolean>(false);

    const [isPingButtonClicked, setPingButtonClicked] = useState<boolean>(false);

    const [uploading, setUploading] = useState<boolean>(false);
    const [withDescription, setWithDescription] = useState<boolean>(false);
    const [withPassword, setWithPassword] = useState<boolean>(true);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

    const { selected, select, isOpen, toggle, status } = useServerDropdown();

    const getDot = (url: string) => (
        <span className={`w-2 h-2 rounded-full ${status[url] ? "bg-green-500" : "bg-red-500"}`} />
    );

    const router = useRouter();

    const { pings, getServerPing } = useServerPings(callServers);

    const isMobile: boolean = useIsMobile();

    const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);

    const cleanText = (text: string) => text.replace(/[^\x20-\x7E]/g, "");

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': [],
            'video/*': [],
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            setFile(acceptedFiles[0]);
        },
    });

    const handlePingButtonClick = () => {
        if (isPingButtonClicked) return;
        setPingButtonClicked(true);
        getServerPing();
        setTimeout(() => {
            setPingButtonClicked(false);
        }, 200)
    }

    const handleRemoveFile = () => {
        setFile(null);
    };

    const submit: () => void = async () => {
        if (!file || !apiKey) {
            return errorToast("Please fill all required fields!", 2000)
        }
        else if (withPassword && password.length > 0 && password.length < 3) {
            return errorToast("Password length is shorter then 3");
        }
        else if (customUid.length > 0 && customUid.length < 5) {
            return errorToast("Minimum length of Custom UID is 5");
        } else if (customUid.length > 0 && customUid.length > 8) {
            return errorToast("Maximum length of Custom UID is 8");
        }

        const callServerSelected = (selected.name == "Automatic") ? null : selected;

        setShowAdvanced(false)
        setUploading(true)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("apiKey", apiKey);

        if (withPassword && password.length > 2) formData.append("password", password)
        if (description) formData.append("desc", description)
        if (customUid && customUid.length > 5) formData.append("uniqueId", customUid)

        const uploadedImg = await uploadImage(formData, apiKey, callServerSelected, (progress) => {
            setUploadProgress(progress);
        });

        if (!uploadedImg) {
            toast.error("Failed to upload image");
            resetUpload()
            return;
        }

        if (uploadedImg.uploader) uploadedImg.uploader.createdAt = new Date(uploadedImg.uploader.createdAt).toLocaleString()
        uploadedImg.uploadedAt = new Date(uploadedImg.uploadedAt).toLocaleString()

        console.log(uploadedImg)
        console.log(uploadedImage)
        //setUploadedImage(uploadedImg);

        toast.success(lang.pages.portable_image.image_uploaded_alert);

        router.push(uploadedImg.urlSet.portalUrl)
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    }

    useEffect(() => {
        if (!loadingUser && user) {
            setApiKey(user.apiKey);
        }
    }, [loadingUser, user]);

    useEffect(() => {
        console.log("WITH PASS", withPassword)
    }, [withPassword]);

    const resetUpload = () => {
        setFile(null);
        setDescription("")
        setPassword("")
        setCustomUid("")
        setUploadedImage(null);
        setUploading(false)
        setUploadProgress(0);
    }

    if (loadingUser) {
        return (
            <LoadingPage/>
        )
    }

    const handleApiKeyChange = (key: string) => {
        if (key.length == 6) {
            setUploadMaxSize("Maximum size: -1")
        } else {
            setUploadMaxSize("")
        }
    }

    const getServerPingTextColor = (ping: number | null) => {
        if (ping == null) {
            return "text-gray-500";
        } else if (ping < 200) {
            return "text-green-500";
        } else if (ping < 600) {
            return "text-yellow-500";
        } else {
            return "text-red-500";
        }
    }

    return (
        <>
            {!uploadedImage && (
                <form onSubmit={handleSubmit} className={`flex items-center justify-center bg-primary bg-opacity-50 select-none`}>
                    <div id={"test"} className={`${showAdvanced ? "xl:mt-10 mt-2" : "xl:mt-52 mt-32"} transition-all duration-500 ease-in-out p-6 rounded-xl bg-secondary shadow-lg w-full max-w-md xl:min-w-[550px] ${showAdvanced ? "xl:mb-0 mb-44" : ""}`}>
                        <div className="space-y-6">
                            {!file && (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed p-6 text-center rounded-lg cursor-pointer transition border-blue-500 ${
                                        isDragActive ? "border-lime-500 bg-primary_light" : "border-gray-300"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="transition-all duration-200 ease-in-out flex flex-col items-center text-gray-300">
                                        <p className={`${isDragActive ? "text-gray-500" : ""} lg:text-base text-xs`}>{lang.pages.portable_image.drag_and_drop_text}</p>
                                        {/*<p className={`${(uploadMaxSize.length == 0) ? "opacity-0" : "opacity-80"} ${isDragActive ? "text-gray-500" : ""} duration-500 transition-all lg:text-base text-xs`}>{uploadMaxSize}</p>*/}
                                    </div>
                                </div>
                            )}
                            {file && (
                                <div className="flex justify-between items-center p-2 border-2 border-lime-700 rounded-lg">
                                    <span>{cleanText(file.name)}</span>
                                    <button className={"ml-2"} onClick={handleRemoveFile}> <MdOutlineDelete className={"w-6 h-6 text-red-500"} /> </button>
                                </div>
                            )}
                            <input
                                type="text"
                                placeholder={lang.global.api_key_input_placeholder}
                                value={apiKey}
                                disabled={!!user}
                                onChange={(e) => {
                                    setApiKey(e.target.value)
                                    handleApiKeyChange(e.target.value)
                                }}
                                className={`lg:text-base text-xs text-security-disc w-full p-3 border ${!!user ? "border-lime-500 bg-lime-500 bg-opacity-10" : ""} rounded bg-transparent focus:outline-none ${uploading ? "disabled":""} ${!!user ? "cursor-not-allowed" : ""}`}
                            />


                            <div className={"flex flex-col gap-2 items-start"}>
                                <div className={"flex gap-3"}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!uploading) setShowAdvanced(!showAdvanced)
                                        }}
                                        className="flex gap-2 items-center pl-2 text-sm text-primary-brighter hover:underline focus:outline-none"
                                    >
                                        {showAdvanced ? lang.global.hide_advanced_settings : lang.global.show_advanced_settings}

                                        <FaArrowUp
                                            className={`ml-auto transition-transform duration-500 ${showAdvanced ? "" : "rotate-180"}`}
                                            size={16}
                                            color={"white"}
                                            style={{ strokeWidth: 1.5 }}
                                        />
                                    </button>
                                    <BetaBadge />
                                </div>
                                <div
                                    className={`transition-all duration-500 overflow-hidden w-full pl-2 ${showAdvanced ? "max-h-[500px] mt-4" : "max-h-0"}`}
                                >
                                    {/* TODO: LOCALE */}
                                    <span className={"text-gray-500 italic text-xs"}>Following fields are optional</span>
                                    <div className="flex gap-4 items-center mb-4 mt-2">
                                        <input
                                            type="text"
                                            placeholder={lang.global.description}
                                            disabled={uploading}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="xl:text-base text-xs w-full p-3 border rounded bg-transparent focus:outline-none"
                                        />
                                    </div>

                                    <div className="mb-4 flex justify-between items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder={lang.pages.login.password_placeholder}
                                            value={password}
                                            disabled={uploading || !withPassword}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`xl:text-base text-xs text-security-disc w-full p-3 border rounded bg-transparent focus:outline-none`}
                                        />
                                    </div>

                                    <div className="mb-4 w-full">
                                        {/*<span>Expiry date</span>*/}
                                        {/*<input
                                        type="datetime-local"
                                        placeholder="Expiry Date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        disabled={uploading}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="xl:text-base max-w-full text-xs w-full p-3 border rounded bg-transparent focus:outline-none"
                                    />*/}

                                        {/*<DatePicker
                                        selected={expiryDate}
                                        onChange={(date: Date | null) => setExpiryDate(date)}
                                        minDate={new Date()}
                                        className="xl:text-base text-xs w-full p-3 border rounded bg-transparent focus:outline-none text-white border-zinc-600 placeholder-gray-400"
                                        dateFormat="yyyy-MM-dd"
                                    />*/}

                                        {/*<input
                                        type="text"
                                        placeholder="Select Expiry Date"
                                        readOnly
                                        value={expiryDate ? expiryDate.toLocaleString() : ''}
                                        onClick={handleInputClick} // Manually trigger open on input click
                                        className="w-full p-3 border rounded bg-transparent focus:outline-none text-white"
                                        id="expiry-date"
                                    />*/}

                                        <div className={`cursor-pointer xl:text-base text-xs border rounded w-full p-3 ${isDatePickerOpened ? "hidden" : ""}`} onClick={() => {
                                            setDatePickerOpened(!isDatePickerOpened)
                                        }}>
                                            {expiryDate ?
                                                <>
                                                    <span>{expiryDate.toLocaleString()}</span>
                                                </> :
                                                <>
                                                    <span className={`text-gray-400`}>Select Expiry Date</span>
                                                </>
                                            }
                                        </div>

                                        <div className={`cursor-pointer xl:text-base text-xs border rounded w-full p-3 ${isDatePickerOpened ? "" : "hidden"}`} onClick={() => {
                                            setDatePickerOpened(false)
                                        }}>
                                            <span className={`text-gray-400`}>Select Expiry Date</span>
                                        </div>

                                        {
                                            isDatePickerOpened && (
                                                <DatePicker
                                                    selected={expiryDate}
                                                    open={true}
                                                    //onCalendarClose={() => setDatePickerOpened(false)}
                                                    onSelect={() => setDatePickerOpened(false)}
                                                    onChange={(date: Date | null) => setExpiryDate(date)}
                                                    onClickOutside={() => setDatePickerOpened(false)}
                                                    showTimeSelect
                                                    dateFormat="Pp"
                                                    className="hidden"
                                                    minDate={new Date()}
                                                    placeholderText="Expiry date"
                                                    wrapperClassName={"w-full hidden"}
                                                />
                                            )
                                        }

                                    </div>

                                    <div className="mb-4 flex justify-between items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Custom UID"
                                            value={customUid}
                                            disabled={uploading}
                                            onChange={(e) => setCustomUid(e.target.value)}
                                            className="xl:text-base text-xs w-full p-3 border rounded bg-transparent focus:outline-none"
                                        />
                                    </div>

                                    <div className={"flex justify-center lg:flex-row flex-col items-center lg:gap-2 gap-1 w-full"}>
                                        <span>Call server:</span>

                                        <div className={"flex items-center gap-1"}>
                                            <div className="overflow-visible min-w-52 text-white">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!uploading) toggle()
                                                    }}
                                                    className="w-full flex items-center justify-between px-2 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        {selected.flag && <img src={selected.flag} alt={""} className="w-4 h-3" />}
                                                        {selected.flag && getDot(selected.url)}
                                                        <span className="truncate">{selected.name}</span>
                                                    </div>
                                                    <svg
                                                        className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                <div
                                                    className={`absolute mt-1 min-w-52 bg-zinc-900 rounded border border-zinc-700 shadow-lg z-50 overflow-hidden transform transition-all duration-500 ease-in-out origin-top ${
                                                        isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                                                    }`}
                                                    onMouseMove={handleMouseMove}
                                                >
                                                    {callServers.map(server => (
                                                        <button
                                                            type="button"
                                                            key={server.url}
                                                            onClick={() => select(server)}
                                                            onMouseEnter={() => {
                                                                setHoverServer(server)
                                                                handleMouseEnter()
                                                            }}
                                                            onMouseLeave={() => {
                                                                setHoverServer(null)
                                                                handleMouseLeave()
                                                            }}
                                                            className="w-full px-2 py-1 text-left text-xs hover:bg-zinc-700 flex items-center justify-between gap-2"
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                {server.flag && <img src={server.flag} alt={""} className="w-4 h-3" />}
                                                                {(server.flag && pings[server.url]) ? getDot(server.url) : (server.flag) && (<span className={`w-2 h-2 rounded-full bg-gray-600`}></span>)}
                                                                {(server.name == "Automatic") ? <div className="mr-1 w-1 h-1"></div> : <></>}
                                                                <span className={`truncate ${(selected.name == server.name) ? "font-bold" : ""}`}>{server.name}</span>
                                                            </div>
                                                            {server.flag && (
                                                                <div className={`text-gray-400 ${getServerPingTextColor(pings[server.url])} min-w-[40px] text-right text-[11px]`}>
                                                                    {
                                                                        status[server.url] ? (
                                                                            (pings[server.url] != null) ? `${pings[server.url]}ms` : "..."
                                                                        ) : (
                                                                            "N/A"
                                                                        )
                                                                    }
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <IoMdRefresh onClick={handlePingButtonClick} className={`w-[25px] h-[25px] cursor-pointer rounded-full ${isPingButtonClicked ? "rotate-180" : ""} ${isMobile ? "" : "hover:bg-white hover:bg-opacity-10"} duration-150`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!uploading ? (
                                <button type={"submit"} disabled={uploading} className="w-full bg-blue-500 text-white p-2 rounded">
                                    {lang.pages.portable_image.button_text}
                                </button>) : (
                                <>
                                    <div className={"flex items-center justify-center"}>
                                        <OrbitProgress color="#32cd32" variant={"dotted"} size={"small"} text="" textColor=""/>
                                    </div>
                                </>
                            )}

                            {uploading && (
                                <div className="mt-4">
                                    <p>Upload Progress: {uploadProgress}%</p>
                                    <div className="w-full bg-gray-300 rounded h-4">
                                        <div
                                            className="bg-blue-500 h-4 rounded"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            )}

            {/*{uploadedImage && (
                <>
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="p-6 rounded shadow-lg w-full max-w-md">
                            <div className="space-y-4">
                                {isVideoFile(uploadedImage.type) ? (
                                    <>
                                        <video className={"max-h-[600px] rounded-lg"} controls>
                                            <source src={uploadedImage.urlSet.rawUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </>

                                ) : <img src={uploadedImage.urlSet.rawUrl} alt={uploadedImage.uniqueId} className={"w-full rounded-lg"} />}

                                <div className="flex justify-between items-center p-2 border-2 border-primary_light rounded-lg">
                                    <span>{uploadedImage.urlSet.shortUrl}</span>
                                    <div className={"flex"}>
                                        <button onClick={() => copyToClipboard(uploadedImage.urlSet.shortUrl || uploadedImage.urlSet.portalUrl)}> <IoMdClipboard className={"w-6 h-6 hover:text-telegram duration-200"} /> </button>
                                        <button className={"ml-3"} onClick={resetUpload}> <MdOutlineDelete className={"w-6 h-6 hover:text-red-600 duration-200"} /> </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}*/}

            <a href={"/i"} className={"xl:text-base text-xs fixed bottom-6 left-4 z-50 flex text-telegram underline opacity-50"}>
                Image finder {">"}
            </a>

            <div
                className={`pointer-events-none transition-all duration-200 ease-out transform ${
                    showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                style={{ top: position.y + 10, left: position.x + 20 }}
            >
                {hoverServer && (
                    <div className={"flex flex-col"}>
                        <div className={"flex items-center gap-2"}>
                            {hoverServer.flag && <img src={hoverServer.flag} alt={""} className="w-4 h-3" />}
                            <span className={"text-sm font-bold"}>{hoverServer.name}</span>
                            {hoverServer.flag && getDot(hoverServer.url)}
                        </div>

                        <div className={"flex items-center gap-2"}>
                            {
                                hoverServer.name == "Automatic" ? (
                                    <>
                                        <span className={"text-xs text-gray-400"}>
                                            Automatically uses the best server with best response time
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className={`text-xs ${getServerPingTextColor(pings[hoverServer.url])}`}>
                                            {status[hoverServer.url] ? (
                                                (pings[hoverServer.url] != null) ? `${pings[hoverServer.url]}ms` : "..."
                                            ) : (
                                                "N/A"
                                            )}
                                        </span>
                                    </>
                                )
                            }
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}