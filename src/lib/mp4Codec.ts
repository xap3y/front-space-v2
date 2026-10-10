/**
 * Read only MP4 box headers and sample descriptions, skipping media payloads.
 * The backend independently validates the actual file with ffprobe.
 */
export async function inspectMp4Codec(file: Blob): Promise<string | null> {
    let headers = 0;
    const codecs: string[] = [];
    const containers = new Set(["moov", "trak", "mdia", "minf", "stbl"]);
    const videoEntries = new Set(["avc1", "avc3", "hvc1", "hev1", "av01", "vp09", "mp4v", "encv"]);

    async function scan(start: number, end: number, depth: number): Promise<void> {
        if (depth > 8) throw new Error("MP4 nesting limit");
        let position = start;
        while (position + 8 <= end) {
            if (++headers > 4096) throw new Error("MP4 box limit");
            const bytes = await file.slice(position, Math.min(position + 16, end)).arrayBuffer();
            const view = new DataView(bytes);
            let size = view.getUint32(0);
            const type = String.fromCharCode(...new Uint8Array(bytes, 4, 4));
            let headerSize = 8;
            if (size === 1) {
                if (bytes.byteLength < 16) throw new Error("Truncated MP4 box");
                const extended = view.getBigUint64(8);
                if (extended > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Invalid MP4 box size");
                size = Number(extended);
                headerSize = 16;
            } else if (size === 0) {
                size = end - position;
            }
            if (size < headerSize || position + size > end) throw new Error("Invalid MP4 box");
            if (containers.has(type)) {
                await scan(position + headerSize, position + size, depth + 1);
            } else if (type === "stsd") {
                const descriptionsStart = position + headerSize + 8;
                if (descriptionsStart > position + size) throw new Error("Invalid sample description");
                await scan(descriptionsStart, position + size, depth + 1);
            } else if (videoEntries.has(type)) {
                codecs.push(type);
            }
            position += size;
        }
    }

    try {
        await scan(0, file.size, 0);
        if (!codecs.length || codecs.includes("encv")) return null;
        return codecs.every((codec) => codec === "avc1" || codec === "avc3")
            ? "h264"
            : codecs.find((codec) => codec !== "avc1" && codec !== "avc3") ?? null;
    } catch {
        return null;
    }
}
