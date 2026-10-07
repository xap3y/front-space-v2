import {NextResponse} from "next/server";
import specification from "@/data/pcv-openapi.json";

export function GET() {
    return NextResponse.json(specification);
}
