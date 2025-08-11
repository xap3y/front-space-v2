'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {getApiUrl} from "@/lib/core";
import {errorToast, okToast} from "@/lib/client";
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

const RESET_WINDOW_ON_RESEND = true;

export default function RegistrationVerifyPage() {

    const [email, setEmail] = useState("");

    const router = useRouter();

    const { checkingAuth, authenticated, setCheckingAuth } = useAuthCheck({
        onInvalid: async ({ response, error }) => {
            setCheckingAuth(true)
            router.push("/login")
            console.log("Invalid auth:", response?.status, error);
        },
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
            router.replace("/register/verify", { scroll: false });
            localStorage.setItem(LS_EMAIL_VALUE, emailParam);
        }
    }, [])

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [secondsLeft, setSecondsLeft] = useState(VERIFY_WINDOW_SECONDS); // remaining main window seconds
    const [resendCooldown, setResendCooldown] = useState(0);               // remaining cooldown seconds
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
            // Either never started or already expired -> start a fresh window
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

    // Resend cooldown ticking
    useEffect(() => {
        if (!initialized) return;
        if (resendCooldown <= 0) return;
        const t = setInterval(() => {
            setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(t);
    }, [resendCooldown, initialized]);

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
            // Pasted multiple characters
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
    }, []);

    const submit = async () => {
        if (!isComplete || expired) return;
        setSubmitting(true);
        setErrorMsg(null);
        try {
            // Simulated API
            //await new Promise((res) => setTimeout(res, 800));
            // Real call example:
            // await fetch("/api/auth/verify-email", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ code: fullCode, email }),
            // });

            const response = await fetch(getApiUrl() + '/v1/auth/verify/email?code=' + fullCode, {
                method: 'POST',
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                errorToast("Invalid code. Please try again.");
                setDigits(Array(CODE_LENGTH).fill(""));
                return;
            }

            const data = await response.json();

            if (!data || data["error"] == true) {
                errorToast(data["message"] || "Verification failed. Please try again.");
                setDigits(Array(CODE_LENGTH).fill(""));
                return;
            }

            if (data["message"]) {
                okToast(data["message"] || "Email verified successfully!");
            }

            deleteCookie("verify_token")

            // wait 2 seconds before redirecting
            await new Promise((res) => setTimeout(res, 1000));
            clearPersistence();
            if (email.length > 0 && email.includes("@") && email.includes(".")) {
                router.push("/login?email=" + email);
            } else {
                const email = localStorage.getItem(LS_EMAIL_VALUE) || "";
                if (email && email.includes("@") && email.includes(".")) {
                    router.push("/login?email=" + email);
                } else {
                    router.push("/login");
                }
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
            // Real call:
            // await fetch("/api/auth/resend-email", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ email }),
            // });

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
                // If we do not reset window but we were expired, we still need something sensible:
                // Provide a new window anyway, otherwise user can never succeed.
                localStorage.setItem(LS_VERIFY_START, String(now));
                setSecondsLeft(VERIFY_WINDOW_SECONDS);
            }
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to resend email.");
        }
    }, [resendCooldown]);

    const startTelegram = async () => {
        if (tgLoading) return;
        setTgLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch(getApiUrl() + '/v1/auth/verify/telegram', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Failed to initiate Telegram verification.");
            }
            const data: { error: boolean; message: {
                token: string;
                botname: string;
            }} = await res.json();

            if (data.error) {
                errorToast("Failed to initiate Telegram verification: " + (data.message || "Unknown error"));
                return;
            }

            localStorage.setItem(LS_TELEGRAM_TOKEN, data.message.token);
            setTgLastToken(data.message.token);

            const url = `https://t.me/${encodeURIComponent(data.message.botname)}?start=${encodeURIComponent(data.message.token)}`;

            window.open(url, "_blank", "noopener,noreferrer");
        } catch (err: any) {
            setErrorMsg(err?.message || "Could not open Telegram.");
        } finally {
            setTgLoading(false);
        }
    };

    const handlePasteAllFromStart = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const raw = e.clipboardData.getData("text");
        const digitsOnly = raw.replace(/\D/g, "");
        if (!digitsOnly) return;

        const sliced = digitsOnly.slice(0, CODE_LENGTH);

        setDigits(sliced.padEnd(CODE_LENGTH, "").split(""));

        // Focus last filled digit or last input if full
        const lastIndex = Math.min(sliced.length - 1, CODE_LENGTH - 1);
        if (lastIndex >= 0) {
            inputsRef.current[lastIndex]?.focus();
        }
    };

    const cancel = () => {
        deleteCookie("verify_token");
        clearPersistence();
        router.push("/register");
    };

    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const resendMinutes = Math.floor(resendCooldown / 60);
    const resendSecs = resendCooldown % 60;

    if (checkingAuth) {
        return (
            <AuthChecking />
        );
    }

    return (
        <main
            className="flex min-h-screen items-center justify-center px-4"
            onPaste={(e) => {
                e.preventDefault();
                const raw = e.clipboardData.getData("text");
                const digitsOnly = raw.replace(/\D/g, "");
                if (!digitsOnly) return;

                const sliced = digitsOnly.slice(0, CODE_LENGTH);
                setDigits(sliced.padEnd(CODE_LENGTH, "").split(""));

                const lastIndex = Math.min(sliced.length - 1, CODE_LENGTH - 1);
                if (lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
            }}
        >
            <div className="w-full max-w-md rounded-md bg-primary_light/60 backdrop-blur-sm border border-primary_border shadow-card p-8">
                <h1 className="text-center text-xl font-semibold tracking-wide text-white">
                    Email Verification
                </h1>
                <p className="mt-1 text-center text-xs text-gray-400">
                    We sent a 6‑digit code to {email || "your email"}. Enter it below.
                </p>

                {/* Telegram button */}
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={startTelegram}
                        disabled={tgLoading}
                        className="w-full h-10 rounded-md flex items-center justify-center gap-2 bg-[#229ED9] text-sm font-medium text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-[#229ED9]/60 disabled:opacity-60"
                    >
                        {tgLoading ? (
                            <span className="animate-pulse">Opening Telegram...</span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
                                    <path fill="#29b6f6" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z"></path><path fill="#fff" d="M34,15l-3.7,19.1c0,0-0.2,0.9-1.2,0.9c-0.6,0-0.9-0.3-0.9-0.3L20,28l-4-2l-5.1-1.4c0,0-0.9-0.3-0.9-1	c0-0.6,0.9-0.9,0.9-0.9l21.3-8.5c0,0,0.7-0.2,1.1-0.2c0.3,0,0.6,0.1,0.6,0.5C34,14.8,34,15,34,15z"></path><path fill="#b0bec5" d="M23,30.5l-3.4,3.4c0,0-0.1,0.1-0.3,0.1c-0.1,0-0.1,0-0.2,0l1-6L23,30.5z"></path><path fill="#cfd8dc" d="M29.9,18.2c-0.2-0.2-0.5-0.3-0.7-0.1L16,26c0,0,2.1,5.9,2.4,6.9c0.3,1,0.6,1,0.6,1l1-6l9.8-9.1	C30,18.7,30.1,18.4,29.9,18.2z"></path>
                                </svg>
                                Verify with Telegram
                            </>
                        )}
                    </button>
                    {tgLastToken && (
                        <p className="mt-2 text-[11px] text-gray-500 text-center">
                            Token requested via Telegram. Enter the 6‑digit code the bot sent you.
                        </p>
                    )}
                </div>

                <div className="mt-6 flex justify-center gap-2">
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputsRef.current[i] = el; }}
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
            {minutes.toString().padStart(2,"0")}:{secs.toString().padStart(2,"0")}
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
                            ? `Resend in ${resendMinutes}:${resendSecs.toString().padStart(2,"0")}`
                            : "Resend Code"}
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
            </div>
        </main>
    );
}