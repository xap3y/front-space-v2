'use client';

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {getPasteApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import NotFound from "next/dist/client/components/not-found-error";
import {usePaste} from "@/context/PasteContext";
import {PasteDto} from "@/types/paste";
import hljs from 'highlight.js';

import 'highlight.js/styles/vs2015.min.css';
import {UserPopupCard} from "@/components/UserPopupCard";
import {UserObj} from "@/types/user";
import LanguageModel from "@/types/LanguageModel";
import {useTranslation} from "@/hooks/useTranslation";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState({ x: 1060, y: 312 });
    const { paste, setPaste } = usePaste();
    const lang: LanguageModel = useTranslation();

    const handleMouseEnter = () => setShowCard(true);
    const handleMouseLeave = () => setShowCard(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };

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
            hljs.highlightAll();
        }
    })

    if (loading) return <LoadingPage/>

    if (!paste) return <NotFound/>

    return (
        <>
            <div
                className="min-h-screen flex flex-col items-center justify-center bg-dark-grey2"
                onMouseMove={handleMouseMove}
            >
                <div className={"flex flex-col gap-2 items-center"}>
                    <h1 className={"text-3xl font-bold text-white"}>Paste: {paste.uniqueId}</h1>
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
                    <pre className={"max-h-[500px] p-2 overflow-y-scroll"}>
                    <code className={""}>
                        {paste.content}
                    </code>
                </pre>
                </div>
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