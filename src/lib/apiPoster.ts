import {ShortUrlDto} from "@/types/url";
import {postApi} from "@/lib/core";
import {PasteDto} from "@/types/paste";


export async function createShortUrl(url: string, apikey: string): Promise<ShortUrlDto | null> {
    console.log("Calling createShortUrl with url: " + url)

    const data = await postApi('/v1/url/create', {url: url}, apikey);

    if (!data) return null;

    const shortUrlDto = data as ShortUrlDto;

    shortUrlDto.uploader.createdAt = new Date(shortUrlDto.uploader.createdAt).toLocaleString()
    shortUrlDto.createdAt = new Date(shortUrlDto.createdAt).toLocaleString()

    return shortUrlDto;
}

export async function createPaste(title: string, paste: string, apikey: string): Promise<PasteDto | null> {
    console.log("Calling createPaste with paste: " + paste.substring(0, 15) + "...")

    const data = await postApi('/v1/paste/create', {title: title, text: paste}, apikey);

    if (!data) return null;

    const pasteDto = data as PasteDto;

    pasteDto.uploader.createdAt = new Date(pasteDto.uploader.createdAt).toLocaleString()
    pasteDto.createdAt = new Date(pasteDto.createdAt).toLocaleString()

    return pasteDto;
}