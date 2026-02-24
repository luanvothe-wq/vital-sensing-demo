/**
 * reportService.ts — D1 version (thay thế Firestore)
 * Tất cả hàm nhận db làm param để dễ test và tránh side effect module-level.
 */

export interface TeamReport {
  id: string;
  bpm: string;
  bpv1: string;
  bpv0: string;
  S2: string;
  LTv: string;
  score: number;
  statusKey: string;
  createdAt: { toDate: () => Date } | null;
}

type ReportRow = {
  id: string;
  bpm: string;
  bpv1: string;
  bpv0: string;
  S2: string;
  LTv: string;
  score: number;
  status_key: string;
  created_at: number;
};

/**
 * Lưu report mới vào D1.
 * @returns id của record vừa tạo
 */
export async function saveReport(
  db: D1Database,
  data: Omit<TeamReport, "id" | "createdAt">
): Promise<string> {
  await db
    .prepare(
      `INSERT INTO vital_reports (bpm, bpv1, bpv0, S2, LTv, score, status_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(data.bpm, data.bpv1, data.bpv0, data.S2, data.LTv, data.score, data.statusKey)
    .run();

  // Lấy id của record vừa insert (D1 không trả về ID trực tiếp)
  const row = await db
    .prepare("SELECT id FROM vital_reports ORDER BY rowid DESC LIMIT 1")
    .first<{ id: string }>();

  return row?.id ?? "unknown";
}

/**
 * Lấy tất cả reports, sắp xếp mới nhất đứng đầu.
 */
export async function getAllReports(db: D1Database): Promise<TeamReport[]> {
  const result = await db
    .prepare(
      `SELECT id, bpm, bpv1, bpv0, S2, LTv, score, status_key, created_at
       FROM vital_reports
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all<ReportRow>();

  return result.results.map((row) => ({
    id: row.id,
    bpm: row.bpm,
    bpv1: row.bpv1,
    bpv0: row.bpv0,
    S2: row.S2,
    LTv: row.LTv,
    score: row.score,
    statusKey: row.status_key,
    // Compat với interface cũ: wrap thành object có .toDate()
    createdAt: row.created_at
      ? { toDate: () => new Date(row.created_at * 1000) }
      : null,
  }));
}
