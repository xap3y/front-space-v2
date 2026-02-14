"use client";

import {useApiStatusStore} from "@/lib/stores/apiStatusStore";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useTurnstile} from "react-turnstile";
import {useTranslation} from "@/hooks/useTranslation";
import {errorToast} from "@/lib/client";
import {getApiUrl} from "@/lib/core";
import {toAsciiAlnumEmail, toAsciiAlnumName, toAsciiAlnumPassword} from "@/lib/clientFuncs";
import {toast} from "react-toastify";
import LoadingPage from "@/components/LoadingPage";
import {FaKey, FaRegUser} from "react-icons/fa";
import MainStringInput from "@/components/MainStringInput";
import {TurnstileWidget} from "@/components/TurnstileWidget";
import {MAX_NAME_LENGTH, MAX_PASS_LENGTH, MIN_NAME_LENGTH, MIN_PASS_LENGTH} from "@/app/mc/report/get-key/client";
import {useTrUser} from "@/hooks/useTrUser";

export default function TranscriptsLoginPage() {


    const { isApiUp } = useApiStatusStore();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [afterLogin, setAfterLogin] = useState<string | null>(null);
    const [error, setError] = useState("");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [turnstileLoading, setTurnStileLoading] = useState(true);
    const [caToken, setCaToken] = useState("");
    const turnstile = useTurnstile();
    const { user, loadingUser } = useTrUser();

    const lang = useTranslation();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        const errorParam = urlParams.get('errortoast');
        const after = urlParams.get('after');
        if (emailParam) {
            setUsername(toAsciiAlnumEmail(emailParam));
        }
        if (after) {
            setAfterLogin(toAsciiAlnumName(after))
        }
        if (errorParam) {
            if (errorParam == "no-login") {
                errorToast("You need to be logged in", 2000);
            }
        }

        if (emailParam || errorParam || after) router.replace("/mc/report/login", { scroll: false });
    }, []);

    const handleSubmit = async (e: unknown) => {
        // @ts-expect-error
        e.preventDefault();

        if (password.length < 5) {
            return errorToast(lang.pages.login.short_password);
        }
        else if (!caToken || caToken == "") {
            return errorToast('Please complete the CAPTCHA');
        }

        const toastId = toast.info("Logging in...", {
            isLoading: true
        })
        try {
            console.log("API URL: " + getApiUrl() + '/v1/auth/login');

            const response = await fetch(getApiUrl() + '/v1/auth/tr/login', {
                method: 'POST',
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: username,
                    password: password,
                    token: caToken
                }),
            });
            turnstile.reset();
            // get cookies to set from the response
            const cookies = response.headers.get('set-cookie');
            if (cookies) {
                console.log("Cookies: " + cookies);
            }
            const data = await response.json();
            if (!response.ok) {
                if (!data["message"]) {
                    toast.update(toastId, { render: "Login failed!", type: "error", isLoading: false, autoClose: 1500})
                    return;
                }

                toast.update(toastId, { render: data["message"], type: "error", isLoading: false, autoClose: 1500})
                return;
            }

            toast.update(toastId, { render: lang.pages.login.success, type: "success", isLoading: false, autoClose: 1000, closeOnClick: true})
            setLoading(true);
            setTimeout(() => {
                if (afterLogin) {
                    router.push("/mc/report/" + afterLogin)
                } else {
                    router.push("/mc/report/dashboard");
                }
            }, 500)
        } catch (e) {
            console.error(e);
            toast.update(toastId, { render: "Login failed!", type: "error", isLoading: false, autoClose: 3000, closeOnClick: true})
        }
    };

    useEffect(() => {
        if (user) {
            setLoading(true)
            router.push("/mc/report/dashboard");
        }
    }, [user, loadingUser, router]);

    if (loading || !isApiUp || loadingUser || user) {
        return (
            <LoadingPage />
        )
    }

    const isPassValid: boolean = password == "" || password.trim().length >= MIN_PASS_LENGTH && password.trim().length <= MAX_PASS_LENGTH;
    const isNameValid: boolean = username == "" || username.trim().length >= MIN_NAME_LENGTH && username.trim().length <= MAX_NAME_LENGTH;

    return (
        <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen !font-source-code">

            {/*<ErrorBanner message="API is down!" />*/}

            <div className="max-w-lg w-full mx-3">
                <div
                    className="box-primary shadow-xl overflow-hidden"
                >
                    <div className="p-3 lg:p-8">
                        <h2 className="text-center text-3xl font-extrabold text-white">
                            Login to your account
                        </h2>
                        <p className="mt-4 mb-2 text-center text-gray-400">{"Sign in to view your report transcripts"}</p>

                        <form autoComplete="off" method="POST" onSubmit={handleSubmit} className="space-y-6">
                            <div className="rounded-md shadow-sm">
                                <div>
                                    <div
                                        className={`text-red-500 text-xs italic mb-2 pl-8 transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                            !isNameValid
                                                ? "max-h-32 opacity-100 translate-y-0"
                                                : "max-h-0 opacity-0 -translate-y-2"
                                        }`}
                                    >
                                        Invalid username! Must be between {MIN_NAME_LENGTH} and {MAX_NAME_LENGTH} characters.
                                    </div>
                                    <div className="flex items-center">
                                        < FaRegUser className="w-8 h-8 mr-2" />
                                        <MainStringInput
                                            placeholder={"Username or email"}
                                            className={`${(!isNameValid) ? "!border-red-600 hover:border-red-500 " : ""} w-full sm:text-sm text-xs`}
                                            required
                                            autoComplete="off"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(toAsciiAlnumEmail(e))}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div
                                        className={`text-red-500 text-xs italic mb-2 pl-8 transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                            !isPassValid
                                                ? "max-h-32 opacity-100 translate-y-0"
                                                : "max-h-0 opacity-0 -translate-y-2"
                                        }`}
                                    >
                                        Invalid password! Must be between {MIN_PASS_LENGTH} and {MAX_PASS_LENGTH} characters.
                                    </div>
                                    <div className="flex items-center">
                                        < FaKey className="w-8 h-8 mr-2" />
                                        <MainStringInput
                                            placeholder={lang.pages.login.password_placeholder}
                                            className={`${(!isPassValid) ? "!border-red-600 hover:border-red-500 " : ""} w-full sm:text-sm text-xs ${isFocused ? "text-dots" : ""}`}
                                            required
                                            autoComplete="off"
                                            type="text"
                                            onFocus={() => {
                                                setTimeout(() => setIsFocused(true), 100);
                                            }}
                                            value={password}
                                            aria-invalid={!!error}
                                            onChange={(e) => setPassword(toAsciiAlnumPassword(e))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Turnstile */}
                            <div className={`mt-2 min-h-[66px] flex justify-center`}>
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
                                    onVerified={(t) => setCaToken(t)}
                                    onError={() => {
                                        setCaToken("");
                                        errorToast("Captcha failed, try again");
                                    }}
                                    onLoad={() => setTurnStileLoading(false)}
                                    turnstile={turnstile}
                                />
                            </div>

                            <div className="flex items-center justify-center mt-4">

                                <div className="text-sm font-bold flex">
                                    <span className="text-gray-400 mr-1">{lang.pages.login.no_account}</span>
                                    <p className="font-bold text-telegram hover:text-telegram-bright cursor-pointer"
                                       onClick={() => router.push('/mc/report/get-key')}
                                    >{lang.pages.login.signup_text}</p>

                                </div>
                            </div>

                            <div>
                                <button
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transform duration-300 transition-all hover:to-blue-600 bg-telegram2 hover:bg-telegram-brighter focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={!username || !password || !caToken || turnstileLoading || loading || !isNameValid || !isPassValid}
                                >
                                    {lang.pages.login.button_text}
                                </button>
                            </div>
                        </form>
                    </div>
                    {/*<div className="px-8 py-4 bg-primary-bright text-center">
                        <button
                            className="font-normal text-telegram hover:text-telegram-brightest"
                            onClick={() => errorToast('Feature disabled!')}
                        >
                            {lang.pages.login.forgot_password}
                        </button>
                    </div>*/}
                </div>
            </div>
        </main>
    )
}