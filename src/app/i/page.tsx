'use client';

import {useState} from "react";
import {useRouter} from 'next/navigation'
import LoadingPage from "@/components/LoadingPage";
import {getImageInfoApi} from "@/lib/apiGetters";
import {useImage} from "@/context/ImageContext";
import {UploadedImage} from "@/types/image";
import {errorToast} from "@/lib/client";
import {useTranslation} from "@/hooks/useTranslation";

export default function ImageFinder() {

    const router = useRouter()
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(false);
    const { image, setImage } = useImage();
    const lang = useTranslation();

    const findImage = async () => {

        if (uid == "") {
            return errorToast(lang.pages.image_finder.empty_field_error, 600);
        }
        setLoading(true)
        const img: UploadedImage | null = await getImageInfoApi(uid + "");

        if (img == null) {
            setLoading(false)
            return errorToast(lang.pages.image_finder.no_image_found_error, 1000);
        }
        setImage(img);
        router.push(`/i/${img.uniqueId}`)
    }

    const handleSubmit = async (e: unknown) => {
        // @ts-ignore
        e.preventDefault();
    }

    return (
        <>

            {loading && (
                <LoadingPage/>
            )}

            {!loading && (
                <main className="flex overflow-y-hidden mt-40 lg:mt-0 lg:items-center justify-center lg:min-h-screen">
                    <div className="overflow-y-hidden max-w-lg w-full mx-3">
                        <div
                            className="bg-primary_light rounded-lg shadow-xl overflow-hidden"
                        >
                            <div className="p-4">
                                <h1 className="text-3xl font-bold text-center text-white">{lang.pages.image_finder.title}</h1>
                                <p className="text-center">{lang.pages.image_finder.subtitle}</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4" >
                                <div className="mb-4">
                                    <input
                                        placeholder={lang.pages.image_finder.input_placeholder}
                                        className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm"
                                        required
                                        type="text"
                                        name="uid"
                                        id="uid"
                                        value={uid}
                                        onChange={(e) => setUid(e.target.value)}
                                    />
                                </div>
                                <div className="mb-2 flex flex-col items-center gap-4">
                                    <button
                                        type={"submit"}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-telegram hover:bg-telegram-brightest hover:text-primary focus:outline-none transition-all duration-200 transform"
                                        onClick={findImage}
                                    >
                                        {lang.pages.image_finder.button_text}
                                    </button>

                                    <a href={"/a/image"} className={"text-telegram opacity-70 cursor-pointer font-medium hover:underline text-sm"}>Portable image uploader</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            )}
        </>
    )
}