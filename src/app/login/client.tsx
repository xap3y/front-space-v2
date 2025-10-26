"use client";

import { useEffect, useState } from "react";
import { setCookie } from "cookies-next/client";
import { encrypt } from "@/lib/crypto";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {FaKey, FaArrowLeft, FaDiscord} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import LoadingPage from "@/components/LoadingPage";
import { getUser } from "@/lib/auth";
import { getApiUrl } from "@/lib/core";
import {useTranslation} from "@/hooks/useTranslation";
import {logApiRes} from "@/lib/logger";
import { useApiStatusStore } from "@/lib/stores/apiStatusStore";
import {ErrorPage} from "@/components/ErrorPage";
import {errorToast} from "@/lib/client";
import {useAuthCheck} from "@/hooks/useAuthCheck";
import {AuthChecking} from "@/components/AuthChecking";
import {useUser} from "@/hooks/useUser";
import MainStringInput from "@/components/MainStringInput";

export default function LoginPage() {

    const { isApiUp } = useApiStatusStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { user, loadingUser } = useUser();

    const lang = useTranslation();

    const { checkingAuth, setCheckingAuth } = useAuthCheck({
        onValid: async () => {
            setCheckingAuth(true)
            router.push("/register/verify")
        },
    });


    useEffect(() => {
        if (user) {
            setLoading(true)
            router.push("/home/profile");
        }
    }, [user, loadingUser, router]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        const errorParam = urlParams.get('errortoast');
        if (emailParam) {
            setEmail(emailParam);
        }

        if (errorParam) {
            if (errorParam == "discord") {
                errorToast("No user found with this Discord account", 2000);
            } else if (errorParam == "discord_server") {
                errorToast("Server error occurred ", 2000);
            }
        }

        if (emailParam || errorParam) router.replace("/login", { scroll: false });
        console.log("Fetching API status..");
        async function fetchData() {
            try {
                const response = await fetch(getApiUrl() + '/status', {
                    method: 'GET',
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });
                const data = await response.json();
                logApiRes(response, data);
                //console.debug(`[GET | ${response.status}] ` + getApiUrl() + "/status " + data["error"]);
            } catch (error) {
                // @ts-expect-error
                if (error.message.includes("NetworkError")) {
                    toast.error('API is offline!');
                    console.debug("[GET] " + getApiUrl() + "/status -> NetworkError");
                    return;
                }
                // @ts-expect-error
                setError(error.message);
                toast.error('API error!', {
                    autoClose: 600,
                    closeOnClick: true
                });
                console.log("[GET] " + getApiUrl() + "/status " + error);
            }
        }

        if (isApiUp) {
            console.log("API is up");
            fetchData();
        } else {
            console.log("API is NOT up");
        }

        setLoading(false)
    }, []);

    const handleSubmit = async (e: unknown) => {
        // @ts-expect-error
        e.preventDefault();

        if (password.length < 5) {
            return toast.error(lang.pages.login.short_password);
        }
        else if (!email.includes('@')) {
            return toast.error('Invalid email');
        }

        const toastId = toast.info("Logging in...", {
            isLoading: true
        })
        try {
            /*setPassword('');*/
            console.log("API URL: " + getApiUrl() + '/v1/auth/login');

            const response = await fetch(getApiUrl() + '/v1/auth/login', {
                method: 'POST',
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });
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

            const token = await encrypt(JSON.stringify(data["message"]));
            setCookie("auth_token", token, {
                secure: true,
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 7,
            });

            toast.update(toastId, { render: lang.pages.login.success, type: "success", isLoading: false, autoClose: 1000, closeOnClick: true})
            setLoading(true);
            setTimeout(() => {
                router.push('/home/dashboard/');
            }, 500)
        } catch (e) {
            console.error(e);
            toast.update(toastId, { render: "Login failed!", type: "error", isLoading: false, autoClose: 3000, closeOnClick: true})
        }
    };

    if (loading || loadingUser || !isApiUp) {
        return (
            <LoadingPage />
        )
    }

    if (checkingAuth) return <AuthChecking />

    return (
        <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">

            {/*<ErrorBanner message="API is down!" />*/}

            <div className="max-w-lg w-full mx-3">
                <div
                    className="box-primary shadow-xl overflow-hidden"
                >
                    <div className="p-3 lg:p-8">
                        <h2 className="text-center text-3xl font-extrabold text-white">
                            {lang.pages.login.title}
                        </h2>
                        <p className="mt-4 text-center text-gray-400">{lang.pages.login.under_title}</p>

                        {/*Discord login*/}
                        <div className={"w-full flex flex-col items-center justify-center"}>
                            <div className="mt-4 text-center cursor-pointer">
                                <a
                                    className="w-full max-w-xs flex items-center justify-center gap-3 px-3 py-2
                                 bg-[#5865F2] border-4 border-[#404EED] text-white rounded-lg
                                 font-semibold text-md hover:bg-[#4752C4] transition-all duration-200"
                                    href={process.env.NEXT_PUBLIC_DISCORD_LOGIN_URL}
                                >
                                    <FaDiscord size={24} />
                                    Login using Discord
                                </a>
                            </div>

                            <div className={"flex my-4 gap-5"}>
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-2 h-2 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                            </div>
                        </div>

                        <form autoComplete="off" method="POST" onSubmit={handleSubmit} className="space-y-6">
                            <div className="rounded-md shadow-sm">
                                <div>
                                    <div className="flex items-center">
                                        <MdEmail className="w-8 h-8 mr-2" />
                                        <MainStringInput
                                            placeholder={lang.pages.login.email_placeholder}
                                            className="w-full sm:text-sm text-xs"
                                            required
                                            autoComplete="off"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center">
                                        < FaKey className="w-8 h-8 mr-2" />
                                        <MainStringInput
                                            placeholder={lang.pages.login.password_placeholder}
                                            className={`w-full sm:text-sm text-xs ${isFocused ? "text-dots" : ""}`}
                                            required
                                            autoComplete="off"
                                            type="text"
                                            name="image"
                                            onFocus={() => {
                                                setTimeout(() => setIsFocused(true), 100);
                                            }}
                                            id="image"
                                            value={password}
                                            aria-invalid={!!error}
                                            onChange={(e) => setPassword(e)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center mt-4">

                                <div className="text-sm font-bold flex">
                                    <span className="text-gray-400 mr-1">{lang.pages.login.no_account}</span>
                                    <p className="font-bold text-telegram hover:text-telegram-bright cursor-pointer"
                                       onClick={() => router.push('/register')}
                                    >{lang.pages.login.signup_text}</p>

                                </div>
                            </div>

                            <div>
                                <button
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transform duration-300 transition-all hover:to-blue-600 bg-telegram2 hover:bg-telegram-brighter focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    type="submit"
                                >
                                    {lang.pages.login.button_text}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="px-8 py-4 bg-primary-bright text-center">
                        <button
                            className="font-normal text-telegram hover:text-telegram-brightest"
                            onClick={() => errorToast('Feature disabled!')}
                        >
                            {lang.pages.login.forgot_password}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}