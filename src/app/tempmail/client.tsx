"use client";

import { useEffect, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import { errorToast, okToast } from "@/lib/client";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useTurnstile } from "react-turnstile";
import { LoadingDot } from "@/components/GlobalComponents";
import { useTempMail, TempMail, archiveToHistory } from "@/hooks/useTempMail";
import { useUser } from "@/hooks/useUser";
import { EmailPage } from "@/app/email/client";

/**
 * /tempmail — public-facing page.
 *
 * Logged-in user  → skips Cloudflare entirely, shows the same session as
 *                   /home/tempmail (shared localStorage key `lastTempMail`).
 * Guest user      → Cloudflare Turnstile form. Once created, shows the inbox
 *                   with a "New Address" button that re-shows the form.
 *                   Each new session auto-archives the previous one to history.
 */
export default function TempMailPage() {
    const { user, loadingUser } = useUser();
    const [pageLoading, setPageLoading] = useState(true);

    // ── guest state ───────────────────────────────────────────────────────────
    /** The currently active mail for a guest. Null = show Turnstile form. */
    const [guestMail, setGuestMail] = useState<TempMail | null>(null);
    const [generating, setGenerating] = useState(false);
    const [turnstileLoading, setTurnstileLoading] = useState(true);
    const [token, setToken] = useState("");
    const turnstile = useTurnstile();

    const { createPublicTempMail, loadFromLocalStorage } = useTempMail();

    // ── init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (loadingUser) return;

        if (user) {
            // Logged-in: will let EmailPage handle loading from shared localStorage
            setPageLoading(false);
            return;
        }

        // Guest: try to restore from the shared active-mail key (lastTempMail)
        // This ensures guests also see their last session on revisit.
        try {
            const raw = localStorage.getItem("lastTempMail");
            if (raw) {
                const parsed = JSON.parse(raw) as TempMail;
                // Show it even if expired — user can still see old emails
                setGuestMail(parsed);
            }
        } catch { /* ignore */ }

        setPageLoading(false);
    }, [loadingUser, user]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── guest: create new via Turnstile ──────────────────────────────────────
    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return errorToast("Please complete the captcha");

        setGenerating(true);
        try {
            const res = await createPublicTempMail(token);

            if (!res || res.error) {
                if (!res?.error?.includes("Rate limit")) {
                    errorToast(res?.error || "Failed to create temp mail");
                }
                turnstile.reset();
                setToken("");
                return;
            }

            const mail: TempMail = {
                email: res.message.email,
                status: "OPEN",
                createdBy: res.message.createdBy,
                expireAt: res.message.expireAt === "never" ? null : res.message.expireAt,
            };

            setGuestMail(mail);
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

    /** Called when guest clicks "New Address" inside the inbox */
    function handleGuestRequestNewSession() {
        // Archive current active to history
        if (guestMail) archiveToHistory(guestMail);
        // Clear active from storage so history panel doesn't count it twice
        try { localStorage.removeItem("lastTempMail"); } catch { /* ignore */ }
        // Reset state to show Turnstile form
        setGuestMail(null);
        setToken("");
        try { turnstile.reset(); } catch { /* ignore */ }
    }

    // ── render ─────────────────────────────────────────────────────────────────
    if (pageLoading || loadingUser) return <LoadingPage />;

    // Logged-in: fully delegate to EmailPage (same as /home/tempmail)
    if (user) {
        return (
            <main className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full" style={{ maxWidth: 1600 }}>
                    <EmailPage maxWidth={1600} isPublic={false} />
                </div>
            </main>
        );
    }

    // Guest with existing session: show inbox
    if (guestMail) {
        return (
            <main className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full" style={{ maxWidth: 1600 }}>
                    <EmailPage
                        maxWidth={1600}
                        isPublic={true}
                        initialTempMail={guestMail}
                        onRequestNewSession={handleGuestRequestNewSession}
                    />
                </div>
            </main>
        );
    }

    // Guest without session: Turnstile creation form
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

                        <form onSubmit={handleGenerate} className="mt-8 space-y-6">
                            <div className="mt-2 min-h-[66px]">
                                {turnstileLoading && (
                                    <div className="flex items-center justify-center h-16">
                                        <svg
                                            className="animate-spin h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    </div>
                                )}
                                <TurnstileWidget
                                    onVerified={(t) => setToken(t)}
                                    onError={() => { setToken(""); errorToast("Captcha failed, try again"); }}
                                    onLoad={() => setTurnstileLoading(false)}
                                    turnstile={turnstile}
                                />
                            </div>

                            <button
                                className="w-full flex justify-center py-3 px-4 border-2 border-emerald-600/40 hover:border-emerald-500 hover:in-shadow text-sm font-medium rounded-lg text-emerald-300 bg-primary1 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={!token || generating}
                            >
                                {generating ? (
                                    <span className="flex items-center gap-2">
                                        <LoadingDot size="w-4" />
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Temp Mail"
                                )}
                            </button>
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