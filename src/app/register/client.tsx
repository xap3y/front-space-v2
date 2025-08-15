'use client';

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/hooks/useTranslation";
import LoadingPage from "@/components/LoadingPage";
import {MdEmail} from "react-icons/md";
import {FaKey, FaUser} from "react-icons/fa";
import {toast} from "react-toastify";
import {FaLock} from "react-icons/fa6";
import {getApiUrl} from "@/lib/core";
import {useApiStatusStore} from "@/lib/stores/apiStatusStore";
import {ErrorPage} from "@/components/ErrorPage";
import {useAuthCheck} from "@/hooks/useAuthCheck";
import {AuthChecking} from "@/components/AuthChecking";
import {useUser} from "@/hooks/useUser";
import Link from "next/link";

export default function RegisterPage() {

    const { isApiUp } = useApiStatusStore();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const { user, loadingUser } = useUser();
    const [agreed, setAgreed] = useState(false);

    const router = useRouter();

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

    const handleSubmit = async (e: unknown) => {
        // @ts-expect-error
        e.preventDefault();

        if (password.length < 5) {
            return toast.error(lang.pages.login.short_password);
        }
        else if (!email.includes('@')) {
            return toast.error('Invalid email');
        }

        const toastId = toast.info("Registering...", {
            isLoading: true
        })

        try {
            /*setPassword('');*/
            console.log("API URL: " + getApiUrl() + '/v1/auth/register');

            const response = await fetch(getApiUrl() + '/v1/auth/register', {
                method: 'POST',
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    inviteCode: inviteCode
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (!data["message"]) {
                    toast.update(toastId, { render: lang.pages.register.failed_alert, type: "error", isLoading: false, autoClose: 1500})
                    return;
                }
                toast.update(toastId, { render: data["message"], type: "error", isLoading: false, autoClose: 2000})
                return;
            }

            toast.update(toastId, { render: lang.pages.register.success_alert, type: "success", isLoading: false, autoClose: 3000, closeOnClick: true})
            setLoading(true);
            setTimeout(() => {
                router.push('register/verify?email=' + email);
            }, 500)
        } catch (e) {
            console.error(e);
            toast.update(toastId, { render: lang.pages.register.failed_alert, type: "error", isLoading: false, autoClose: 3000, closeOnClick: true})
        }
    };

    if (loading) return <LoadingPage />

    if (!isApiUp && !loading) return <ErrorPage message={"Server error occurred"} lang={lang} callBack={() => {
            router.replace("/")
        }} />

    if (checkingAuth) return <AuthChecking />

    return (
        <>
            <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">

                <div className="max-w-lg w-full mx-3">
                    <div
                        className="bg-primary_light rounded-lg shadow-xl overflow-hidden"
                    >
                        <div className="p-3 lg:p-8">
                            <h2 className="text-center text-3xl font-extrabold text-white">
                                {lang.pages.register.title}
                            </h2>
                            <p className="mt-4 text-center text-gray-400">{lang.pages.register.under_title}</p>
                            <form autoComplete={"new-password"} method="POST" onSubmit={handleSubmit} className="mt-8 space-y-6">
                                <div className="rounded-md shadow-sm">
                                    <div>
                                        <div className="flex items-center">
                                            < FaUser className="w-8 h-8 mr-2" />
                                            <input
                                                placeholder={"username"}
                                                className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm text-xs"
                                                required
                                                autoComplete="new-password"
                                                type="text"
                                                name="username"
                                                id="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < MdEmail className="w-8 h-8 mr-2" />
                                            <input
                                                placeholder={lang.pages.login.email_placeholder}
                                                className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm text-xs"
                                                required
                                                autoComplete="new-password"
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < FaLock className="w-8 h-8 mr-2" />
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
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < FaLock className="w-8 h-8 mr-2" />
                                            <input
                                                placeholder={lang.pages.register.confirm_password_placeholder}
                                                className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm text-xs"
                                                required
                                                autoComplete="new-password"
                                                type="password"
                                                name="confirmPass"
                                                id="confirmPass"
                                                value={confirmPass}
                                                onChange={(e) => setConfirmPass(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < FaKey className="w-8 h-8 mr-2" />
                                            <input
                                                placeholder={lang.pages.register.invite_code_placeholder}
                                                className="appearance-none relative block w-full px-3 py-3 border border-primary bg-primary_light text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-telegram focus:z-10 sm:text-sm text-xs"
                                                required
                                                autoComplete="new-password"
                                                type="text"
                                                name="inviteCode"
                                                id="inviteCode"
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Agree to Terms + Privacy */}
                                <div className="mt-4">
                                    <label htmlFor="agree" className="flex items-start gap-3 cursor-pointer select-none">
                                        <input
                                            id="agree"
                                            name="agree"
                                            type="checkbox"
                                            className="mt-0.5 h-4 w-4 rounded border border-white/20 bg-primary_light text-telegram focus:ring-2 focus:ring-telegram-brighter"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                            required
                                        />
                                        <span className="text-xs sm:text-sm text-gray-200">
                      I have read and agree to the{" "}
                                            <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 hover:text-white">
                        Terms of Service
                      </Link>{" "}
                                            and{" "}
                                            <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 hover:text-white">
                        Privacy Policy
                      </Link>.
                    </span>
                                    </label>
                                </div>


                                <div className="flex items-center justify-center mt-4">

                                    <div className="text-sm font-bold flex">
                                        <span className="text-gray-400 mr-1">{lang.pages.register.already_have_account}</span>
                                        <p className="font-bold text-telegram hover:text-telegram-bright cursor-pointer"
                                           onClick={() => router.push('/login')}
                                        >{lang.pages.register.login_text}</p>

                                    </div>
                                </div>

                                <div>
                                    <button
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transform duration-300 transition-all hover:to-blue-600 bg-telegram2 hover:bg-telegram-brighter focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        type="submit"
                                    >
                                        {lang.pages.register.button_text}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}