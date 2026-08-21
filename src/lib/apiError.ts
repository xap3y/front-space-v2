import axios from "axios";

type ErrorPayload = { message?: unknown; error?: unknown };

export function apiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const payload = error.response?.data as ErrorPayload | string | undefined;
        if (typeof payload === "string" && payload.trim()) return payload;
        if (payload && typeof payload === "object") {
            if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
            if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
        }
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
}

export async function responseErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const payload = await response.json() as ErrorPayload;
        if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
        if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
    } catch { /* use fallback */ }
    return fallback;
}
