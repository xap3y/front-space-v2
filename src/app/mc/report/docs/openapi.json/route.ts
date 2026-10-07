import {NextResponse} from "next/server";
import specification from "@/data/reports-openapi.json";

export function GET() {
    return NextResponse.json(specification);
}
