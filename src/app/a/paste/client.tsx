"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useTranslation } from "@/hooks/useTranslation";
import LoadingPage from "@/components/LoadingPage";
import {errorToast, infoToast, okToast, validateApiKey} from "@/lib/client";
import { getApiUrl } from "@/lib/core";
import { ErrorToast } from "@/components/ErrorToast";
import { LoadingDot } from "@/components/GlobalComponents";
import { FaCheck } from "react-icons/fa6";
import { useDebounce } from "@/hooks/useDebounce";
import {FaKey} from "react-icons/fa";
import MainStringInput from "@/components/MainStringInput";

export default function PasteCreator() {
    const router = useRouter();
    const { user, loadingUser } = useUser();
    const lang = useTranslation();

    const [isApiUp, setIsApiUp] = useState(true);

    const [apiKey, setApiKey] = useState("");
    const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
    const [isKeyValidating, setIsKeyValidating] = useState(false);
    const debouncedApiKey = useDebounce(apiKey, 800);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!loadingUser && user?.apiKey) {
            setApiKey(user.apiKey);
            setIsKeyValid(true);
        }
    }, [loadingUser, user]);

    useEffect(() => {
        const checkApi = async () => {
            try {
                const res = await fetch(getApiUrl() + "/status", { cache: "no-store" });
                setIsApiUp(res.ok);
            } catch {
                setIsApiUp(false);
            }
        };
        checkApi();
    }, []);

    useEffect(() => {
        if (!debouncedApiKey || user?.apiKey) return;
        setIsKeyValidating(true);
        const validate = async () => {
            try {
                const ok = await validateApiKey(debouncedApiKey);
                setIsKeyValid(ok);
            } finally {
                setTimeout(() => setIsKeyValidating(false), 100);
            }
        };
        validate();
    }, [debouncedApiKey, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    };

    const submit = async () => {
        const effectiveKey = user?.apiKey || apiKey?.trim();

        if (!title.trim() || !content.trim()) {
            return errorToast("Please provide both title and content.", 2000);
        }
        if (!effectiveKey) {
            return errorToast("API key is required.", 2000);
        }

        // Re-validate key right before creating
        const keyOk = await validateApiKey(effectiveKey);
        if (!keyOk) {
            setIsKeyValid(false);
            return errorToast("Invalid API key.");
        }

        setCreating(true);

        try {
            const res = await fetch(getApiUrl() + "/v1/paste/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                credentials: "include",
                body: JSON.stringify({
                    title: title.trim(),
                    text: content.trim(),
                    apiKey: effectiveKey,
                    source: "PORTAL",
                }),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "Failed to create paste.");
                throw new Error(errText || "Failed to create paste.");
            }

            const data = await res.json();
            const uniqueId =
                data?.uniqueId ||
                data?.uid ||
                data?.id ||
                data?.paste?.uniqueId ||
                data?.result?.uniqueId;

            if (!uniqueId) {
                throw new Error("Paste created, but uniqueId was not returned.");
            }

            okToast("Paste created successfully!", 1200);
            router.push(`/p/${uniqueId}`);
        } catch (err: any) {
            errorToast(err?.message || "Failed to create paste.");
            setCreating(false);
        }
    };

    if (loadingUser) return <LoadingPage />;

    return (
        <>
            {!isApiUp && <ErrorToast type="ERROR" message="MAIN API SERVER IS DOWN!" />}

            <form onSubmit={handleSubmit} className="flex items-center justify-center bg-opacity-50 select-none">
                <div className={`xl:mt-40 mt-28 transition-all duration-500 ease-in-out p-6 box-primary shadow-lg w-full max-w-md xl:min-w-[550px]`}>
                    <div className="space-y-6">

                        <h1 className="text-2xl font-bold text-center">
                            {"Create a New Paste"}
                        </h1>

                        {/* Title */}
                        <div>
                            <MainStringInput
                                placeholder={"Title"}
                                value={title}
                                disabled={creating}
                                onChange={(value) => setTitle(value)}
                                className="xl:text-base text-xs w-full"
                            />
                        </div>

                        {/* Content */}
                        <div>
              <textarea
                  placeholder={"Content"}
                  value={content}
                  disabled={creating}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="xl:text-base text-xs w-full in-primary"
              />
                        </div>

                        {/* API Key */}
                        <div className="flex items-center">

                            <MainStringInput
                                placeholder={lang?.global?.api_key_input_placeholder || "API key"}
                                value={apiKey}
                                disabled={!!user || creating || isKeyValidating}
                                onChange={(value) => {
                                    setIsKeyValid(null);
                                    setApiKey(value.toLowerCase());
                                }}
                                className={`lg:text-base text-xs w-full in-primary p-0 ${
                                    (!!user || isKeyValid) ? "border-lime-500 bg-lime-500 bg-opacity-10" : ""
                                } ${isKeyValid === false ? "border-red-400 bg-red-400 bg-opacity-5" : ""} ${creating ? "disabled" : ""} ${!!user ? "cursor-not-allowed" : ""}`}
                            />
                            {isKeyValidating && <LoadingDot size="w-10" />}
                            {isKeyValid === true && !isKeyValidating && <FaCheck className="ml-2 w-6 h-6 text-lime-400" />}
                        </div>

                        {/* Create button */}
                        {!creating ? (
                            <button type="submit" disabled={creating} className="w-full duration-200 bg-blue-500 hover:bg-blue-600 border-2 border-blue-600 text-white p-2 rounded">
                                {"Create"}
                            </button>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-3 border-2 border-blue-600 bg-blue-500 text-white p-2 rounded">
                                <LoadingDot />
                                <span>{"Creating..."}</span>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </>
    );
}