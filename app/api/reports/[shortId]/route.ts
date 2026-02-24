import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { getReportByShortId } from "@/lib/reportService";

/**
 * GET /api/reports/[shortId]
 * Tra cứu 1 report theo short_id 4 chữ số.
 * - 200: { report: TeamReport }
 * - 400: invalid_id (không đúng format 4 chữ số)
 * - 404: not_found
 * - 500: server error
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ shortId: string }> }
) {
    const { shortId } = await params;

    // Validate: phải đúng 4 chữ số
    if (!/^\d{4}$/.test(shortId)) {
        return NextResponse.json(
            { error: "invalid_id", message: "Short ID must be exactly 4 digits (0-9)" },
            { status: 400 }
        );
    }

    try {
        const db = getD1();
        const report = await getReportByShortId(db, shortId);

        if (!report) {
            return NextResponse.json(
                { error: "not_found", message: "Report not found" },
                { status: 404 }
            );
        }

        // Serialize createdAt thành ISO string (hàm toDate() không serialize được qua JSON)
        const serialized = {
            ...report,
            createdAt: report.createdAt?.toDate().toISOString() ?? null,
        };
        return NextResponse.json({ report: serialized });
    } catch (err) {
        console.error(`[GET /api/reports/${shortId}]`, err);
        return NextResponse.json(
            { error: "server_error", message: "Failed to fetch report" },
            { status: 500 }
        );
    }
}
