'use client';

import {useState} from "react";
import {toast} from "react-toastify";
import {useRouter} from 'next/navigation'
import { useUser } from '@/context/UserContext';
import LoadingPage from "@/components/LoadingPage";
import {getImageInfoApi} from "@/lib/apiGetters";
import {useImage} from "@/context/ImageContext";
import {UploadedImage} from "@/types/image";

export default function ImageFinder() {

    const router = useRouter()
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(false);
    const { image, setImage } = useImage();

    const findImage = async () => {

        if (uid == "") {
            return toast.error("Please enter a uniqueId");
        }
        setLoading(true)
        const img: UploadedImage | null = await getImageInfoApi(uid + "");

        if (img == null) {
            setLoading(false)
            return toast.error("Image not found");
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
                <main className="flex items-center justify-center min-h-screen">
                    <div className="max-w-lg w-full mx-3">
                        <div
                            className="bg-primary_light rounded-lg shadow-xl overflow-hidden"
                        >
                            <div className="p-4">
                                <h1 className="text-3xl font-bold text-center text-white">Image Finder</h1>
                                <p className="text-center">Find a image by unique identifier</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4" >
                                <div className="mb-4">
                                    <input
                                        placeholder= "Image Unique ID"
                                        className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm"
                                        required
                                        autoComplete="new-password"
                                        type="text"
                                        name="uid"
                                        id="uid"
                                        value={uid}
                                        onChange={(e) => setUid(e.target.value)}
                                    />
                                </div>
                                <div className="mb-4">
                                    <button
                                        type={"submit"}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-telegram hover:bg-telegram-brightest hover:text-primary focus:outline-none transition-all duration-200 transform"
                                        onClick={findImage}
                                    >
                                        Lookup Image
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            )}
        </>
    )
}