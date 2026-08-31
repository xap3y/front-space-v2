"use client";

import { useEffect, useState } from "react";
import { setCookie } from "cookies-next/client";
import { encrypt } from "@/lib/crypto";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {FaKey, FaDiscord} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import LoadingPage from "@/components/LoadingPage";
import { getApiUrl } from "@/lib/core";
import {useTranslation} from "@/hooks/useTranslation";
import {logApiRes} from "@/lib/logger";
import { useApiStatusStore } from "@/lib/stores/apiStatusStore";
import {errorToast} from "@/lib/client";
import {useAuthCheck} from "@/hooks/useAuthCheck";
import {AuthChecking} from "@/components/AuthChecking";
import {useUser} from "@/hooks/useUser";
import MainStringInput from "@/components/MainStringInput";
import {isValidEmail, toAsciiAlnumEmail, toAsciiAlnumPassword} from "@/lib/clientFuncs";
import {useTurnstile} from "react-turnstile";
import {TurnstileWidget} from "@/components/TurnstileWidget";
import {FaArrowRight} from "react-icons/fa6";

export default function LoginPage() {

    const { isApiUp } = useApiStatusStore();

    const [email, setEmail] = useState("");
    const [after, setAfter] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { user, loadingUser } = useUser();
    const [turnstileLoading, setTurnStileLoading] = useState(true);
    const [caToken, setCaToken] = useState("");
    const [twoFactorChallenge, setTwoFactorChallenge] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [verifyingTwoFactor, setVerifyingTwoFactor] = useState(false);
    const turnstile = useTurnstile();

    const lang = useTranslation();

    const finishLogin = (destination: string) => {
        // Start the authenticated app with a new document request. This prevents
        // Next's pre-login router/RSC cache from replaying an unauthenticated
        // redirect for pages that perform their own user lookup.
        window.location.assign(destination);
    };

    const { checkingAuth, setCheckingAuth } = useAuthCheck({
        onValid: async () => {
            setCheckingAuth(true)
            router.push("/register/verify")
        },
    });


    useEffect(() => {
        if (user) {
            setLoading(true)
            router.push("/home/dashboard");
        }
    }, [user, loadingUser, router]);

    useEffect(() => {
        if (!twoFactorChallenge) return;
        const onPaste = (event: ClipboardEvent) => {
            const text = event.clipboardData?.getData("text")?.trim() || "";
            if (text.length > 0 && text.length < 10) {
                event.preventDefault();
                setTwoFactorCode(text.toUpperCase().replace(/\s/g, ""));
            }
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [twoFactorChallenge]);

    useEffect(() => {
        if (loading || loadingUser) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const afterParam = urlParams.get('after');
        const emailParam = urlParams.get('email');
        const errorParam = urlParams.get('errortoast');
        const twoFactorParam = urlParams.get('twoFactorChallenge');
        if (emailParam) {
            setEmail(emailParam);
        }

        if (afterParam) {
            setAfter(afterParam);
        }
        if (twoFactorParam) {
            setTwoFactorChallenge(twoFactorParam);
            setTwoFactorCode("");
        }

        if (errorParam) {
            if (errorParam == "discord") {
                errorToast("No user found with this Discord account", 2000);
            } else if (errorParam == "discord_server") {
                errorToast("Server error occurred ", 2000);
            }
        }

        if (emailParam || errorParam || afterParam || twoFactorParam) router.replace("/login", { scroll: false });
    }, [loading, loadingUser, router]);

    useEffect(() => {
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
                    errorToast('API is offline!');
                    console.debug("[GET] " + getApiUrl() + "/status -> NetworkError");
                    return;
                }
                // @ts-expect-error
                setError(error.message);
                errorToast('API error!');
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
            return errorToast(lang.pages.login.short_password);
        }
        else if (!isValidEmail(email)) {
            return errorToast('Invalid email');
        } else if (!caToken || caToken == "") {
            return errorToast('Please complete the CAPTCHA');
        }

        const toastId = toast.info("Logging in...", {
            isLoading: true
        })
        try {
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

            if (data?.message?.requiresTwoFactor && data.message.challengeToken) {
                setTwoFactorChallenge(data.message.challengeToken);
                setTwoFactorCode("");
                toast.update(toastId, {render: "Enter your two-factor authentication code", type: "info", isLoading: false, autoClose: 1200});
                return;
            }

            const token = await encrypt(JSON.stringify(data["message"]));
            setCookie("auth_token", token, {
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
            });

            toast.update(toastId, { render: lang.pages.login.success, type: "success", isLoading: false, autoClose: 1000, closeOnClick: true})
            setLoading(true);
            setTimeout(() => {

                if (after && after.startsWith("/")) {
                    finishLogin(after);
                    return;
                }
                finishLogin('/home/dashboard/');
            }, 500)
        } catch (e) {
            console.error(e);
            toast.update(toastId, { render: "Login failed!", type: "error", isLoading: false, autoClose: 3000, closeOnClick: true})
        }
    };

    const handleTwoFactorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!twoFactorCode.trim()) return;
        setVerifyingTwoFactor(true);
        const toastId = toast.loading("Verifying code…");
        try {
            const response = await fetch(getApiUrl() + "/v1/auth/login/2fa", {
                method: "POST", headers: {"Content-Type": "application/json", "Accept": "application/json"}, credentials: "include",
                body: JSON.stringify({challengeToken: twoFactorChallenge, code: twoFactorCode.trim()}),
            });
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.message || "Invalid authentication or backup code");
            const token = await encrypt(JSON.stringify(data.message));
            setCookie("auth_token", token, {secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7});
            toast.update(toastId, {render: "Logged in successfully", type: "success", isLoading: false, autoClose: 1000});
            setLoading(true);
            setTimeout(() => finishLogin(after && after.startsWith("/") ? after : "/home/dashboard/"), 400);
        } catch (err) {
            toast.update(toastId, {render: err instanceof Error ? err.message : "2FA verification failed", type: "error", isLoading: false, autoClose: 2200});
        } finally { setVerifyingTwoFactor(false); }
    };

    if (loading || loadingUser || !isApiUp || user) {
        return (
            <LoadingPage />
        )
    }

    if (checkingAuth) return <AuthChecking />

    const isMailValid: boolean = email == "" || isValidEmail(email)

    return (
        <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">

            {twoFactorChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <form onSubmit={handleTwoFactorSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-[#101014] p-6 shadow-2xl">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><FaKey /></div>
                        <h2 className="mt-4 text-center text-xl font-semibold">Two-factor authentication</h2>
                        <p className="mt-1 text-center text-sm text-zinc-500">Enter the 6-digit code from your authenticator app or one of your backup codes.</p>
                        <MainStringInput autoFocus value={twoFactorCode} onChange={(value) => setTwoFactorCode(value.toUpperCase().replace(/\s/g, "").slice(0, 11))} placeholder="000000 or backup code" autoComplete="one-time-code" className="mt-5 w-full rounded-lg border-zinc-700 bg-black/30" inputClassName="px-4 py-3 text-center font-mono text-lg tracking-wider" />
                        <button type="submit" disabled={!twoFactorCode.trim() || verifyingTwoFactor} className="mt-3 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-40">{verifyingTwoFactor ? "Verifying…" : "Verify and log in"}</button>
                        <button type="button" onClick={() => {setTwoFactorChallenge(""); setTwoFactorCode(""); setCaToken(""); try { turnstile.reset(); } catch {}}} className="mt-3 w-full py-2 text-xs text-zinc-500 hover:text-zinc-300">Back to login</button>
                    </form>
                </div>
            )}

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
                        <div className={"w-full flex flex-col items-center justify-center mb-3 mt-4 space-y-2"}>
                            <button
                                className="w-64 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#5865F2]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                onClick={() => {
                                    const loginUrl = process.env.NEXT_PUBLIC_DISCORD_LOGIN_URL
                                    if (!loginUrl) {
                                        return errorToast("Discord login is not available right now");
                                    }
                                    router.push(loginUrl)
                                }}
                                disabled={!isApiUp || turnstileLoading || !caToken}
                            >
                                <FaDiscord size={18} />
                                Continue with Discord
                            </button>

                            {/*<button
                                className="w-64 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0088cc] hover:bg-[#006a9e] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#0088cc]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                onClick={() => {

                                    router.push("oauth.telegram.org/auth?bot_id=8747604071&origin=https%3A%2F%2Fext-space.xap3y.eu&embed=1&request_access=write&return_to=https%3A%2F%2Fext-space.xap3y.eu%2Flogin%23tgAuthResult%3DeyJpZCI6NTc1OTY2MDM0MywiZmlyc3RfbmFtZSI6IlhBUDNZIiwidXNlcm5hbWUiOiJ4YXAzeSIsInBob3RvX3VybCI6Imh0dHBzOlwvXC90Lm1lXC9pXC91c2VycGljXC8zMjBcL0ZEUTVyTmtrOVpHNWd6ZzJUblh5MnhGZmh0MmxiaVk0M19aMHptSUJCVEhibW1vc3pkS2x3S3gzZHVoTnBmRXcuanBnIiwiYXV0aF9kYXRlIjoxNzc1OTI4NTAyLCJoYXNoIjoiNzA0MWQzZWFlMGJjNzIyNjIzMWUyNDg5N2NlYzAwOGYxMWFjZDEwZDM5NGRhNDQ4NDIzOWQ0NzQyZTRhODlhMyJ9")
                                }}
                                disabled={!isApiUp || turnstileLoading || !caToken}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295-.042 0-.084 0-.126-.01l-.214-3.137 5.894-5.33c.26-.23-.056-.357-.4-.127L6.765 13.69l-3.1-.968c-.674-.215-.688-.674.15-.994l12.156-4.686c.563-.23 1.06.144.876.997z"/>
                                </svg>
                                Continue with Telegram
                            </button>*/}


                            <div className={"flex my-2 gap-4 pt-2"}>
                                <hr className={"w-1.5 h-1.5 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-1.5 h-1.5 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-1.5 h-1.5 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-1.5 h-1.5 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                                <hr className={"w-1.5 h-1.5 rounded-full border-opacity-50 border-[1px] border-secondary bg-primary0"} />
                            </div>
                        </div>

                        <form autoComplete="off" method="POST" onSubmit={handleSubmit} className="space-y-6">
                            <div className="rounded-md shadow-sm">
                                <div>
                                    <div
                                        className={`text-red-500 text-xs italic mb-2 pl-8 transition-[max-height,opacity,transform] duration-500 ease-in-out ${
                                            !isMailValid
                                                ? "max-h-32 opacity-100 translate-y-0"
                                                : "max-h-0 opacity-0 -translate-y-2"
                                        }`}
                                    >
                                        Invalid email address
                                    </div>
                                    <div className="flex items-center">
                                        <MdEmail className="w-8 h-8 mr-2" />
                                        <MainStringInput
                                            placeholder={lang.pages.login.email_placeholder}
                                            className={`${(!isMailValid) ? "!border-red-600 hover:border-red-500 " : ""} w-full sm:text-sm text-xs`}
                                            required
                                            autoComplete="off"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(toAsciiAlnumEmail(e))}
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
                                       onClick={() => router.push('/register')}
                                    >{lang.pages.login.signup_text}</p>

                                </div>
                            </div>

                            <div>
                                <button
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white text-black font-semibold text-sm transition-all duration-200 hover:bg-gray-100 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                                    type="submit"
                                    disabled={!email || (!password || password.length < 5) || !caToken || turnstileLoading || loading || !isValidEmail(email)}
                                >
                                    {lang.pages.login.button_text}
                                    <FaArrowRight size={14} />
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
