'use server';

export async function logToServer(message: string, ...optionalParams: any[]) {
    console.log(`[Server] ${message}`, ...optionalParams);
}

export async function getSecretKey(): Promise<string> {
    const key = process.env.SECRET_KEY;
    if (!key) {
        throw new Error("SECRET_KEY is not defined in environment variables.");
    }
    return key;
}
