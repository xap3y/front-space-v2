"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import { errorToast, okToast } from "@/lib/client";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import MainStringInput from "@/components/MainStringInput";
import { KeyRequest } from "@/types/discord";
import { createMinecraftServerApiKey } from "@/lib/apiPoster";
import { useTurnstile } from "react-turnstile";
import HoverDiv from "@/components/HoverDiv";
import {
    isValidEmail,
    toAsciiAlnumEmail,
    toAsciiAlnumIp,
    toAsciiAlnumName,
    toAsciiAlnumPassword
} from "@/lib/clientFuncs";

const STORAGE_KEY = "minecraft_server_api_key_v1";
const TTL_MS = 60 * 60 * 1000;

export const MIN_NAME_LENGTH = 4;
export const MIN_PASS_LENGTH = 6;
export const MAX_PASS_LENGTH = 40;
export const MAX_NAME_LENGTH = 30;

type StoredKeyPayload = {
    apiKey: string;
    expiresAt: number;
};

export default function ReportGetApiKey() {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [turnstileLoading, setTurnStileLoading] = useState(true);

    // form fields
    const [serverName, setServerName] = useState("");
    const [serverIp, setServerIp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isFocusedPass, setIsFocusedPass] = useState(false);

    // turnstile token
    const [token, setToken] = useState("");
    const turnstile = useTurnstile();

    // result
    const [apiKey, setApiKey] = useState<string | null>(null);

    const [ip, setIp] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/client-api")
            .then((r) => r.json())
            .then((d) => setIp(d.secret ?? null))
            .catch(() => setIp(null));
    }, []);

    const now = useMemo(() => Date.now(), []);

    // Load from localStorage on first render, and schedule expiry removal
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed: StoredKeyPayload = JSON.parse(raw);
            if (!parsed?.apiKey || !parsed?.expiresAt) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            if (parsed.expiresAt <= Date.now()) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            setApiKey(parsed.apiKey);

            const msLeft = parsed.expiresAt - Date.now();
            const t = window.setTimeout(() => {
                localStorage.removeItem(STORAGE_KEY);
                setApiKey(null);
            }, msLeft);
            return () => window.clearTimeout(t);
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setTimeout(() => setLoading(false), 100);
        }
    }, [now]);

    function persistApiKey(key: string) {
        const payload: StoredKeyPayload = {
            apiKey: key,
            expiresAt: Date.now() + TTL_MS,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

        // also schedule removal in the current tab
        window.setTimeout(() => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return;
                const parsed: StoredKeyPayload = JSON.parse(raw);
                if (parsed?.expiresAt && parsed.expiresAt <= Date.now()) {
                    localStorage.removeItem(STORAGE_KEY);
                    setApiKey(null);
                }
            } catch {
                localStorage.removeItem(STORAGE_KEY);
                setApiKey(null);
            }
        }, TTL_MS + 250);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!serverName.trim()) return errorToast("Server name is required");
        if (!password.trim()) return errorToast("Password is required");

        if (email.trim() && !isValidEmail(email)) return errorToast("Invalid email address");

        setGenerating(true);

        try {
            const body: KeyRequest = {
                name: serverName.trim(),
                address: serverIp.trim() || null,
                email: email.trim() || null,
                ip: ip,
                token: token,
                password: password.trim(),
            };

            const res = await createMinecraftServerApiKey(body);

            console.log(JSON.stringify(res))

            if (res.error && res.message) {
                if (res.message.includes("Turnstile")) {
                    errorToast("Captcha verification failed, please try again");
                    turnstile.reset();
                    return;
                }
                errorToast(res.message);
                return;
            } else if (res.error && !res.message) {
                errorToast("Failed to generate API key");
                return;
            }

            const key = res.message["apiKey"];
            if (!key) {
                errorToast("Server did not return an API key");
                return;
            }

            setApiKey(key);
            persistApiKey(key);
            okToast("API key generated");
        } catch (err) {
            console.error(err);
            errorToast("Something went wrong");
        } finally {
            setGenerating(false);
        }
    }

    const isMailValid: boolean = email == "" || isValidEmail(email)
    const isNameValid: boolean = serverName == "" || serverName.trim().length >= MIN_NAME_LENGTH && serverName.trim().length <= MAX_NAME_LENGTH;
    const isPassValid: boolean = password == "" || password.trim().length >= MIN_PASS_LENGTH && password.trim().length <= MAX_PASS_LENGTH;

    // If key exists, show ONLY the key view (hide whole form)
    if (apiKey) {
        return (
            <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">
                <div className="max-w-lg w-full mx-3">
                    <div className="box-primary shadow-xl overflow-hidden">
                        <div className="p-3 lg:p-8">
                            <h2 className="text-center text-3xl font-extrabold text-white">
                                Your API Key
                            </h2>
                            <p className="mt-4 text-center text-gray-400">
                                This key is shown only temporarily and will disappear from this
                                page in about 1 hour.
                            </p>

                            <div className="box-primary mt-6 p-4">
                                <p className="text-sm text-gray-300 mb-2">Save it now:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 break-all rounded-md bg-black/30 px-3 py-2 text-base text-white">
                                        {apiKey}
                                    </code>
                                    <HoverDiv
                                        className="text-xs"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(apiKey);
                                                okToast("Copied");
                                            } catch {
                                                errorToast("Failed to copy");
                                            }
                                        }}
                                    >
                                        Copy
                                    </HoverDiv>
                                </div>
                            </div>

                            {/*<button
                                type="button"
                                className="mt-6 w-full py-3 px-4 rounded-md bg-[#212121] border border-[#a2a1a833] text-sm font-medium text-white hover:border-telegram transition"
                                onClick={() => {
                                    localStorage.removeItem(STORAGE_KEY);
                                    setApiKey(null);
                                }}
                            >
                                I saved it — generate a new key
                            </button>*/}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (loading) return <LoadingPage />;

    return (
        <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">
            <div className="max-w-lg w-full mx-3">
                <div className="box-primary shadow-xl overflow-hidden">
                    <div className="p-3 lg:p-8">
                        <h2 className="text-center text-3xl font-extrabold text-white">
                            Generate API Key
                        </h2>
                        <div className="mt-4 text-base text-center text-gray-400 gap-2 flex flex-col">
                            Create an API key for your Minecraft server.
                            <p className={"text-xs italic"}>
                                You can use your username and password to view your report transcripts on
                                <a href={"/mc/report/login"} className={"text-blue-500 ml-1"}>this page</a> later.
                            </p>
                        </div>

                        <form
                            autoComplete="off"
                            method="POST"
                            onSubmit={onSubmit}
                            className="mt-8 space-y-6"
                        >
                            <div className="rounded-md shadow-sm">
                                <div className="mt-0">
                                    <div className="text-xs text-gray-300 flex pb-1 gap-2">
                                        <span>Username *</span>
                                        <div
                                            className={`text-red-500 text-xs italic transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                                !isNameValid
                                                    ? "max-h-32 opacity-100 translate-y-0"
                                                    : "max-h-0 opacity-0 -translate-x-2"
                                            }`}
                                        >
                                            Must be {MIN_NAME_LENGTH}-{MAX_NAME_LENGTH} characters
                                        </div>
                                    </div>
                                    <MainStringInput
                                        value={serverName}
                                        onChange={(e) => {
                                            if (e.length > MAX_NAME_LENGTH + 2) return;
                                            setServerName(toAsciiAlnumName(e))
                                        }}
                                        required
                                        disabled={generating}
                                        placeholder="Username"
                                        className={`${(!isNameValid) ? "!border-red-600 hover:border-red-500 " : ""} mt-1`}
                                    />
                                </div>

                                <div className="mt-3">
                                    <div className="text-xs text-gray-300 flex pb-1 gap-2">
                                        <span>Password *</span>
                                        <div
                                            className={`text-red-500 text-xs italic transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                                !isPassValid
                                                    ? "max-h-32 opacity-100 translate-y-0"
                                                    : "max-h-0 opacity-0 -translate-x-2"
                                            }`}
                                        >
                                            Must be {MIN_PASS_LENGTH}-{MAX_PASS_LENGTH} characters
                                        </div>
                                    </div>
                                    <MainStringInput
                                        value={password}
                                        onFocus={() => {
                                            setTimeout(() => setIsFocusedPass(true), 100);
                                        }}
                                        onChange={(e) => {
                                                if (e.length > MAX_PASS_LENGTH + 2) return;
                                            setPassword(toAsciiAlnumPassword(e))
                                        }}
                                        required
                                        disabled={generating}
                                        placeholder="Password"
                                        autoComplete={"off"}
                                        className={`${(!isPassValid) ? "!border-red-600 hover:border-red-500 " : ""} mt-1 ${isFocusedPass ? "text-dots" : ""}`}
                                    />
                                </div>

                                <div className="mt-3">
                                    <label className="text-xs text-gray-300">
                                        Server IP (optional)
                                    </label>
                                    <MainStringInput
                                        value={serverIp}
                                        onChange={(e) => setServerIp(toAsciiAlnumIp(e))}
                                        placeholder="play.example.com"
                                        className={"mt-1"}
                                        disabled={generating}
                                    />
                                </div>

                                <div className="mt-4">
                                    <div className="text-xs text-gray-300 flex pb-1 gap-2">
                                        <span>Email (optional)</span>
                                        <div
                                            className={`text-red-500 text-xs italic transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                                !isMailValid
                                                    ? "max-h-32 opacity-100 translate-y-0"
                                                    : "max-h-0 opacity-0 -translate-x-2"
                                            }`}
                                        >
                                            Invalid email address
                                        </div>
                                    </div>
                                    <MainStringInput
                                        value={email}
                                        onChange={(e) => setEmail(toAsciiAlnumEmail(e))}
                                        type="email"
                                        placeholder="you@example.com"
                                        className={`${(!isMailValid) ? "!border-red-600 hover:border-red-500 " : ""} mt-1`}
                                        disabled={generating}
                                    />
                                </div>
                            </div>

                            {/* Turnstile */}
                            <div className={`mt-2 min-h-[66px]`}>
                                {turnstileLoading && (
                                    <div className="flex items-center justify-center h-16">
                                        <svg
                                            className="animate-spin h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    </div>
                                )}

                                <TurnstileWidget
                                    onVerified={(t) => setToken(t)}
                                    onError={() => {
                                        setToken("");
                                        errorToast("Captcha failed, try again");
                                    }}
                                    onLoad={() => setTurnStileLoading(false)}
                                    turnstile={turnstile}
                                />
                            </div>

                            <div>
                                <button
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transform duration-300 transition-all hover:to-blue-600 bg-telegram2 hover:bg-telegram-brighter focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={!token || !serverName.trim() || serverName.trim().length < MIN_NAME_LENGTH || loading || generating || !isMailValid || !isNameValid}
                                >
                                    Generate key
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}