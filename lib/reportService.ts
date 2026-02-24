/**
 * reportService.ts — D1 version (thay thế Firestore)
 * Tất cả hàm nhận db làm param để dễ test và tránh side effect module-level.
 */

export interface TeamReport {
  id: string;
  shortId?: string;
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
  short_id: string | null;
  bpm: string;
  bpv1: string;
  bpv0: string;
  S2: string;
  LTv: string;
  score: number;
  status_key: string;
  created_at: number;
};

// Short ID: 4 chữ số (0-9), dễ nhớ và đọc tại triển lãm. Ví dụ: "4821", "0037"
const SHORT_ID_LENGTH = 4;

/**
 * Sinh 4 chữ số ngẫu nhiên (0-9).
 * Ví dụ: "4821", "0037"
 */
function generateShortCode(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(SHORT_ID_LENGTH, "0");
}

/**
 * Sinh short_id unique, kiểm tra D1 tối đa maxAttempts lần.
 */
async function generateUniqueShortId(db: D1Database, maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateShortCode();
    const existing = await db
      .prepare("SELECT 1 FROM vital_reports WHERE short_id = ? LIMIT 1")
      .bind(code)
      .first();
    if (!existing) return code;
  }
  // Fallback cực kỳ hiếm: dùng timestamp mod 10000 để đảm bảo unique
  return String(Date.now() % 10000).padStart(SHORT_ID_LENGTH, "0");
}

/**
 * Lưu report mới vào D1.
 * @returns { id, shortId } của record vừa tạo
 */
export async function saveReport(
  db: D1Database,
  data: Omit<TeamReport, "id" | "createdAt" | "shortId">
): Promise<{ id: string; shortId: string }> {
  const shortId = await generateUniqueShortId(db);

  await db
    .prepare(
      `INSERT INTO vital_reports (bpm, bpv1, bpv0, S2, LTv, score, status_key, short_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(data.bpm, data.bpv1, data.bpv0, data.S2, data.LTv, data.score, data.statusKey, shortId)
    .run();

  // Lấy id của record vừa insert (D1 không trả về ID trực tiếp)
  const row = await db
    .prepare("SELECT id FROM vital_reports ORDER BY rowid DESC LIMIT 1")
    .first<{ id: string }>();

  return { id: row?.id ?? "unknown", shortId };
}

/**
 * Lấy tất cả reports, sắp xếp mới nhất đứng đầu.
 */
export async function getAllReports(db: D1Database): Promise<TeamReport[]> {
  const result = await db
    .prepare(
      `SELECT id, short_id, bpm, bpv1, bpv0, S2, LTv, score, status_key, created_at
       FROM vital_reports
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all<ReportRow>();

  return result.results.map((row) => ({
    id: row.id,
    shortId: row.short_id ?? undefined,
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
