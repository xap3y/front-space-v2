"use client";

import {useEffect, useState} from "react";
import {FaKey, FaLock, FaXmark} from "react-icons/fa6";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv from "@/components/HoverDiv";
import {getApiUrl} from "@/lib/core";
import {toAsciiAlnumPassword} from "@/lib/clientFuncs";
import {errorToast, okToast} from "@/lib/client";
import {responseErrorMessage} from "@/lib/apiError";

type PasswordFieldProps = {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
};

function PasswordField({label, name, value, onChange}: PasswordFieldProps) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs text-zinc-500">{label}</span>
            <MainStringInput
                placeholder={label}
                type="password"
                name={name}
                autoComplete="new-password"
                value={value}
                onChange={(nextValue) => onChange(toAsciiAlnumPassword(nextValue))}
                className="w-full rounded-lg border-zinc-800 bg-black/30"
                inputClassName="px-3 py-2.5"
            />
        </label>
    );
}

export default function PasswordClient({apiKey}: {apiKey: string}) {
    const [open, setOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [verificationOpen, setVerificationOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const clearFields = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmation("");
        setTwoFactorCode("");
        setVerificationOpen(false);
    };

    const close = () => {
        if (busy) return;
        setOpen(false);
        clearFields();
    };

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (verificationOpen) {
                setVerificationOpen(false);
                setTwoFactorCode("");
            } else close();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, busy, verificationOpen]);

    useEffect(() => {
        fetch(getApiUrl() + "/v1/user/me/2fa", {headers: {"x-api-key": apiKey}})
            .then((response) => response.ok ? response.json() : null)
            .then((data) => setTwoFactorEnabled(Boolean(data?.message?.enabled)))
            .catch(() => setTwoFactorEnabled(false));
    }, [apiKey]);

    const submit = async () => {
        if (newPassword.length < 5) {
            errorToast("New password must be at least 5 characters");
            return;
        }

        if (newPassword !== confirmation) {
            errorToast("Password confirmation does not match");
            return;
        }

        setBusy(true);

        try {
            const response = await fetch(getApiUrl() + "/v1/user/me/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({oldPassword, newPassword, twoFactorCode}),
            });

            if (!response.ok) {
                const message = await responseErrorMessage(response, "Could not change password");
                if (twoFactorEnabled && !twoFactorCode && message.toLowerCase().includes("two-factor")) {
                    setVerificationOpen(true);
                    return;
                }
                throw new Error(message);
            }

            okToast("Password changed successfully");
            setOpen(false);
            clearFields();
        } catch (error) {
            errorToast(
                error instanceof Error ? error.message : "Could not change password",
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                <div>
                    <p className="text-sm font-semibold">Password</p>
                    <p className="text-xs text-zinc-500">Update your account password</p>
                </div>
                <HoverDiv
                    type="INFO"
                    icon={<FaLock/>}
                    onClick={() => setOpen(true)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold"
                >
                    Change password
                </HoverDiv>
            </div>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) close();
                    }}
                >
                    <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#101014] p-5 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 font-semibold">
                                    <FaLock className="text-blue-400"/>
                                    Change password
                                </h2>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Enter your current password to authorize this change.
                                </p>
                            </div>
                            <HoverDiv
                                type="INFO"
                                icon={<FaXmark/>}
                                onClick={close}
                                disabled={busy}
                                className="h-9 w-9 rounded-lg p-0"
                                aria-label="Close"
                            />
                        </div>

                        <form
                            autoComplete="off"
                            className="mt-5 space-y-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void submit();
                            }}
                        >
                            <PasswordField
                                label="Current password"
                                name="space-current-secret"
                                value={oldPassword}
                                onChange={setOldPassword}
                            />
                            <PasswordField
                                label="New password"
                                name="space-new-secret"
                                value={newPassword}
                                onChange={setNewPassword}
                            />
                            <PasswordField
                                label="Confirm new password"
                                name="space-confirm-secret"
                                value={confirmation}
                                onChange={setConfirmation}
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <HoverDiv
                                    type="INFO"
                                    onClick={close}
                                    disabled={busy}
                                    className="rounded-lg px-3 py-2 text-sm"
                                >
                                    Cancel
                                </HoverDiv>
                                <HoverDiv
                                    type="SAVE"
                                    icon={<FaKey/>}
                                    onClick={submit}
                                    disabled={
                                        busy ||
                                        !oldPassword ||
                                        !newPassword ||
                                        !confirmation
                                    }
                                    className="rounded-lg px-4 py-2 text-sm font-semibold"
                                >
                                    {busy ? "Changing…" : "Change password"}
                                </HoverDiv>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {verificationOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-[#101014] p-5 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div><h2 className="font-semibold">Confirm with 2FA</h2><p className="mt-1 text-xs text-zinc-500">Enter an authenticator or backup code to change your password.</p></div>
                            <HoverDiv type="INFO" icon={<FaXmark/>} onClick={() => {setVerificationOpen(false); setTwoFactorCode("");}} disabled={busy} className="h-9 w-9 rounded-lg p-0" aria-label="Close"/>
                        </div>
                        <MainStringInput value={twoFactorCode} onChange={(value) => setTwoFactorCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11))} autoComplete="one-time-code" placeholder="000000 or backup code" className="mt-4 w-full rounded-lg border-zinc-800 bg-black/30" inputClassName="px-3 py-2.5 font-mono" autoFocus/>
                        <div className="mt-4 flex justify-end gap-2"><HoverDiv type="INFO" onClick={() => {setVerificationOpen(false); setTwoFactorCode("");}} disabled={busy} className="rounded-lg px-3 py-2 text-sm">Back</HoverDiv><HoverDiv type="SAVE" icon={<FaKey/>} onClick={submit} disabled={busy || !twoFactorCode} className="rounded-lg px-4 py-2 text-sm font-semibold">{busy ? "Verifying…" : "Verify and change"}</HoverDiv></div>
                    </div>
                </div>
            )}
        </>
    );
}
