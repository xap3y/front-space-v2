import { NextRequest, NextResponse } from 'next/server'
import {cookies} from "next/headers";
import {getApiUrl} from "@/lib/core";

export async function GET(req: NextRequest) {

    const cookieHeader = cookies().toString();

    console.log("cookieHeader", cookieHeader)

    const res = await fetch(getApiUrl() + "/v1/auth/me", {
        method: "GET",
        headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
            credentials: "include"
        },
    });

    console.log("res", res)

    const data = await res.json();

    console.log("data", data)

    if (data.error) {
        console.log("DATA ERROR");
        return NextResponse.json({ status: 500 })
    }

    const apiKey = data["message"]?.apiKey;

    return NextResponse.json({ status: 200 })
}
