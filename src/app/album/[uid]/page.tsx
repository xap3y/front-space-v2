'use client';

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {Album} from "@/types/album";
import {getImageAlbum} from "@/lib/client";
import LoadingPage from "@/components/LoadingPage";
import {AlbumGrid} from "@/components/AlbumGrid";
import {ErrorToast} from "@/components/ErrorToast";
import {getImageAlbumServer} from "@/lib/apiGetters";

export default function Page() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [album, setAlbum] = useState<Album | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [infoToast, setInfoToast] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlbum = async () => {
            const album = await getImageAlbumServer(uid + "");

            if (album) {
                setAlbum(album);

                if (album.images.length > 10) {
                    setInfoToast("This album contains more than 10 items, some may not be displayed automatically.");
                }
            } else {
                setError("Failed to fetch album for UID + " + uid);
            }
        }
        fetchAlbum().finally(() => {
            setLoading(false);
        });
    }, [uid])

    if (loading) return <LoadingPage />;

    else if (error) return <div>Error: {error}</div>;

    else if (!album) return <div>Album not found</div>;

    return (
        <>
            {infoToast && (
                <ErrorToast type={"WARN"} message={infoToast} />
            )}
            <main className={"overflow-y-scroll w-full h-full flex flex-col items-center justify-center lg:px-20 px-2 pt-10"}>
                <h1 className={"text-4xl font-bold"}>{`Album #${album.uniqueId}`}</h1>

                <p className={"mt-2"}>{album.description}</p>

                <AlbumGrid album={album} />
            </main>
        </>
    )
}