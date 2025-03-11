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


export default function ImageUploader() {

    const [file, setFile] = useState<File | null>(null);
    const [apiKey, setApiKey] = useState("");
    const { user, loadingUser, error } = useUser();
    const lang: LanguageModel = useTranslation();

    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

    const cleanText = (text: string) => text.replace(/[^\x20-\x7E]/g, ""); // Removes non-ASCII

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'image/*': [] },
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

        const formData = new FormData();
        formData.append("file", file);
        formData.append("apiKey", apiKey);

        const uploadedImage = await uploadImage(formData, apiKey);
        setUploadedImage(uploadedImage);
        console.log(uploadedImage)

        if (!uploadedImage) {
            toast.error("Failed to upload image");
            return;
        }

        toast.success(lang.pages.portable_image.image_uploaded_alert);

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

    if (loadingUser) {
        return (
            <LoadingPage/>
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="p-6 rounded shadow-lg w-full max-w-md">
                    <div className="space-y-4">
                        {!file && (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed p-6 text-center rounded-lg cursor-pointer transition ${
                                    isDragActive ? "border-blue-500 bg-primary_light" : "border-gray-300"
                                }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center text-gray-600">
                                    <p className={`${isDragActive ? "text-whitesmoke" : ""}`}>{lang.pages.portable_image.drag_and_drop_text}</p>
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
                        <button type={"submit"} disabled={!file || !apiKey} className="w-full bg-blue-500 text-white p-2 rounded">
                            {lang.pages.portable_image.button_text}
                        </button>
                    </div>
                </div>
            </form>

            {uploadedImage && uploadedImage.urlSet && (
                <>
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="p-6 rounded shadow-lg w-full max-w-md">
                            <div className="space-y-4">
                                <img src={uploadedImage.urlSet.rawUrl} alt={uploadedImage.uniqueId} className={"w-full rounded-lg"} />
                                <div className="flex justify-between items-center p-2 border-2 border-primary_light rounded-lg">
                                    <span>{uploadedImage.urlSet.shortUrl}</span>
                                    <div className={"flex"}>
                                        <button onClick={() => copyToClipboard(uploadedImage.urlSet.shortUrl || "")}> <IoMdClipboard className={"w-6 h-6 hover:text-telegram duration-200"} /> </button>
                                        <button className={"ml-3"} onClick={() => setUploadedImage(null)}> <MdOutlineDelete className={"w-6 h-6 hover:text-red-600 duration-200"} /> </button>
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