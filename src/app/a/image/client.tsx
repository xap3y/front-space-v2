"use client";

import React, {useEffect, useState} from "react";
import { useDropzone } from "react-dropzone";
import {useUser} from "@/hooks/useUser";
import {useTranslation} from "@/hooks/useTranslation";
import LanguageModel from "@/types/LanguageModel";
import {toast} from "react-toastify";
import {createPaste, uploadImage} from "@/lib/apiPoster";
import { MdOutlineDelete } from "react-icons/md";
import { IoMdClipboard } from "react-icons/io";
import LoadingPage from "@/components/LoadingPage";
import {UploadedImage} from "@/types/image";
import {isVideoFile} from "@/lib/core";
import {useRouter} from "next/navigation";


export default function ImageUploader() {

    const [file, setFile] = useState<File | null>(null);
    const [apiKey, setApiKey] = useState("");
    const { user, loadingUser, error } = useUser();
    const lang: LanguageModel = useTranslation();
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

    const router = useRouter();

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

    const handleRemoveFile = () => {
        setFile(null);
    };


    const submit: () => void = async () => {
        if (!file || !apiKey) {
            return toast.error("Please fill all required fields!");
        }

        setUploading(true)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("apiKey", apiKey);

        const uploadedImg = await uploadImage(formData, apiKey, (progress) => {
            setUploadProgress(progress);
        });

        if (!uploadedImg) {
            toast.error("Failed to upload image");
            return;
        }

        uploadedImg.uploader.createdAt = new Date(uploadedImg.uploader.createdAt).toLocaleString()
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(lang.toasts.success.copied_to_clipboard, {
            autoClose: 500,
            closeOnClick: true
        });
    }

    useEffect(() => {
        if (!loadingUser && user) {
            setApiKey(user.apiKey);
        }
    }, [loadingUser, user]);

    const resetUpload = () => {
        setFile(null);
        setUploadedImage(null);
        setUploadProgress(0);
    }

    if (loadingUser) {
        return (
            <LoadingPage/>
        )
    }

    return (
        <>
            {!uploadedImage && (
                <form onSubmit={handleSubmit} className="fixed inset-0 flex items-center justify-center bg-primary bg-opacity-50">
                    <div className="p-6 rounded-xl bg-secondary shadow-lg w-full max-w-md">
                        <div className="space-y-4">
                            {!file && (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed p-6 text-center rounded-lg cursor-pointer transition border-blue-500 ${
                                        isDragActive ? "border-lime-500 bg-primary_light" : "border-gray-300"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="flex flex-col items-center text-gray-300">
                                        <p className={`${isDragActive ? "text-gray-500" : ""}`}>{lang.pages.portable_image.drag_and_drop_text}</p>
                                    </div>
                                </div>
                            )}
                            {file && (
                                <div className="flex justify-between items-center p-2 border-2 border-primary_light rounded-lg">
                                    <span>{cleanText(file.name)}</span>
                                    <button className={"ml-2"} onClick={handleRemoveFile}> <MdOutlineDelete className={"w-6 h-6"} /> </button>
                                </div>
                            )}
                            <input
                                type="password"
                                placeholder={lang.global.api_key_input_placeholder}
                                value={apiKey}
                                disabled={!!user}
                                onChange={(e) => setApiKey(e.target.value)}
                                className={`w-full p-2 border rounded bg-transparent focus:outline-none ${!!user ? "cursor-not-allowed" : ""}`}
                            />

                            <button type={"submit"} disabled={uploading} className="w-full bg-blue-500 text-white p-2 rounded">
                                {uploading ? "Uploading..." : lang.pages.portable_image.button_text}
                            </button>

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

            {uploadedImage && (
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
            )}
        </>
    )
}