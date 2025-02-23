'use client';

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {getPasteApi} from "@/lib/apiGetters";
import LoadingPage from "@/components/LoadingPage";
import NotFound from "next/dist/client/components/not-found-error";
import {usePaste} from "@/context/PasteContext";
import {PasteDto} from "@/types/paste";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const { paste, setPaste } = usePaste();

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

    return (
        <>
            {loading && (
                <LoadingPage/>
            )}

            {(!paste && !loading) && (
                <NotFound/>
            )}

            {paste && (
                <div className="min-h-screen flex flex-col items-center justify-center bg-dark-grey2">
                    <div className={"flex flex-col gap-2 items-center"}>
                        <h1 className={"text-3xl font-bold text-white"}>Paste: {paste.uniqueId}</h1>
                        <div className={"flex flex-row gap-2 items-center justify-center"}>
                            <img src={paste.uploader.avatar} alt={"Uploader Avatar"} className={"rounded-full h-9 w-9"} />
                            <a href={"/user/" + paste.uploader.username} className={"text-telegram text-xl font-bold"}>{paste.uploader.username}</a>
                        </div>
                        <p>Uploaded at: {paste.isPublic}</p>
                    </div>
                    <pre className={"mt-4 border-primary-brighter border-2 p-4"}>
                        {paste.content}
                    </pre>
                </div>
            )}
        </>
    )
}