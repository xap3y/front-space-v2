import { NextRequest, NextResponse } from 'next/server'
import {cookies} from "next/headers";
import {getApiKey, getApiUrl} from "@/lib/core";
import {DiscordConnection, DiscordTokenData} from "@/types/discord";
import {authorizeDiscordConnection, authorizeDiscordConnectionRaw} from "@/lib/apiPoster";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const cookieHeader = (await cookies()).toString();

    const authToken = cookieHeader.split('; ').find(row => row.startsWith('discord='));

    if (!authToken) {
        console.log("ADDING TYPE")
        const res = await fetch(getApiUrl() + "/v1/auth/me", {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
                "Content-Type": "application/json",
                Accept: "application/json",
                credentials: "include"
            },
        });

        const data = await res.json();
        if (data.error) {
            console.log(data);
            return NextResponse.json({ status: 500 })
        }

        const apiKey: string = data["message"]?.apiKey;

        console.log(apiKey);

        if (!apiKey) {
            return NextResponse.json({ error: 'No API key found' }, { status: 500 })
        }

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

            console.log(tokenData)

            const connectedDiscord = await authorizeDiscordConnection(tokenData, apiKey);

            if (!connectedDiscord) {
                return NextResponse.json({ error: 'Failed to connect Discord account' }, { status: 500 })
            }

            return new NextResponse(null, {
                status: 301,
                headers: {
                    Location: "/home/profile",
                    "X-Bypass-Middleware": "true"
                }
            });
        } catch (error) {
            console.error('Auth error:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
    } else {
        console.log("LOGIN TYPE")
        // Login using Discord
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
            console.error('Auth error:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
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