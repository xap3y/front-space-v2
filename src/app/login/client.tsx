"use client";

import { useEffect, useState } from "react";
import { setCookie } from "cookies-next/client";
import { encrypt } from "@/lib/crypto";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaKey } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import LoadingPage from "@/components/LoadingPage";
import { getUser } from "@/lib/auth";
import { getApiUrl } from "@/lib/core";
import {useTranslation} from "@/hooks/useTranslation";

export default function LoginPage() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const lang = useTranslation();

    useEffect(() => {
        console.log("USE EFFECT")
        console.log("Checking user..");
        async function checkUser() {
            const user = await getUser()
            console.log("User is " + user);
            if (user) {
                router.push('/home/dashboard/')
                setError("User already logged in")
            }
        }
        checkUser()
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
                console.log("[GET | 200] " + getApiUrl() + "/status " + data["error"]);
            } catch (error) {
                // @ts-expect-error
                if (error.message.includes("NetworkError")) {
                    toast.error('API is offline!');
                    console.error("[GET] " + getApiUrl() + "/status -> NetworkError");
                    return;
                }
                // @ts-expect-error
                setError(error.message);
                toast.error('API error!');
                console.log("[GET] " + getApiUrl() + "/status " + error);
            } finally {
                setLoading(false)
            }
        }

        fetchData();
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

        try {
            /*setPassword('');*/

            const toastId = toast.info("Logging in...", {
                isLoading: true
            })
            console.log("API URL: " + getApiUrl() + '/v1/auth/login');

            const response = await fetch(getApiUrl() + '/v1/auth/login', {
                method: 'POST',
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });
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

            toast.update(toastId, { render: lang.pages.login.success, type: "success", isLoading: false, autoClose: 1300})
            setLoading(true);
            setTimeout(() => {
                router.push('/home/dashboard/');
            }, 500)
        } catch (e) {
            console.error(e);
            toast.error("Login failed!")
        }
    };

    if (loading) {
        return (
            <LoadingPage />
        )
    }

    return (
        <main className="flex items-center justify-center min-h-screen">

            {/*<ErrorBanner message="API is down!" />*/}

            <div className="max-w-lg w-full mx-3">
                <div
                    className="bg-primary_light rounded-lg shadow-xl overflow-hidden"
                >
                    <div className="p-8">
                        <h2 className="text-center text-3xl font-extrabold text-white">
                            {lang.pages.login.title}
                        </h2>
                        <p className="mt-4 text-center text-gray-400">{lang.pages.login.under_title}</p>
                        <form autoComplete={"new-password"} method="POST" onSubmit={handleSubmit} className="mt-8 space-y-6">
                            <div className="rounded-md shadow-sm">
                                <div>
                                    <div className="flex items-center">
                                        < MdEmail className="w-8 h-8 mr-2" />
                                        <input
                                            placeholder={lang.pages.login.email_placeholder}
                                            className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm"
                                            required
                                            autoComplete="new-password"
                                            type="email"
                                            name="email"
                                            id="email"
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center">
                                        < FaKey className="w-8 h-8 mr-2" />
                                        <input
                                            placeholder={lang.pages.login.password_placeholder}
                                            className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm text-xs"
                                            required
                                            autoComplete="new-password"
                                            type="password"
                                            name="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                            onClick={() => toast.error('Feature disabled!')}
                        >
                            {lang.pages.login.forgot_password}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}