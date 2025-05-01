import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_BOT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
        scope: 'identify',
    })

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

        const tokenData = await tokenRes.json()

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
            },
        })

        if (!userRes.ok) {
            const error = await userRes.text()
            return NextResponse.json({ error: 'Failed to fetch user', details: error }, { status: 500 })
        }

        const userData = await userRes.json()

        return NextResponse.json({ user: userData })
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
