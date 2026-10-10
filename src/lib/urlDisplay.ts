/** Decode presentation only; navigation/copy actions must keep the original URL. */
export function decodeUrlForDisplay(url: string): string {
    try {
        const storedAsFormValue = /^https?%3a/i.test(url);
        return decodeURIComponent(storedAsFormValue ? url.replace(/\+/g, " ") : url);
    } catch {
        return url;
    }
}
