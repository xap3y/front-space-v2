'use client';

import {notFound, useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {getPasteApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import {usePaste} from "@/context/PasteContext";
import {PasteDto} from "@/types/paste";
import hljs from 'highlight.js';

import 'highlight.js/styles/vs2015.min.css';
import {UserPopupCard} from "@/components/UserPopupCard";
import {UserObj} from "@/types/user";
import LanguageModel from "@/types/LanguageModel";
import {useTranslation} from "@/hooks/useTranslation";
import {useIsMobile} from "@/hooks/utils";
import {useHoverCard} from "@/hooks/useHoverCard";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const { paste, setPaste } = usePaste();
    const lang: LanguageModel = useTranslation();

    const isMobile = useIsMobile();

    const {
        showCard,
        position,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseMove,
    } = useHoverCard(isMobile);

    useEffect(() => {
        const fetchPaste = async () => {
            const pasteDto: PasteDto | null = await getPasteApi(uid + "");
            setPaste(pasteDto);
            setLoading(false)
        };

        if (!paste) {
            console.log("Fetching new paste")
            fetchPaste();
        } else {
            console.log("Using cached paste")
            setLoading(false)
        }
        console.log(paste)
    }, [uid, paste, setPaste]);

    useEffect(() => {
        if (paste) {
            if (paste.title.endsWith(".raw")) return
            hljs.highlightAll();
        }
    })

    if (loading) return <LoadingPage/>

    if (!paste) return notFound()

    return (
        <>
            <div
                className="min-h-screen flex flex-col items-center justify-center bg-dark-grey2"
                onMouseMove={handleMouseMove}
            >
                <div className={"flex flex-col gap-2 items-center"}>
                    <span className={"flex flex-col items-center lg:text-3xl text-2xl font-bold text-white"}>
                        {paste.title}
                        <p className={"opacity-60 text-xs"}>{"(" + paste.uniqueId + ")"}</p>
                    </span>
                    <div className={"flex flex-row gap-2 items-center justify-center"}>
                        <p className={"text-lg"}>Pasted by </p>
                        {/*<img src={paste.uploader.avatar} alt={"Uploader Avatar"} className={"rounded-full h-9 w-9"} />*/}
                        <a
                            href={"/user/" + paste.uploader.username} className={"text-telegram hover:underline  text-xl font-bold"}
                            onMouseLeave={handleMouseLeave}
                            onMouseEnter={handleMouseEnter}
                        >
                            {paste.uploader.username}
                        </a>
                    </div>
                    <p>Created at: {paste.createdAt}</p>
                </div>
                <div className={"p-4 mt-4 border-primary-brighter border-2"}>
                    <pre className={"max-h-[500px] max-w-[80vw] lg:text-base text-xs p-2 overflow-y-scroll"}>
                    <code className={""}>
                        {paste.content}
                    </code>
                </pre>
                </div>
                <span>{paste.urlSet.shortUrl}</span>
            </div>

            <div
                className={`pointer-events-none transition-all duration-200 ease-out transform ${
                    showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                style={{ top: position.y + 10, left: position.x + 20 }}
            >
                <UserPopupCard user={paste.uploader as UserObj} lang={lang} />
            </div>
        </>
    )
}