"use client";

import {usePage} from "@/context/PageContext";
import {useEffect, useState} from "react";
import {useTranslation} from "@/hooks/useTranslation";
import {useUser} from "@/hooks/useUser";
import {ShortUrlDto} from "@/types/url";
import LoadingPage from "@/components/LoadingPage";
import {toast} from "react-toastify";
import { FaRegTrashAlt, FaCopy, FaClipboardList, FaPencilAlt } from "react-icons/fa";
import {getUserShortUrls} from "@/lib/apiGetters";
import {ShortUrlPopupCard} from "@/components/ShortUrlPopupCard";
import {debugLog, errorToast, okToast} from "@/lib/client";
import {deleteShortUrl} from "@/lib/apiPoster";
import {DefaultResponse} from "@/types/core";
import {ErrorPage} from "@/components/ErrorPage";
import {useRouter} from "next/navigation";

export default function HomeUrlsPage() {

    const { pageName, setPage } = usePage();
    const { user, loadingUser, error } = useUser();

    const [ loading, setLoading ] = useState<boolean>(true)
    const [ urls, setUrls ] = useState<ShortUrlDto[]>([])
    const [ urlCard, setUrlCard ] = useState<ShortUrlDto>()
    const lang = useTranslation();
    const [fetchError, setFetchError] = useState(false);

    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState({ x: 750, y: 520 });

    const router = useRouter();

    const handleMouseEnter = (url: ShortUrlDto) => {
        setShowCard(true);
        setUrlCard(url);
    }
    const handleMouseLeave = () => setShowCard(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleDelete = async (url: ShortUrlDto) => {
        if (!user?.apiKey) return

        const res = await deleteShortUrl(url, user.apiKey)

        // TODO: Locale
        if (res.error) {
            errorToast(res.message)
        } else {
            setUrls(urls.filter((item) => item.uniqueId !== url.uniqueId));
            okToast("Deleted")
        }
    }

    useEffect(() => {
        debugLog("Loading user data URLS")
        setPage("urls")

        if (loadingUser) {
            debugLog("Loading user data RETUNRED")
            return;
        }

        if (error == 'User not found.') {
            return router.push("/login");
        }

        const fetchShortUrls = async () => {
            const shortUrlsFromApi: ShortUrlDto[] | DefaultResponse = await getUserShortUrls(user?.uid + "");

            if (!Array.isArray(shortUrlsFromApi)) {
                errorToast(shortUrlsFromApi.message)
                setLoading(false)
                setFetchError(true)
                return
            }

            if (shortUrlsFromApi != null) {
                setUrls(shortUrlsFromApi);
                debugLog("Short URLs", shortUrlsFromApi)
            }
            setLoading(false)

        };
        fetchShortUrls()
    }, [user, loadingUser, error])


    if (loading || !user) return <LoadingPage/>

    if (fetchError) {
        return <ErrorPage message={"Failed to fetch URLs"} lang={lang} callBack={()=> {
            router.replace("/")
        }} />
    }

    return (
        <>
            <div className={"w-full xl:px-52 px-2 mt-20"}>
                <div className={"flex items-center justify-center"}>
                    <div className={"flex justify-center flex-col flex-wrap xl:px-20 px-4 gap-8"} onMouseMove={handleMouseMove}>
                        {urls.map((url, index) => (
                            <div className={"flex flex-row justify-between rounded-xl bg-secondary p-2 gap-20 px-6"} key={url.uniqueId}>
                                <div className={"flex flex-col"}>
                                    <div className={"text-center px-10"}>
                                        <p
                                            data-tooltip-id="my-tooltip"
                                            data-tooltip-content={"Click to copy"}
                                            data-tooltip-place="top"
                                            className={"xl:text-xl text-md font-bold text-telegram cursor-pointer hover:underline"}
                                            onClick={() => {
                                                navigator.clipboard.writeText(url.urlSet.rawUrl)
                                                okToast(lang.toasts.success.copied_to_clipboard)
                                            }}
                                        >
                                            {url.urlSet.rawUrl}
                                        </p>
                                    </div>

                                    <div className={"text-center xl:text-md text-xs"}>
                                        <p>{url.originalUrl}</p>
                                    </div>
                                </div>
                                <div className={"flex flex-row gap-4 items-center"}>

                                    <div className={"cursor-pointer"} onMouseEnter={() => {
                                        handleMouseEnter(url)
                                    }} onMouseLeave={handleMouseLeave}>
                                        <FaClipboardList className={"w-6 h-6 text-yellow-500"} />
                                    </div>

                                    <div className={"cursor-pointer"} onClick={() => {
                                        errorToast("Not implemented yet")
                                    }}>
                                        <FaPencilAlt className={"w-6 h-6 text-white"} />
                                    </div>

                                    <button onClick={() => handleDelete(url)} className={"cursor-pointer"}>
                                        <FaRegTrashAlt className={"w-6 h-6 text-red-400"} />
                                    </button>

                                    <div className={"cursor-pointer"} onClick={() => {
                                        navigator.clipboard.writeText(url.urlSet.shortUrl || "")
                                        okToast(lang.toasts.success.copied_to_clipboard)
                                    }}>
                                        <FaCopy className={"w-6 h-6 text-telegram-brightest"} />
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div
                className={`pointer-events-none transition-all duration-200 ease-out transform ${
                    showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                style={{ top: position.y + 10, left: position.x + 20 }}
            >
                <ShortUrlPopupCard url={urlCard ? urlCard : {} as ShortUrlDto } lang={lang} />
            </div>
        </>
    )
}