"use client";

import {useEffect, useState} from "react";
import { toast } from "react-toastify";
import {useUser} from "@/hooks/useUser";
import {createShortUrl} from "@/lib/apiPoster";
import LoadingPage from "@/components/LoadingPage";
import {okToast} from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";

export default function UrlShortener() {

    const { user, loadingUser, error } = useUser();
    const [url, setUrl] = useState<string>("");
    const [apiKey, setApiKey] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [shortUrl, setShortUrl] = useState<string>("");

    const submit: () => void = async () => {
        if (!apiKey || !url) {
            return toast.error("Please fill all required fields!");
        }

        if (apiKey.length < 5) {
            return toast.error("Invalid API Key");
        }

        setLoading(true);
        const data = await createShortUrl(url, apiKey);
        setLoading(false)
        if (!data) {
            setShortUrl("");
            return toast.error("Failed to shorten URL");
        }
        setApiKey("");
        setUrl("");
        setShortUrl(data.urlSet.rawUrl);
        okToast("URL Shortened!");
    };

    useEffect(() => {
        if (!loadingUser && user) {
            setApiKey(user.apiKey);
        }
    }, [loadingUser, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submit();
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

                <div className={"mt-10 box-primary p-4 flex flex-col items-center"}>
                    <h1 className={"mb-12 text-xl font-extrabold"}>URL Shortener</h1>

                    <form onSubmit={handleSubmit} className={"flex flex-col gap-4"}>

                        <MainStringInput
                            name="text"
                            required
                            placeholder="Original URL"
                            type="text"
                            value={url}
                            autoComplete={"new-password"}
                            onChange={(e) => setUrl(e)}
                        />

                        <MainStringInput
                            name="text"
                            required
                            placeholder="API Key"
                            type="password"
                            value={apiKey}
                            id="api-key"
                            disabled={!!user}
                            autoComplete={"new-password"}
                            onChange={(e) => setApiKey(e)}
                        />

                        <button
                            className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-primary/30 backdrop-blur-lg px-6 py-2 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-gray-600/5 border border-white/20"
                            disabled={!!shortUrl}
                            type="submit"
                        >
                            <span className="text-lg">{loading ? "Processing.." : "Short URL"}</span>
                            <div
                                className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]"
                            >
                                <div className="relative h-full w-10 bg-white/20"></div>
                            </div>
                        </button>
                    </form>
                </div>

                {(!loading && shortUrl) && (
                    <div>
                        <div className={"mt-4 bg-primary_light border-2 rounded-xl border-secondary p-4 flex flex-col items-center"}>
                            <h1 className={"mb-4 text-xl font-extrabold"}>Shortened URL</h1>
                            <a href={shortUrl} target="_blank" rel="noreferrer" className={"text-telegram"}>{shortUrl}</a>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}