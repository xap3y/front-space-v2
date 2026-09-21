import {NextRequest} from "next/server";

const R2_ORIGIN = "https://r2.xap3y.eu";

export async function GET(request: NextRequest) {
    const link = request.nextUrl.searchParams.get("link");

    if (!link) {
        return Response.json({error: "A PDF link is required."}, {status: 400});
    }

    let pdfUrl: URL;
    try {
        pdfUrl = new URL(link);
    } catch {
        return Response.json({error: "The PDF link is invalid."}, {status: 400});
    }

    if (pdfUrl.origin !== R2_ORIGIN || !pdfUrl.pathname.startsWith("/muni/")) {
        return Response.json({error: "Only MUNI PDFs stored in R2 can be downloaded."}, {status: 403});
    }

    const response = await fetch(pdfUrl, {cache: "no-store"});
    if (!response.ok || !response.body) {
        return Response.json({error: "The PDF is unavailable."}, {status: response.status || 502});
    }

    const fileName = decodeURIComponent(pdfUrl.pathname.split("/").pop() ?? "download.pdf");
    return new Response(response.body, {
        headers: {
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
            "Content-Type": response.headers.get("content-type") ?? "application/pdf",
        },
    });
}
