'use server';
import {getValidatedResponse} from "@/lib/core";
import {UserObj} from "@/types/user";
import {UploadedImage} from "@/types/image";
import {PasteDto} from "@/types/paste";

export async function getUserApi(id: string): Promise<UserObj | null> {
    console.log("Calling getUserApi with id: " + id)

    const data = await getValidatedResponse('/v1/user/get/' + id);
    console.log("data is " + data)
    if (!data) return null;
    const user = data as UserObj;
    user.createdAt = new Date(user.createdAt).toLocaleString()
    console.log("user is " + user)
    return user;
}

export async function getImageInfoApi(uid: string): Promise<UploadedImage | null> {
    console.log("Calling getImageInfoApi with uid: " + uid)

    const data = await getValidatedResponse('/v1/image/info/' + uid);
    if (!data) return null;
    const img = data as UploadedImage;
    img.uploader.createdAt = new Date(img.uploader.createdAt).toLocaleString()
    img.uploadedAt = new Date(img.uploadedAt).toLocaleString()
    return img;
}

export async function getPasteApi(uid: string): Promise<PasteDto | null> {
    console.log("Calling getPasteApi with uid: " + uid)

    const data = await getValidatedResponse('/v1/paste/get/' + uid);

    if (!data) return null;

    const pasteDto = data as PasteDto;

    pasteDto.uploader.createdAt = new Date(pasteDto.uploader.createdAt).toLocaleString()
    pasteDto.createdAt = new Date(pasteDto.createdAt).toLocaleString()

    return pasteDto;
}