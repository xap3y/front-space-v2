"use client";

import React, {useEffect, useState} from "react";
import { toast } from "react-toastify";
import {useUser} from "@/hooks/useUser";
import {createPaste} from "@/lib/apiPoster";
import LoadingPage from "@/components/LoadingPage";
import {useTranslation} from "@/hooks/useTranslation";

export default function PortablePasteCreator() {

    const { user, loadingUser, error } = useUser();
    const [paste, setPaste] = useState<string>("");
    const [apiKey, setApiKey] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [pasteUrl, setPasteUrl] = useState<string>("");

    const lang = useTranslation();

    const submit: () => void = async () => {
        if (!apiKey || !paste || !title) {
            return toast.error("Please fill all required fields!");
        }
        else if (apiKey.length < 5) {
            return toast.error(lang.global.bad_api_key_alert);
        } else if (paste.length < 5) {
            return toast.error(lang.pages.portable_paste.invalid_paste_length_alert);
        } else if (title.length < 4) {
            return toast.error(lang.pages.portable_paste.invalid_title_length_alert);
        }

        setLoading(true);
        const data = await createPaste(title, paste, apiKey);
        setLoading(false)
        if (!data) {
            setPasteUrl("");
            return toast.error("Failed to create Paste");
        }
        setPaste("");
        setTitle("");
        setPasteUrl(data.urlSet.rawUrl);
        toast.success(lang.pages.portable_paste.paste_created_alert);
    };

    useEffect(() => {
        if (!loadingUser && user) {
            setApiKey(user.apiKey);
        }
    }, [loadingUser, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    }

    if (loadingUser) {
        return (
            <LoadingPage/>
        )
    }

    return (
        <>
            <main className={"w-full flex flex-col justify-center items-center"}>
                <div className={"mt-52"}>

                </div>

                <div className={"mt-10 bg-primary_light border-2 rounded-xl border-secondary p-4 flex flex-col items-center"}>
                    <h1 className={"mb-12 text-xl font-extrabold"}>{lang.pages.portable_paste.title}</h1>

                    <form onSubmit={handleSubmit} className={"flex flex-col gap-4"}>

                        <input
                            className={"bg-primary px-4 py-3 outline-none text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040]"}
                            name="title"
                            required
                            placeholder={lang.pages.portable_paste.title_input_placeholder}
                            type="text"
                            value={title}
                            autoComplete={"new-password"}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <textarea
                            className={"bg-primary h-44 px-4 py-3 outline-none lg:w-[500px] w-[300px] text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040]"}
                            name="text"
                            required
                            placeholder={lang.pages.portable_paste.paste_input_placeholder}
                            value={paste}
                            autoComplete={"new-password"}
                            onChange={(e) => setPaste(e.target.value)}
                        />

                        <input
                            className={`bg-primary px-4 py-3 outline-none text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040] ${!!user ? "cursor-not-allowed" : ""} `}
                            name="text"
                            required
                            placeholder={lang.global.api_key_input_placeholder}
                            type="password"
                            value={apiKey}
                            id="api-key"
                            disabled={!!user}
                            autoComplete={"new-password"}
                            onChange={(e) => setApiKey(e.target.value)}
                        />

                        <button
                            className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-primary/30 backdrop-blur-lg px-6 py-2 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-gray-600/5 border border-white/20"
                            disabled={!!pasteUrl}
                            type="submit"
                        >
                            <span className="text-lg">{loading ? lang.global.processing_button_text : lang.pages.portable_paste.button_text}</span>
                            <div
                                className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]"
                            >
                                <div className="relative h-full w-10 bg-white/20"></div>
                            </div>
                        </button>
                    </form>
                </div>

                {(!loading && pasteUrl) && (
                    <div>
                        <div className={"mt-4 bg-primary_light border-2 rounded-xl border-secondary p-4 flex flex-col items-center"}>
                            <h1 className={"mb-4 text-xl font-extrabold"}>{lang.pages.portable_paste.view_paste_text}</h1>
                            <a href={pasteUrl} target="_blank" rel="noreferrer" className={"text-telegram"}>{pasteUrl}</a>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}