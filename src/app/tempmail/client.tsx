"use client";

import { useEffect, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import { errorToast, okToast } from "@/lib/client";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useTurnstile } from "react-turnstile";
import { LoadingDot } from "@/components/GlobalComponents";
import { MdRefresh } from "react-icons/md";
import { useTempMail, TempMail } from "@/hooks/useTempMail";
import {EmailPage} from "@/app/email/client";

const STORAGE_KEY = "temp_mail_session_v1";

interface StoredTempMail {
    email: string;
    status: string;
    createdBy: string;
    expireAt: string | null;
    storedAt: number;
}

export default function TempMailPage() {
    const [loading, setLoading] = useState(true);
    const [tempMail, setTempMail] = useState<TempMail | null>(null);
    const [generating, setGenerating] = useState(false);
    const [turnstileLoading, setTurnStileLoading] = useState(true);
    const [token, setToken] = useState("");
    const turnstile = useTurnstile();
    const { createPublicTempMail } = useTempMail();

    // Load cached temp mail on mount
    useEffect(() => {
        const loadCachedTempMail = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) {
                    setLoading(false);
                    return;
                }

                const parsed: StoredTempMail = JSON.parse(stored);
                const storedTime = parsed.storedAt || 0;
                const oneHourMs = 60 * 60 * 1000;
                const isExpired = Date.now() - storedTime > oneHourMs;

                if (isExpired) {
                    localStorage.removeItem(STORAGE_KEY);
                    setLoading(false);
                    return;
                }

                // Verify the temp mail is still valid
                if (parsed.expireAt) {
                    const expireDate = new Date(parsed.expireAt);
                    if (expireDate < new Date()) {
                        localStorage.removeItem(STORAGE_KEY);
                        setLoading(false);
                        return;
                    }
                }

                const mail: TempMail = {
                    email: parsed.email,
                    status: parsed.status,
                    createdBy: parsed.createdBy,
                    expireAt: parsed.expireAt,
                };

                setTempMail(mail);
            } catch (e) {
                console.error('Failed to load cached temp mail:', e);
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                setLoading(false);
            }
        };

        loadCachedTempMail();
    }, []);

    async function handleGenerateTempMail(e: React.FormEvent) {
        e.preventDefault();

        if (!token) {
            return errorToast("Please complete the captcha");
        }

        setGenerating(true);

        try {
            const res = await createPublicTempMail(token);

            if (!res || res.error) {
                if (res.error && res.error.includes("Rate limit")) {
                    // IGNORE
                } else {
                    errorToast(res.error || "Failed to create temp mail");
                }

                turnstile.reset();
                setToken("");
                setGenerating(false);
                return;
            }

            const mail: TempMail = {
                email: res.message.email,
                status: "OPEN",
                createdBy: res.message.createdBy,
                expireAt: res.message.expireAt === 'never' ? null : res.message.expireAt,
            };

            setTempMail(mail);
            cacheTempMail(mail);
            okToast("Temp mail created successfully");
        } catch (err) {
            console.error(err);
            errorToast("Something went wrong");
            turnstile.reset();
            setToken("");
        } finally {
            setGenerating(false);
        }
    }

    function cacheTempMail(mail: TempMail) {
        try {
            const toStore: StoredTempMail = {
                email: mail.email,
                status: mail.status,
                createdBy: mail.createdBy,
                expireAt: mail.expireAt,
                storedAt: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch (e) {
            console.error('Failed to cache temp mail:', e);
        }
    }

    function handleClearCache() {
        localStorage.removeItem(STORAGE_KEY);
        setTempMail(null);
        setToken("");
        try {
            turnstile.reset();
        } catch (e) {
            // Ignore if turnstile is not ready
        }
    }

    if (loading) return <LoadingPage />;

    // If temp mail exists, show the inbox
    if (tempMail) {
        return (
            <main className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full" style={{ maxWidth: 1600 }}>
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={handleClearCache}
                            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                            title="Generate new temp mail"
                        >
                            <MdRefresh className="w-3.5 h-3.5" />
                            New Session
                        </button>
                    </div>
                    <EmailPage maxWidth={1600} isPublic={true} initialTempMail={tempMail} />
                </div>
            </main>
        );
    }

    // Show captcha form to generate temp mail
    return (
        <main className="flex lg:mt-0 mt-20 overflow-y-hidden items-center justify-center sm:min-h-screen">
            <div className="max-w-lg w-full mx-3">
                <div className="box-primary shadow-xl overflow-hidden">
                    <div className="p-3 lg:p-8">
                        <h2 className="text-center text-3xl font-extrabold text-white">
                            Temp Mail
                        </h2>
                        <div className="mt-4 text-base text-center text-gray-400">
                            Create a temporary email address to receive messages instantly.
                        </div>

                        <form onSubmit={handleGenerateTempMail} className="mt-8 space-y-6">
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
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transform duration-300 transition-all hover:bg-blue-600 bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={!token || generating}
                                >
                                    {generating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <LoadingDot size={"w-4"} />
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create Temp Mail'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center text-xs text-gray-500">
                            <p>No sign-up required. Your email expires in 7 days.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}