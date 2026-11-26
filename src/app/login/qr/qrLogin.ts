import {responseErrorMessage} from "@/lib/apiError";
import {getApiUrl} from "@/lib/core";

export type QrLoginState = "WAITING" | "SCANNED" | "APPROVED" | "DENIED";

export type QrAccount = {
    username: string;
    avatar: string | null;
};

export type QrLoginStart = {
    browserToken: string;
    scanToken: string;
    confirmationCode: string;
};

export type QrLoginStatus =
    | {state: "WAITING" | "DENIED"; account: null}
    | {state: "SCANNED" | "APPROVED"; account: QrAccount};

export type QrLoginScan = {
    state: Exclude<QrLoginState, "WAITING">;
    confirmationCode: string;
    account: QrAccount;
};

export class QrLoginError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}

export async function postQrLogin<T>(
    action: "start" | "status" | "scan" | "decision" | "redeem",
    body: {token?: string; approve?: boolean},
    signal?: AbortSignal,
): Promise<T> {
    const response = await fetch(`${getApiUrl()}/v1/auth/qr/${action}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify(body),
        signal,
    });
    if (!response.ok) {
        throw new QrLoginError(response.status, await responseErrorMessage(response, "QR sign-in is unavailable"));
    }
    const result = await response.json() as {message: T};
    return result.message;
}
