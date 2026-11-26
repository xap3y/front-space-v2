"use client";

import {useEffect, useEffectEvent, useRef, useState} from "react";
import {FaArrowLeft, FaRotateRight, FaSpinner} from "react-icons/fa6";
import HoverDiv from "@/components/HoverDiv";
import Surface from "@/components/ui/Surface";
import type {UserObj} from "@/types/user";
import QrAccountPreview from "./qr/QrAccountPreview";
import {postQrLogin, type QrAccount, type QrLoginStart, type QrLoginStatus} from "./qr/qrLogin";

type View =
    | {step: "loading"}
    | {step: "ready"; image: string; confirmationCode: string}
    | {step: "scanned"; account: QrAccount; confirmationCode: string}
    | {step: "signing-in"; account: QrAccount}
    | {step: "unavailable"; message: string};

export default function QrLoginPanel({onBack, onSignedIn}: {
    onBack: () => void;
    onSignedIn: (user: UserObj) => Promise<void>;
}) {
    const [view, setView] = useState<View>({step: "loading"});
    const [attempt, setAttempt] = useState(0);
    const title = useRef<HTMLHeadingElement>(null);
    const signIn = useEffectEvent(onSignedIn);

    useEffect(() => {
        title.current?.focus();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const {signal} = controller;
        let nextPoll: number | undefined;

        function showError(error: unknown) {
            if (!signal.aborted) {
                setView({
                    step: "unavailable",
                    message: error instanceof Error ? error.message : "Could not complete QR sign-in",
                });
            }
        }

        async function poll(token: string, confirmationCode: string) {
            try {
                const result = await postQrLogin<QrLoginStatus>("status", {token}, signal);
                if (signal.aborted) return;

                if (result.state === "DENIED") {
                    setView({step: "unavailable", message: "Sign-in was declined on your phone"});
                    return;
                }
                if (result.state === "APPROVED") {
                    setView({step: "signing-in", account: result.account});
                    const user = await postQrLogin<UserObj>("redeem", {token}, signal);
                    if (!signal.aborted) {
                        await signIn(user);
                    }
                    return;
                }
                if (result.state === "SCANNED") {
                    setView(current => current.step === "scanned"
                        ? current
                        : {step: "scanned", account: result.account, confirmationCode});
                }
                nextPoll = window.setTimeout(() => void poll(token, confirmationCode), 1200);
            } catch (error) {
                showError(error);
            }
        }

        async function start() {
            try {
                const challenge = await postQrLogin<QrLoginStart>("start", {}, signal);
                const {default: QRCode} = await import("qrcode");
                const scanUrl = `${window.location.origin}/login/qr#${challenge.scanToken}`;
                const image = await QRCode.toDataURL(scanUrl, {width: 256, margin: 4});
                if (signal.aborted) return;

                setView({step: "ready", image, confirmationCode: challenge.confirmationCode});
                nextPoll = window.setTimeout(() => void poll(challenge.browserToken, challenge.confirmationCode), 1200);
            } catch (error) {
                showError(error);
            }
        }

        void start();
        return () => {
            controller.abort();
            window.clearTimeout(nextPoll);
        };
    }, [attempt]);

    return (
        <main className="flex min-h-screen items-center justify-center px-3 py-8">
            <Surface className="box-primary w-full max-w-sm p-6 text-center shadow-xl sm:p-8">
                <h2 ref={title} tabIndex={-1} className="text-2xl font-bold text-white outline-none">Sign in with QR code</h2>

                <div className="my-6 flex min-h-60 flex-col items-center justify-center gap-4" aria-live="polite">
                    {view.step === "loading" && (
                        <p className="flex items-center gap-2 text-sm text-zinc-400">
                            <FaSpinner className="motion-safe:animate-spin" aria-hidden="true" />
                            Generating QR code…
                        </p>
                    )}
                    {view.step === "ready" && (
                        <>
                            <p className="text-sm text-zinc-300">Scan with your phone’s camera and open the link in a browser where you’re signed in to Space.</p>
                            <img src={view.image} width={256} height={256} className="size-52 rounded-md" alt="QR code for Space sign-in" />
                        </>
                    )}
                    {(view.step === "scanned" || view.step === "signing-in") && (
                        <>
                            <QrAccountPreview account={view.account} />
                            <p className="text-sm text-zinc-300">
                                {view.step === "scanned" ? "Confirm the sign-in on your phone." : "Signing you in…"}
                            </p>
                        </>
                    )}
                    {(view.step === "ready" || view.step === "scanned") && (
                        <div className="text-xs text-zinc-400">
                            <span className="mr-2">Matching code</span>
                            <span className="font-mono font-semibold tracking-widest text-zinc-100">{view.confirmationCode}</span>
                        </div>
                    )}
                    {view.step === "unavailable" && (
                        <>
                            <p className="text-sm text-zinc-300">{view.message}</p>
                            <HoverDiv
                                icon={<FaRotateRight aria-hidden="true" />}
                                onClick={() => {
                                    setView({step: "loading"});
                                    setAttempt(current => current + 1);
                                }}
                            >
                                Generate a new code
                            </HoverDiv>
                        </>
                    )}
                </div>

                <HoverDiv
                    className="h-9 w-full px-3 text-sm"
                    icon={<FaArrowLeft aria-hidden="true" />}
                    onClick={onBack}
                    disabled={view.step === "signing-in"}
                >
                    Back to login
                </HoverDiv>
            </Surface>
        </main>
    );
}
