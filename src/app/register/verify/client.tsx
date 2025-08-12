'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {getApiUrl} from "@/lib/core";
import {deleteVerifyToken, errorToast, okToast} from "@/lib/client";
import {deleteCookie} from "cookies-next/client";
import {useAuthCheck} from "@/hooks/useAuthCheck";
import {AuthChecking} from "@/components/AuthChecking";

const CODE_LENGTH = 6;
const VERIFY_WINDOW_SECONDS = 15 * 60;
const RESEND_COOLDOWN_SECONDS = 2 * 60;

const LS_VERIFY_START = "verifyEmail:startAt";
const LS_EMAIL_VALUE = "verifyEmail:email";
const LS_RESEND_AVAILABLE_AT = "verifyEmail:resendAt";
const LS_TELEGRAM_TOKEN = "verifyEmail:tgToken";
const LS_VERIFY_METHOD = "verifyEmail:method";
const LS_EMAIL_DIGITS = "verifyEmail:digits";

const WS_URL = process.env.NEXT_PUBLIC_TELEGRAM_WEBSOCKET_URL || "ws://localhost:8012/ws/verify";

const RESET_WINDOW_ON_RESEND = true;

type VerifyMethod = "none" | "email" | "telegram";

export default function RegistrationVerifyPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "waiting" | "verified" | "error">("idle");
    const [method, setMethod] = useState<VerifyMethod>("none");

    const wsRef = useRef<WebSocket | null>(null);
    const router = useRouter();

    const { checkingAuth, setCheckingAuth } = useAuthCheck({
        onInvalid: async ({ response, error }) => {
            //setCheckingAuth(true);
            //router.push("/login");
            console.log("Invalid auth:", response?.status, error);
        },
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        if (emailParam) {
            setEmail(emailParam);
            router.replace("/register/verify", { scroll: false });
            localStorage.setItem(LS_EMAIL_VALUE, emailParam);
        }
    }, [router]);

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [secondsLeft, setSecondsLeft] = useState(VERIFY_WINDOW_SECONDS);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [initialized, setInitialized] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [tgLoading, setTgLoading] = useState(false);
    const [tgLastToken, setTgLastToken] = useState<string | null>(null);

    const fullCode = digits.join("");
    const isComplete = fullCode.length === CODE_LENGTH && /^[0-9]{6}$/.test(fullCode);
    const expired = secondsLeft <= 0;

    // Initialize timers from localStorage (run once client-side)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const now = Date.now();

        // Verification window start
        let startAt = parseInt(localStorage.getItem(LS_VERIFY_START) || "0", 10);
        if (!startAt || isNaN(startAt) || now - startAt >= VERIFY_WINDOW_SECONDS * 1000) {
            startAt = now;
            localStorage.setItem(LS_VERIFY_START, String(startAt));
        }
        const elapsed = Math.floor((now - startAt) / 1000);
        const remaining = Math.max(VERIFY_WINDOW_SECONDS - elapsed, 0);
        setSecondsLeft(remaining);

        // Resend cooldown
        let resendAt = parseInt(localStorage.getItem(LS_RESEND_AVAILABLE_AT) || "0", 10);
        if (!resendAt || isNaN(resendAt) || resendAt <= now) {
            setResendCooldown(0);
        } else {
            setResendCooldown(Math.ceil((resendAt - now) / 1000));
        }

        const savedMethod = (localStorage.getItem(LS_VERIFY_METHOD) as VerifyMethod) || "none";
        setMethod(savedMethod);

        const savedDigits = localStorage.getItem(LS_EMAIL_DIGITS);
        if (savedDigits) {
            const arr = savedDigits.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
            setDigits([...arr, ...Array(CODE_LENGTH - arr.length).fill("")]);
        }

        setInitialized(true);
    }, []);

    // Verification window ticking
    useEffect(() => {
        if (!initialized) return;
        if (secondsLeft <= 0) return;
        const t = setInterval(() => {
            setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(t);
    }, [secondsLeft, initialized]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem(LS_VERIFY_METHOD, method);
    }, [method]);

    // Resend cooldown ticking
    useEffect(() => {
        if (!initialized) return;
        if (resendCooldown <= 0) return;
        const t = setInterval(() => {
            setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(t);
    }, [resendCooldown, initialized]);

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const handleChange = (index: number, value: string) => {
        if (expired) return;
        const v = value.replace(/\D/g, "");
        if (!v) {
            setDigits((prev) => {
                const copy = [...prev];
                copy[index] = "";
                return copy;
            });
            return;
        }
        if (v.length > 1) {
            setDigits((prev) => {
                const copy = [...prev];
                const chars = v.split("").slice(0, CODE_LENGTH - index);
                for (let i = 0; i < chars.length; i++) {
                    copy[index + i] = chars[i];
                }
                return copy;
            });
            const finalPos = Math.min(index + v.length - 1, CODE_LENGTH - 1);
            inputsRef.current[finalPos]?.focus();
        } else {
            setDigits((prev) => {
                const copy = [...prev];
                copy[index] = v;
                return copy;
            });
            if (index < CODE_LENGTH - 1) {
                inputsRef.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        const target = e.target as HTMLInputElement;
        const index = Number(target.dataset.index);
        if (e.key === "Backspace" && !digits[index]) {
            if (index > 0) inputsRef.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const clearPersistence = useCallback(() => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(LS_VERIFY_START);
        localStorage.removeItem(LS_RESEND_AVAILABLE_AT);
        localStorage.removeItem(LS_VERIFY_METHOD);
    }, []);

    const submit = async () => {
        if (!isComplete || expired) return;
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const response = await fetch(getApiUrl() + "/v1/auth/verify/email?code=" + fullCode, {
                method: "POST",
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) {
                errorToast("Invalid code. Please try again.");
                setDigits(Array(CODE_LENGTH).fill(""));
                return;
            }

            const data = await response.json();

            if (!data || data["error"] === true) {
                errorToast(data["message"] || "Verification failed. Please try again.");
                setDigits(Array(CODE_LENGTH).fill(""));
                return;
            }

            if (data["message"]) {
                okToast(data["message"] || "Email verified successfully!");
            }
            deleteVerifyToken()

            await new Promise((res) => setTimeout(res, 1000));
            clearPersistence();

            const emailToUse =
                (email && email.includes("@") && email.includes(".")) ? email :
                    (localStorage.getItem(LS_EMAIL_VALUE) || "");

            if (emailToUse && emailToUse.includes("@") && emailToUse.includes(".")) {
                router.push("/login?email=" + emailToUse);
            } else {
                router.push("/login");
            }
        } catch (err: any) {
            setErrorMsg(err?.message || "Verification failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const resend = useCallback(async () => {
        if (resendCooldown > 0) return;
        setErrorMsg(null);
        try {
            // Simulate
            await new Promise((res) => setTimeout(res, 500));

            // Reset code inputs
            setDigits(Array(CODE_LENGTH).fill(""));
            inputsRef.current[0]?.focus();

            // Start new cooldown
            const now = Date.now();
            const resendAvailableAt = now + RESEND_COOLDOWN_SECONDS * 1000;
            localStorage.setItem(LS_RESEND_AVAILABLE_AT, String(resendAvailableAt));
            setResendCooldown(RESEND_COOLDOWN_SECONDS);

            // Optionally reset the 15 min window
            if (RESET_WINDOW_ON_RESEND) {
                localStorage.setItem(LS_VERIFY_START, String(now));
                setSecondsLeft(VERIFY_WINDOW_SECONDS);
            } else if (expired) {
                localStorage.setItem(LS_VERIFY_START, String(now));
                setSecondsLeft(VERIFY_WINDOW_SECONDS);
            }
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to resend email.");
        }
    }, [resendCooldown, expired]);

    const connectWs = (channelToken: string) => {
        const url = `${WS_URL}?telCode=${encodeURIComponent(channelToken)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onopen = () => {
            setStatus("waiting");
        };
        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg.type === "verified") {
                    setStatus("verified");
                    localStorage.removeItem(LS_VERIFY_METHOD);
                    localStorage.removeItem(LS_EMAIL_DIGITS);
                    localStorage.removeItem(LS_TELEGRAM_TOKEN);
                    setTimeout(() => router.push(msg.redirect || "/login"), 1000);
                    okToast("Telegram verification successful!", 3000);
                }
            } catch (e) {
                console.error("WS parse error", e);
            }
        };
        ws.onerror = () => {
            setStatus("error");
        };
        ws.onclose = () => {
            // no-op
        };
    };

    const startTelegram = async () => {
        if (tgLoading) return;
        setTgLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch(getApiUrl() + "/v1/auth/verify/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!res.ok) {
                errorToast("Failed to initiate Telegram verification.")
                return;
            }
            const data: {
                error: boolean;
                message: {
                    token: string;
                    botname: string;
                };
            } = await res.json();

            if (data.error) {
                errorToast("Failed to initiate Telegram verification: " + (data.message || "Unknown error"));
                return;
            }

            localStorage.setItem(LS_TELEGRAM_TOKEN, data.message.token);
            setTgLastToken(data.message.token);

            // Connect WS and open deep link
            connectWs(data.message.token);
            setMethod("telegram")
            const url = `https://t.me/${encodeURIComponent(data.message.botname)}?start=${encodeURIComponent(
                data.message.token
            )}`;
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (err: any) {
            setErrorMsg(err?.message || "Could not open Telegram.");
        } finally {
            setTgLoading(false);
        }
    };

    // When user chooses Telegram on the first screen: immediately start the flow
    const chooseTelegram = async () => {
        await startTelegram();
    };

    const chooseEmail = async () => {
        try {
            const res = await fetch(getApiUrl() + "/v1/auth/verify/sendemail", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });

            if (!res.ok) {
                errorToast("Failed to initiate email verification.")
                return;
            }

            setMethod("email")
        } catch (err: any) {
            setErrorMsg(err?.message || "Could not initiate email verification.");
        }
    }

    const handlePasteAllFromStart = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const raw = e.clipboardData.getData("text");
        const digitsOnly = raw.replace(/\D/g, "");
        if (!digitsOnly) return;

        const sliced = digitsOnly.slice(0, CODE_LENGTH);
        setDigits(sliced.padEnd(CODE_LENGTH, "").split(""));

        const lastIndex = Math.min(sliced.length - 1, CODE_LENGTH - 1);
        if (lastIndex >= 0) {
            inputsRef.current[lastIndex]?.focus();
        }
    };

    const cancel = () => {
        deleteVerifyToken()
        clearPersistence();
        router.push("/register");
    };

    const changeMethod = () => {
        // Clean up Telegram WS if open
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setStatus("idle");
        setTgLastToken(null);
        setTgLoading(false);
        setErrorMsg(null);
        setMethod("none");
    };

    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const resendMinutes = Math.floor(resendCooldown / 60);
    const resendSecs = resendCooldown % 60;

    if (checkingAuth) {
        return <AuthChecking />;
    }

    // Handle global paste only for email method
    const handleMainPaste: React.ClipboardEventHandler<HTMLElement> = (e) => {
        if (method !== "email") return;
        e.preventDefault();
        const raw = e.clipboardData.getData("text");
        const digitsOnly = raw.replace(/\D/g, "");
        if (!digitsOnly) return;

        const sliced = digitsOnly.slice(0, CODE_LENGTH);
        setDigits(sliced.padEnd(CODE_LENGTH, "").split(""));

        const lastIndex = Math.min(sliced.length - 1, CODE_LENGTH - 1);
        if (lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4" onPaste={handleMainPaste}>
            <div className="w-full max-w-md rounded-md bg-primary_light/60 backdrop-blur-sm border border-primary_border shadow-card p-8">
                {/* Method chooser */}
                {method === "none" && (
                    <>
                        <h1 className="text-center text-xl font-semibold tracking-wide text-white">Choose verification method</h1>
                        <p className="mt-1 text-center text-xs text-gray-400">
                            Verify your account with email code or Telegram.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <button
                                type="button"
                                onClick={chooseEmail}
                                className="h-11 rounded-md bg-telegram-darker text-sm font-medium text-white transition hover:brightness-110"
                            >
                                Verify via Email
                            </button>

                            <button
                                type="button"
                                onClick={chooseTelegram}
                                disabled={tgLoading}
                                className="h-11 rounded-md flex items-center justify-center gap-2 bg-telegram-darker text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                            >
                                {/* Telegram icon on the first page button */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    x="0px"
                                    y="0px"
                                    width="22"
                                    height="22"
                                    viewBox="0 0 48 48"
                                >
                                    <path fill="#29b6f6" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z"></path>
                                    <path
                                        fill="#fff"
                                        d="M34,15l-3.7,19.1c0,0-0.2,0.9-1.2,0.9c-0.6,0-0.9-0.3-0.9-0.3L20,28l-4-2l-5.1-1.4c0,0-0.9-0.3-0.9-1	c0-0.6,0.9-0.9,0.9-0.9l21.3-8.5c0,0,0.7-0.2,1.1-0.2c0.3,0,0.6,0.1,0.6,0.5C34,14.8,34,15,34,15z"
                                    ></path>
                                    <path fill="#b0bec5" d="M23,30.5l-3.4,3.4c0,0-0.1,0.1-0.3,0.1c-0.1,0-0.1,0-0.2,0l1-6L23,30.5z"></path>
                                    <path
                                        fill="#cfd8dc"
                                        d="M29.9,18.2c-0.2-0.2-0.5-0.3-0.7-0.1L16,26c0,0,2.1,5.9,2.4,6.9c0.3,1,0.6,1,0.6,1l1-6l9.8-9.1	C30,18.7,30.1,18.4,29.9,18.2z"
                                    ></path>
                                </svg>
                                {tgLoading ? "Starting..." : "Verify via Telegram"}
                            </button>
                        </div>

                        <p className="mt-6 text-center text-[11px] text-gray-500">
                            You can switch methods later if needed.
                        </p>
                    </>
                )}

                {/* Email method */}
                {method === "email" && (
                    <>
                        <h1 className="text-center text-xl font-semibold tracking-wide text-white">Email Verification</h1>
                        <p className="mt-1 text-center text-xs text-gray-400">
                            We sent a 6‑digit code to {email || "your email"}. Enter it below.
                        </p>

                        <div className="mt-6 flex justify-center gap-2">
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={(el) => {
                                        inputsRef.current[i] = el;
                                    }}
                                    data-index={i}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={1}
                                    value={d}
                                    onPaste={handlePasteAllFromStart}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="h-12 w-12 rounded-md border border-primary_border bg-primary_light text-center text-lg font-medium tracking-wider text-white focus:border-telegram focus:outline-none focus:ring-1 focus:ring-telegram disabled:opacity-40"
                                />
                            ))}
                        </div>

                        <div className="mt-4 text-center text-sm text-gray-400">
                            Time remaining:{" "}
                            <span className={expired ? "text-danger font-semibold" : "text-gray-200"}>
                {minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
              </span>
                        </div>

                        {errorMsg && (
                            <div className="mt-4 rounded bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
                                {errorMsg}
                            </div>
                        )}

                        {expired && (
                            <div className="mt-4 rounded bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-sm text-yellow-400">
                                The code expired. Resend a new code to continue.
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={submit}
                                disabled={!isComplete || submitting || expired}
                                className="h-10 rounded-md bg-telegram text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-telegram/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Verifying..." : "Continue"}
                            </button>

                            <button
                                type="button"
                                onClick={resend}
                                disabled={resendCooldown > 0 || expired}
                                className="h-10 rounded-md border border-primary_border bg-primary_light text-sm font-medium text-gray-200 hover:border-telegram/70 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-telegram/60 disabled:opacity-40"
                            >
                                {resendCooldown > 0
                                    ? `Resend in ${resendMinutes}:${resendSecs.toString().padStart(2, "0")}`
                                    : "Resend Code"}
                            </button>

                            <button
                                type="button"
                                onClick={changeMethod}
                                className="h-10 rounded-md border border-transparent text-sm font-medium text-gray-400 hover:text-white hover:underline"
                            >
                                Change verification method
                            </button>

                            <button
                                type="button"
                                onClick={cancel}
                                className="h-10 rounded-md border border-transparent text-sm font-medium text-gray-400 hover:text-white hover:underline"
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="mt-6 text-center text-[11px] text-gray-500">
                            Didn&apos;t receive the email? Check spam or request a new code.
                        </p>
                    </>
                )}

                {/* Telegram method */}
                {method === "telegram" && (
                    <>
                        <h1 className="text-center text-xl font-semibold tracking-wide text-white">Telegram Verification</h1>
                        <p className="mt-1 text-center text-xs text-gray-400">
                            We will detect your verification automatically after you start the Telegram flow.
                        </p>

                        <div className="mt-6">
                            {/* We already started the flow from the first screen. Provide a secondary button to re-open if needed */}
                            <button
                                type="button"
                                onClick={startTelegram}
                                disabled={tgLoading}
                                className="w-full h-10 rounded-md flex items-center justify-center gap-2 bg-[#229ED9] text-sm font-medium text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-[#229ED9]/60 disabled:opacity-60"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    x="0px"
                                    y="0px"
                                    width="22"
                                    height="22"
                                    viewBox="0 0 48 48"
                                >
                                    <path fill="#29b6f6" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z"></path>
                                    <path
                                        fill="#fff"
                                        d="M34,15l-3.7,19.1c0,0-0.2,0.9-1.2,0.9c-0.6,0-0.9-0.3-0.9-0.3L20,28l-4-2l-5.1-1.4c0,0-0.9-0.3-0.9-1	c0-0.6,0.9-0.9,0.9-0.9l21.3-8.5c0,0,0.7-0.2,1.1-0.2c0.3,0,0.6,0.1,0.6,0.5C34,14.8,34,15,34,15z"
                                    ></path>
                                    <path fill="#b0bec5" d="M23,30.5l-3.4,3.4c0,0-0.1,0.1-0.3,0.1c-0.1,0-0.1,0-0.2,0l1-6L23,30.5z"></path>
                                    <path
                                        fill="#cfd8dc"
                                        d="M29.9,18.2c-0.2-0.2-0.5-0.3-0.7-0.1L16,26c0,0,2.1,5.9,2.4,6.9c0.3,1,0.6,1,0.6,1l1-6l9.8-9.1	C30,18.7,30.1,18.4,29.9,18.2z"
                                    ></path>
                                </svg>
                                {tgLoading ? "Opening Telegram..." : "Open Telegram again"}
                            </button>

                            <div className={"mt-6"}>
                                <StatusBlock status={status} />
                            </div>


                            {/*{tgLastToken && (
                                <p className="mt-2 text-[11px] text-gray-500 text-center">
                                    Waiting for Telegram confirmation...
                                </p>
                            )}*/}
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={changeMethod}
                                className="h-10 rounded-md border border-transparent text-sm font-medium text-gray-400 hover:text-white hover:underline"
                            >
                                Change verification method
                            </button>

                            <button
                                type="button"
                                onClick={cancel}
                                className="h-10 rounded-md border border-transparent text-sm font-medium text-gray-400 hover:text-white hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

function StatusBlock({ status }: { status: string }) {
    if (status === "idle") return <p className="text-center text-gray-500 text-xs">Not started.</p>;
    if (status === "waiting") return <p className="text-center text-blue-400 text-xs animate-pulse">Waiting for Telegram confirmation...</p>;
    if (status === "verified") return <p className="text-center text-green-400 text-xs">Verified! Redirecting...</p>;
    if (status === "error") return <p className="text-center text-red-400 text-xs">Connection error. Try again.</p>;
    return null;
}