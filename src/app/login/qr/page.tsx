"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {FaCheck, FaSpinner, FaXmark} from "react-icons/fa6";
import HoverDiv from "@/components/HoverDiv";
import Surface from "@/components/ui/Surface";
import QrAccountPreview from "./QrAccountPreview";
import {postQrLogin, QrLoginError, type QrLoginScan} from "./qrLogin";

type View =
    | {step: "loading"}
    | {step: "signed-out"}
    | {step: "error"; message: string}
    | {step: "loaded"; token: string; request: QrLoginScan};

const scanTokenPattern = /^[A-Za-z0-9_-]{43}$/;

function problem(error: unknown): View {
    if (error instanceof QrLoginError && error.status === 401) {
        return {step: "signed-out"};
    }
    return {step: "error", message: error instanceof Error ? error.message : "Could not confirm QR sign-in"};
}

export default function QrLoginApprovalPage() {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const readToken = () => setToken(window.location.hash.slice(1));
        readToken();
        window.addEventListener("hashchange", readToken);
        return () => window.removeEventListener("hashchange", readToken);
    }, []);

    return (
        <main className="flex min-h-[85dvh] items-center justify-center px-3 py-8">
            <Surface className="box-primary w-full max-w-sm p-6 text-center shadow-xl">
                <h1 className="text-2xl font-bold text-white">Confirm QR sign-in</h1>
                <QrLoginApproval key={token ?? "loading"} token={token} />
            </Surface>
        </main>
    );
}

function QrLoginApproval({token}: {token: string | null}) {
    const [view, setView] = useState<View>({step: "loading"});
    const [saving, setSaving] = useState(false);
    const [decisionError, setDecisionError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function scan() {
            if (token === null) return;
            if (!scanTokenPattern.test(token)) {
                setView({step: "error", message: "Scan a QR code from the Space login page."});
                return;
            }
            try {
                const request = await postQrLogin<QrLoginScan>("scan", {token}, controller.signal);
                if (!controller.signal.aborted) {
                    setView({step: "loaded", token, request});
                }
            } catch (error) {
                if (!controller.signal.aborted) setView(problem(error));
            }
        }

        void scan();
        return () => controller.abort();
    }, [token]);

    async function decide(approve: boolean) {
        if (view.step !== "loaded" || view.request.state !== "SCANNED" || saving) return;

        setSaving(true);
        setDecisionError("");
        try {
            const state = await postQrLogin<"APPROVED" | "DENIED">("decision", {token: view.token, approve});
            setView({...view, request: {...view.request, state}});
        } catch (error) {
            if (error instanceof QrLoginError && error.status < 500) {
                setView(problem(error));
            } else {
                setDecisionError("Could not send your decision. Try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mt-5 flex flex-col gap-4 text-sm text-zinc-300" aria-live="polite">
            {view.step === "loading" && (
                <p className="flex items-center justify-center gap-2">
                    <FaSpinner className="motion-safe:animate-spin" aria-hidden="true" />
                    Checking the QR code…
                </p>
            )}
            {view.step === "signed-out" && (
                <>
                    <p>Open the QR link in a browser where you’re signed in to Space, or sign in here and scan it again.</p>
                    <Link href="/login" className="font-semibold text-sky-300 hover:underline">
                        Go to login
                    </Link>
                </>
            )}
            {view.step === "error" && <p>{view.message}</p>}
            {view.step === "loaded" && (
                <>
                    <QrAccountPreview account={view.request.account} />
                    {view.request.state === "APPROVED" && <p>Sign-in approved. You can return to the other device.</p>}
                    {view.request.state === "DENIED" && <p>Sign-in declined.</p>}
                    {view.request.state === "SCANNED" && (
                        <>
                            <p>Only approve a sign-in you started. Check that the other device shows this code.</p>
                            <p className="rounded-md border border-zinc-800 bg-primary1 py-2 font-mono text-xl font-semibold tracking-[0.25em] text-white">
                                {view.request.confirmationCode}
                            </p>
                            {decisionError && <p role="alert" className="text-red-300">{decisionError}</p>}
                            <div className="grid grid-cols-2 gap-3">
                                <HoverDiv
                                    type="DELETE"
                                    className="min-h-11 px-2"
                                    icon={<FaXmark aria-hidden="true" />}
                                    disabled={saving}
                                    onClick={() => void decide(false)}
                                >
                                    Decline
                                </HoverDiv>
                                <HoverDiv
                                    type="SAVE"
                                    className="min-h-11 px-2"
                                    icon={<FaCheck aria-hidden="true" />}
                                    disabled={saving}
                                    onClick={() => void decide(true)}
                                >
                                    Approve
                                </HoverDiv>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
