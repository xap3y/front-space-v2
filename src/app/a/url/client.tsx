"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "@/hooks/useUser";
import { createShortUrl } from "@/lib/apiPoster";
import LoadingPage from "@/components/LoadingPage";
import {copyToClipboard, errorToast, infoToast, okToast, validateApiKey} from "@/lib/client";
import MainStringInput from "@/components/MainStringInput";
import { LoadingDot } from "@/components/GlobalComponents";
import { FaCheck } from "react-icons/fa6";
import { useDebounce } from "@/hooks/useDebounce";
import {UserObjShort} from "@/types/user";
import {FaCopy} from "react-icons/fa";
import {ShortUrlDto} from "@/types/url";
import HoverDiv from "@/components/HoverDiv";

export default function UrlShortener() {
    const { user, loadingUser } = useUser();

    const [url, setUrl] = useState<string>("");
    const [uniqueId, setUniqueId] = useState<string>("");

    const [apiKey, setApiKey] = useState<string>("");
    const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
    const [isKeyValidating, setIsKeyValidating] = useState(false);
    const debouncedApiKey = useDebounce(apiKey, 800);
    const [apiKeyUser, setApiKeyUser] = useState<UserObjShort | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [shortUrl, setShortUrl] = useState<string>("");
    const [shortUrlDto, setShortUrlDto] = useState<ShortUrlDto | null>(null);

    // Prefill API key from user
    useEffect(() => {
        if (!loadingUser && user?.apiKey) {
            setApiKey(user.apiKey);
            setIsKeyValid(true);
        }
    }, [loadingUser, user]);

    // Debounced key validation (skip if user key is present)
    useEffect(() => {
        if (!debouncedApiKey) {
            setApiKeyUser(null);
            return;
        }
        setIsKeyValidating(true);

        const validate = async () => {
            try {
                const ok = await validateApiKey(debouncedApiKey);
                if (typeof ok == "boolean") {
                    setIsKeyValid(false);
                    setApiKeyUser(null);
                } else {
                    setIsKeyValid(true);
                    setApiKeyUser(ok);
                }
            } finally {
                setTimeout(() => setIsKeyValidating(false), 100);
            }
        };

        validate();
    }, [debouncedApiKey, user]);

    const submit = async () => {
        const effectiveKey = user?.apiKey || apiKey.trim();

        if (!effectiveKey || !url.trim()) {
            return errorToast("Please fill all required fields!");
        }
        else if (effectiveKey.length < 5) {
            return errorToast("Invalid API Key");
        } else if (!url.trim().startsWith("http://") && !url.trim().startsWith("https://")) {
            return errorToast("URL must start with http or https");
        }

        // Re-validate before submitting
        const keyOk = await validateApiKey(effectiveKey);
        if (!keyOk) {
            setIsKeyValid(false);
            return errorToast("Invalid API key.");
        }

        setLoading(true);
        const data = await createShortUrl(url.trim(), effectiveKey, uniqueId.trim() ? uniqueId.trim() : null);
        setLoading(false);

        if (!data) {
            setShortUrl("");
            return errorToast("Failed to shorten URL");
        }

        setApiKey(user?.apiKey ? user.apiKey : "");
        setUrl("");
        setUniqueId("");
        setShortUrl(data.urlSet.rawUrl);
        setShortUrlDto(data);
        setApiKeyUser(null)
        setIsKeyValid(null)
        okToast("URL Shortened!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submit();
    };

    if (loadingUser) {
        return <LoadingPage />;
    }

    const finalUserRole = apiKeyUser ? apiKeyUser.role : user ? user.role : "GUEST";
    const isAdmin = finalUserRole == "ADMIN" || finalUserRole == "OWNER";

    return (
        <>
            <main className="w-full flex flex-col justify-center items-center">
                <div className="mt-28 xl:mt-40 transition-all duration-500 ease-in-out p-6 box-primary shadow-lg w-full max-w-md xl:min-w-[550px]">
                    <h1 className="text-2xl font-bold text-center mb-8">URL Shortener</h1>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Original URL */}
                        <MainStringInput
                            name="original-url"
                            required
                            placeholder="Original URL"
                            type="text"
                            value={url}
                            autoComplete="new-password"
                            disabled={loading || !!shortUrl}
                            onChange={(val) => setUrl(val)}
                            className="xl:text-base text-xs w-full"
                        />

                        {/* Custom UID */}
                        <div
                            className={`transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                isAdmin
                                    ? "max-h-32 opacity-100 translate-y-0"
                                    : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
                            }`}
                        >
                            <MainStringInput
                                placeholder="Custom UID"
                                value={uniqueId}
                                disabled={loading || !isAdmin || !!shortUrl}
                                onChange={(val) => setUniqueId(val)}
                                className="xl:text-base text-xs w-full"
                            />
                        </div>

                        {/* API Key */}
                        <div className="flex items-center gap-2">
                            <MainStringInput
                                name="api-key"
                                required
                                placeholder="API Key"
                                type="password"
                                value={apiKey}
                                id="api-key"
                                disabled={!!user || loading || isKeyValidating || !!shortUrl}
                                autoComplete="new-password"
                                onChange={(val) => {
                                    setIsKeyValid(null);
                                    setApiKey(val.toLowerCase());
                                }}
                                className={`xl:text-base text-xs w-full ${
                                    (!!user || isKeyValid) ? "border-lime-500 bg-lime-500 bg-opacity-10" : ""
                                } ${isKeyValid === false ? "border-red-400 bg-red-400 bg-opacity-5" : ""}`}
                            />
                            {isKeyValidating && <LoadingDot size="w-10" />}
                            {isKeyValid === true && !isKeyValidating && <FaCheck className="w-6 h-6 text-lime-400" />}
                        </div>

                        {/* Submit button */}
                        <button
                            className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-blue-500 px-6 py-2 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:bg-blue-600 border-2 border-blue-600 disabled:opacity-60"
                            disabled={loading || !!shortUrl}
                            type="submit"
                        >
                            <span className="text-lg">{loading ? "Processing.." : "Short URL"}</span>
                            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                                <div className="relative h-full w-10 bg-white/20"></div>
                            </div>
                        </button>
                    </form>
                </div>

                {(!loading && shortUrl && shortUrlDto) && (
                    <div className="mt-4 box-primary border-2 rounded-xl border-blue-500 p-4 flex flex-col items-center">
                        <h1 className="mb-4 text-xl font-extrabold">Shortened URL</h1>

                        <div className={"flex flex-col gap-2 p-1"}>
                            <div className={"flex flex-row items-center gap-2"}>
                                <a href={shortUrlDto.urlSet.rawUrl} target="_blank" rel="noreferrer" className="text-blue-400 break-all">
                                    {shortUrlDto.urlSet.rawUrl}
                                </a>
                                <FaCopy className={"cursor-pointer"} onClick={() => {
                                    copyToClipboard(shortUrlDto?.urlSet.rawUrl || "");
                                }} />
                            </div>

                            {shortUrlDto.urlSet.shortUrl && (
                                <div className={"flex flex-row items-center gap-2"}>
                                    <a href={shortUrlDto.urlSet.shortUrl} target="_blank" rel="noreferrer" className="text-blue-400 break-all">
                                        {shortUrlDto.urlSet.shortUrl}
                                    </a>
                                    <FaCopy className={"cursor-pointer"} onClick={() => {
                                        copyToClipboard(shortUrlDto?.urlSet.shortUrl || "");
                                    }} />
                                </div>
                            )}

                            {shortUrlDto.urlSet.portalUrl && (
                                <div className={"flex flex-row items-center gap-2"}>
                                    <a href={shortUrlDto.urlSet.portalUrl} target="_blank" rel="noreferrer" className="text-blue-400 break-all">
                                        {shortUrlDto.urlSet.portalUrl}
                                    </a>
                                    <FaCopy className={"cursor-pointer"} onClick={() => {
                                        copyToClipboard(shortUrlDto?.urlSet.portalUrl || "");
                                    }} />
                                </div>
                            )}

                        </div>

                        <HoverDiv
                            onClick={() => {
                                setShortUrl("");
                                setShortUrlDto(null);
                            }}
                            inputClassName={"mt-4"}
                        >
                            <button>
                                <span className="text-lg">Create Another</span>
                            </button>
                        </HoverDiv>

                    </div>
                )}
            </main>
        </>
    );
}