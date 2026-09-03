import {getApiUrl} from "@/lib/core";

export async function processMedia(
    endpoint: string,
    file: File,
    options: Record<string, string | number | boolean>,
    onProgress?: (pct: number) => void,
    apiKey?: string
): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append("file", file);

    // Append each option as a separate form field (Spring @RequestParam)
    Object.entries(options).forEach(([key, value]) => {
        formData.append(key, String(value));
    });

    onProgress?.(20);

    const response = await fetch(`${getApiUrl()}/v1/tools/${endpoint}`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: apiKey ? {"X-API-Key": apiKey} : undefined,
        // Don't set Content-Type — browser sets it with boundary for FormData
    });

    onProgress?.(70);

    if (!response.ok) {
        // Try to parse JSON error from Spring
        const contentType = response.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData?.message || errorData?.errorMessage || `Processing failed (${response.status})`);
        }
        // Might be a JSON error returned as byte[] from the service
        const text = await response.text();
        let parsedMessage = "";
        try {
            const parsed = JSON.parse(text);
            parsedMessage = parsed.error || parsed.message || "";
        } catch {}
        if (parsedMessage) throw new Error(parsedMessage);
        throw new Error(`Processing failed (${response.status})`);
    }

    // Extract filename from Content-Disposition header
    const disposition = response.headers.get("Content-Disposition") || "";
    let filename = "output";
    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
    const match = disposition.match(/filename="?([^";\n]+)"?/i);
    if (encodedMatch) {
        filename = decodeURIComponent(encodedMatch[1]);
    } else if (match) {
        filename = match[1];
    } else {
        // Fallback: build filename from endpoint
        const parts = endpoint.split("/");
        const tool = parts[parts.length - 1];
        const ext = guessExtension(response.headers.get("Content-Type"));
        filename = `output_${tool}${ext}`;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    onProgress?.(100);

    return { url, filename, size: blob.size };
}

function guessExtension(contentType: string | null): string {
    if (!contentType) return "";
    const map: Record<string, string> = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
        "image/avif": ".avif",
        "image/x-icon": ".ico",
        "image/vnd.adobe.photoshop": ".psd",
        "image/svg+xml": ".svg",
        "image/jxl": ".jxl",
        "image/apng": ".apng",
        "application/postscript": ".eps",
        "application/pdf": ".pdf",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/x-matroska": ".mkv",
        "video/avi": ".avi",
        "video/quicktime": ".mov",
        "video/mp2t": ".ts",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/aac": ".aac",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
    };
    return map[contentType] || "";
}
