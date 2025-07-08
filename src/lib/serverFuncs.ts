'use server';

export async function logToServer(message: string, ...optionalParams: any[]) {
    console.log(`[Server] ${message}`, ...optionalParams);
}