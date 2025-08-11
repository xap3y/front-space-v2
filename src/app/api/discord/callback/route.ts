import { NextRequest, NextResponse } from 'next/server'
import {cookies} from "next/headers";
import {getApiKey, getApiUrl} from "@/lib/core";
import {DiscordConnection, DiscordTokenData} from "@/types/discord";
import {authorizeDiscordConnection, authorizeDiscordConnectionRaw} from "@/lib/apiPoster";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    const code = searchParams.get('code')

    console.log(code)

    if (!code) {
        return new NextResponse(null, {
            status: 301,
            headers: {
                Location: process.env.NEXT_PUBLIC_DISCORD_LOGIN_URL!
            }
        });
    }

    const cookieHeader = (await cookies()).toString();

    console.log("COOKIE HEADER: " + cookieHeader)

    //const authToken = cookieHeader.split('; ').find(row => row.startsWith('discord='));

    console.log("LOGIN TYPE")
    const params = getUrlSearchParams(code);

    try {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        })

        if (!tokenRes.ok) {
            const error = await tokenRes.text()
            return NextResponse.json({ error: 'Failed to get token', details: error }, { status: 500 })
        }

        const tokenDataJson = await tokenRes.json()

        const tokenData = tokenDataJson as DiscordTokenData

        const response = await authorizeDiscordConnectionRaw(tokenData, getApiKey(), "/v1/discord/login");

        console.log(response)
        const data = await response.json();
        if (data.error) {
            return new NextResponse(null, {
                status: 301,
                headers: {
                    Location: "/login?errortoast=discord"
                }
            });
        }

        const setCookie = response.headers.get('set-cookie');

        const connectedDiscord = data["message"] as DiscordConnection;

        if (!connectedDiscord) {
            return NextResponse.json({ error: 'Failed to connect Discord account' }, { status: 500 })
        }

        const responseApi = new NextResponse(null, {
            status: 301,
            headers: {
                Location: "/home/profile"
            }
        });

        if (setCookie) {
            responseApi.headers.set('set-cookie', setCookie);
        }

        //await revokeUserDiscordConnectionToken(tokenDataJson["access_token"])

        return responseApi;
    } catch (error) {
        console.error("Error during Discord OAuth callback:", error);
        return NextResponse.json({ error: 'Failed to connect Discord account' }, { status: 500 })
    }
}

function getUrlSearchParams(code: string) {
    return new URLSearchParams({
        client_id: process.env.DISCORD_BOT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
        scope: 'identify',
    })
}