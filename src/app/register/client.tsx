'use client';

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/hooks/useTranslation";
import LoadingPage from "@/components/LoadingPage";
import {MdEmail} from "react-icons/md";
import {FaKey, FaUser} from "react-icons/fa";
import {toast} from "react-toastify";
import {FaCheck, FaLock} from "react-icons/fa6";
import {getApiUrl} from "@/lib/core";
import {useApiStatusStore} from "@/lib/stores/apiStatusStore";
import {ErrorPage} from "@/components/ErrorPage";
import {useAuthCheck} from "@/hooks/useAuthCheck";
import {AuthChecking} from "@/components/AuthChecking";
import {useUser} from "@/hooks/useUser";
import Link from "next/link";
import MainStringInput from "@/components/MainStringInput";
import {errorToast} from "@/lib/client";

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

    const [isFocusedPass, setIsFocusedPass] = useState(false);
    const [isFocusedSecondPass, setIsFocusedSecondPass] = useState(false);

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
            return errorToast(lang.pages.login.short_password);
        }
        else if (!email.includes('@')) {
            return errorToast('Invalid email');
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

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading || loadingUser) return <LoadingPage />

    if (checkingAuth) return <AuthChecking />

    if (!isApiUp && !loading) return <ErrorPage message={"Server error occurred"} lang={lang} callBack={() => {
            router.replace("/")
        }} />


    return (
        <>
            <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">

                <div className="max-w-lg w-full mx-3">
                    <div
                        className="box-primary shadow-xl overflow-hidden"
                    >
                        <div className="p-3 lg:p-8">
                            <h2 className="text-center text-3xl font-extrabold text-white">
                                {lang.pages.register.title}
                            </h2>
                            <p className="mt-4 text-center text-gray-400">{lang.pages.register.under_title}</p>
                            <form autoComplete={"off"} method="POST" onSubmit={handleSubmit} className="mt-8 space-y-6">
                                <div className="rounded-md shadow-sm">
                                    <div>
                                        <div className="flex items-center">
                                            < FaUser className="w-8 h-8 mr-2" />
                                            <MainStringInput
                                                placeholder={"username"}
                                                required
                                                value={username}
                                                onChange={(e) => setUsername(e)}
                                                className={"w-full"}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < MdEmail className="w-8 h-8 mr-2" />
                                            <MainStringInput
                                                type={"email"}
                                                autoComplete="off"
                                                placeholder={lang.pages.login.email_placeholder}
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e)}
                                                className={"w-full"}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < FaLock className="w-8 h-8 mr-2" />
                                            <MainStringInput
                                                placeholder={lang.pages.login.password_placeholder}
                                                className={`w-full sm:text-sm text-xs ${isFocusedPass ? "text-dots" : ""}`}
                                                onFocus={() => {
                                                    setTimeout(() => setIsFocusedPass(true), 100);
                                                }}
                                                required
                                                autoComplete="off"
                                                value={password}
                                                onChange={(e) => setPassword(e)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < FaLock className="w-8 h-8 mr-2" />
                                            <MainStringInput
                                                placeholder={lang.pages.register.confirm_password_placeholder}
                                                className={`w-full sm:text-sm text-xs ${isFocusedSecondPass ? "text-dots" : ""}`}
                                                onFocus={() => {
                                                    setTimeout(() => setIsFocusedSecondPass(true), 100);
                                                }}
                                                required
                                                autoComplete="off"
                                                value={confirmPass}
                                                onChange={(e) => setConfirmPass(e)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center">
                                            < FaKey className="w-8 h-8 mr-2" />
                                            <MainStringInput
                                                placeholder={lang.pages.register.invite_code_placeholder}
                                                className={"w-full"}
                                                required
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Agree to Terms + Privacy */}
                                <div className="mt-4">
                                    <label
                                        htmlFor="agree"
                                        className="flex flex-row items-center gap-2.5 dark:text-white light:text-black"
                                    >
                                        <input
                                            id="agree"
                                            name={"agree"}
                                            type="checkbox"
                                            className="peer hidden"
                                            required
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                        />
                                        <div
                                            className="flex rounded-md border border-[#a2a1a833] light:bg-[#e8e8e8] dark:bg-[#212121] peer-checked:bg-telegram transition duration-200"
                                        >
                                            <div className={"h-6 w-6 flex items-center justify-center"}>
                                                <FaCheck className={`transition-all duration-150 w-0 h-0 ${agreed ? "w-4 h-4" : ""}`} />
                                            </div>
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-200">
                      I have read and agree to the{" "}
                                            <Link href="/legal/terms" target="_blank" rel="noopener noreferrer"
                                                  className="underline decoration-white/30 hover:text-white">
                        Terms of Service
                      </Link>{" "}
                                            and{" "}
                                            <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer"
                                                  className="underline decoration-white/30 hover:text-white">
                        Privacy Policy
                      </Link>.
                    </span>
                                    </label>
                                </div>


                                <div className="flex items-center justify-center mt-4">

                                    <div className="text-sm font-bold flex">
                                        <span
                                            className="text-gray-400 mr-1">{lang.pages.register.already_have_account}</span>
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