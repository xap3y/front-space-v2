import UrlShortener from "@/app/a/url/client";
import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/crypto";
import LoginPage from "@/app/login/client";


export default async function Page() {
    return (
        <>
            <LoginPage />
        </>
    )
}