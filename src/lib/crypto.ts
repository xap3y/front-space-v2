// @lib/crypto.ts

// Ensure the secret key is available
// Convert the secret key to a CryptoKey
import {getSecretKey} from "@/lib/core";

async function getCryptoKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const key = getSecretKey()
    const keyData = encoder.encode(key);
    if (keyData.length !== 32) {
        throw new Error("SECRET_KEY must be a 32-character string.");
    }
    return await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-CBC" },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a message
export async function encrypt(message: string): Promise<string> {
    const cryptoKey = await getCryptoKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(16));
    console.log("IV length:", iv.length);

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        cryptoKey,
        data
    );

    // Combine the IV and encrypted data into a single buffer
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to a base64 string for easy storage/transmission
    return Buffer.from(combined).toString("base64");
}

// Decrypt a message
export async function decrypt(encryptedMessage: string): Promise<string> {
    const cryptoKey = await getCryptoKey();

    // Convert the base64 string back to a Uint8Array
    const combined = Buffer.from(encryptedMessage, "base64");
    const iv = combined.slice(0, 16);
    console.log("IV length:", iv.length);
    const encryptedData = combined.slice(16);

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        cryptoKey,
        encryptedData
    );

    // Convert the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}