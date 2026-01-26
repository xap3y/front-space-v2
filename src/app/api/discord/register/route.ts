import { NextRequest, NextResponse } from 'next/server'
import {cookies} from "next/headers";
import {getApiUrl} from "@/lib/core";
import {DiscordTokenData} from "@/types/discord";
import {authorizeDiscordConnection} from "@/lib/apiPoster";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    const code = searchParams.get('code')

    if (!code) {
        return new NextResponse(null, {
            status: 301,
            headers: {
                Location: process.env.NEXT_PUBLIC_DISCORD_REGISTER_URL!
            }
        });
    }

    const cookieHeader = (await cookies()).toString();

    console.log("COOKIE HEADER: " + cookieHeader)

    const res = await fetch(getApiUrl() + "/v1/auth/me", {
        method: "GET",
        headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
            credentials: "include"
        },
    });

    if (!res.ok) {
        console.log("Error fetching user data: " + res.statusText);
        return NextResponse.json({ error: 'Failed to fetch user data: ' + res.status }, { status: res.status })
    }

    console.log("FETCHED USER DATA: " + res.statusText);

    console.log("RES IS: " + res)

    const data = await res.json();
    if (data.error) {
        console.log("Data presented: " + data);
        return NextResponse.json({ status: 500 })
    }

    const apiKey: string = data["message"]?.apiKey;

    console.log("API-KEY IS: " + apiKey);

    if (!apiKey) {
        return NextResponse.json({ error: 'No API key found' }, { status: 500 })
    }

    const params = getUrlSearchParams(code);

    console.log("TRYING TO CONNECT DISCORD ACCOUNT")
    try {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        })

        if (!tokenRes.ok) {
            console.log("TRYING TO CONNECT DISCORD ACCOUNT ERR: " + tokenRes.statusText)
            const error = await tokenRes.text()
            return NextResponse.json({ error: 'Failed to get token', details: error }, { status: 500 })
        }

        const tokenDataJson = await tokenRes.json()

        const tokenData = tokenDataJson as DiscordTokenData

        console.log(tokenData)

        const connectedDiscord = await authorizeDiscordConnection(tokenData, apiKey);

        if (!connectedDiscord) {
            return NextResponse.json({ error: 'Failed to connect Discord account' }, { status: 500 })
        }

        //setCookie('discord', connectedDiscord.discordId)

        return new NextResponse(null, {
            status: 301,
            headers: {
                Location: "/home/connections",
                "X-Bypass-Middleware": "true",
                "Set-Cookie": `discord=${connectedDiscord.discordId}; Path=/; HttpOnly; Secure; SameSite=Strict`
            }
        });
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function getUrlSearchParams(code: string) {
    return new URLSearchParams({
        client_id: process.env.DISCORD_BOT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REGISTER_URI!,
        scope: 'identify',
    })
}