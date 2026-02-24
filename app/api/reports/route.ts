import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { saveReport, getAllReports, TeamReport } from "@/lib/reportService";

/**
 * GET /api/reports
 * Trả về danh sách vital reports từ D1, sắp xếp mới nhất đứng đầu.
 */
export async function GET() {
    try {
        const db = getD1();
        const reports = await getAllReports(db);
        return NextResponse.json({ reports });
    } catch (err) {
        console.error("[GET /api/reports]", err);
        return NextResponse.json(
            { error: "Failed to fetch reports" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/reports
 * Lưu một report mới vào D1.
 * Body: { bpm, bpv1, bpv0, S2, LTv, score, statusKey }
 */
export async function POST(req: NextRequest) {
    try {
        const db = getD1();
        const body = (await req.json()) as Omit<TeamReport, "id" | "createdAt">;

        if (!body.bpm || !body.statusKey) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const { id, shortId } = await saveReport(db, body);
        return NextResponse.json({ id, shortId }, { status: 201 });
    } catch (err) {
        console.error("[POST /api/reports]", err);
        return NextResponse.json(
            { error: "Failed to save report" },
            { status: 500 }
        );
    }
}
