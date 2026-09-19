import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const response = await fetch(`${getApiUrl()}/reports-openapi.json`, { cache: "no-store" });
        if (!response.ok) {
            return NextResponse.json(
                { error: true, message: "PlaycoreVIP API documentation is unavailable." },
                { status: response.status },
            );
        }
        return new NextResponse(await response.text(), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    } catch {
        return NextResponse.json(
            { error: true, message: "Could not reach the Space API documentation endpoint." },
            { status: 502 },
        );
    }
}
