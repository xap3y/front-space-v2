
export function toAsciiAlnumName(input: string): string {
    return input.normalize("NFKC").replace(/[^a-zA-Z0-9_-]/g, "");
}

export function toAsciiAlnumEmail(input: string): string {
    return input.normalize("NFKC").replace(/[^a-zA-Z0-9_@.-]/g, "");
}

export function toAsciiAlnumIp(input: string): string {
    return input.normalize("NFKC").replace(/[^a-zA-Z0-9_.:-]/g, "");
}

export function toAsciiAlnumPassword(input: string): string {
    return input.normalize("NFKC").replace(/[^\x21-\x7E]/g, "");
}

export function hexToInt(hex: string) {
    if (hex.startsWith("#")) {
        return parseInt(hex.replace("#", ""), 16);
    }
    return parseInt(hex, 16);
}

export function isValidEmail(email: string): boolean {
    const v = email.trim();
    if (!v) return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}