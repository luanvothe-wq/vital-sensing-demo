# TDD - Report Lookup (Tra cứu kết quả theo Short ID)

**Feature Name**: report-lookup  
**Version**: 1.0  
**Created**: 2026-02-24  
**FRD Reference**: FRD-report-lookup.md

---

## 1. Kiến trúc tổng quan

```
Browser
  │
  ├── /report           → app/report/page.tsx         (Search form page)
  └── /report/[shortId] → app/report/[shortId]/page.tsx (Direct URL → redirect to /report?id=XXXX)
                                │
                                ▼
                    GET /api/reports/[shortId]
                                │
                                ▼
                    lib/reportService.ts :: getReportByShortId()
                                │
                                ▼
                    Cloudflare D1 :: vital_reports WHERE short_id = ?
```

---

## 2. Component Design

### 2.1 Search Page: `app/report/page.tsx`

**Type**: Client Component (`"use client"`)

**State**:
```ts
type LookupStep = "search" | "loading" | "found" | "not-found" | "error";

const [step, setStep] = useState<LookupStep>("search");
const [inputId, setInputId] = useState(""); // raw 4-digit input
const [report, setReport] = useState<TeamReport | null>(null);
const [errorMsg, setErrorMsg] = useState("");
const [language, setLanguage] = useState<Language>("ja");
const [themePalette, setThemePalette] = useState<ThemePalette>("clinical-blue");
```

**Lifecycle**:
1. Mount: đọc `localStorage.getItem("themePalette")` và `localStorage.getItem("language")`
2. User nhập 4 chữ số → enable nút Search
3. Submit → `setStep("loading")` → gọi `GET /api/reports/[inputId]`
4. Response 200 → `setStep("found")`, render result cards
5. Response 404 → `setStep("not-found")`, hiển thị thông báo
6. Response 500 / network error → `setStep("error")`, thông báo chung

**Validation**:
- Input chỉ nhận `[0-9]`, max 4 ký tự
- Nút Search disabled khi `inputId.length !== 4`

**URL params**: Nếu có `?id=XXXX` trong query string → auto-fill input và trigger search

### 2.2 Dynamic Route: `app/report/[shortId]/page.tsx`

**Type**: Client Component  
**Purpose**: Redirect về `/report?id=[shortId]` — giúp URL `/report/1234` hoạt động

```ts
// Dùng useRouter + useEffect để redirect
"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DirectLookupPage() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    router.replace(`/report?id=${params.shortId}`);
  }, [params.shortId]);
  return null; // hoặc loading spinner nhỏ
}
```

---

## 3. API Design

### `GET /api/reports/[shortId]`

**File**: `app/api/reports/[shortId]/route.ts`

**Request**: `GET /api/reports/1234`

**Response Success (200)**:
```json
{
  "report": {
    "id": "...",
    "shortId": "1234",
    "bpm": "75",
    "bpv1": "120",
    "bpv0": "75",
    "S2": "[97]",
    "LTv": "1.45",
    "score": 6,
    "statusKey": "excellent",
    "createdAt": { ... }
  }
}
```

**Response Not Found (404)**:
```json
{ "error": "not_found", "message": "Report not found" }
```

**Response Bad Request (400)**:
```json
{ "error": "invalid_id", "message": "Short ID must be 4 digits" }
```

**Validation**:
- `shortId` phải match `/^\d{4}$/` — nếu không → 400
- Không tìm thấy trong D1 → 404

---

## 4. Service Layer

### `lib/reportService.ts` — thêm function mới

```ts
/**
 * Lấy 1 report theo short_id 4 chữ số.
 * @returns TeamReport hoặc null nếu không tìm thấy
 */
export async function getReportByShortId(
  db: D1Database,
  shortId: string
): Promise<TeamReport | null> {
  const row = await db
    .prepare(
      `SELECT id, short_id, bpm, bpv1, bpv0, S2, LTv, score, status_key, created_at
       FROM vital_reports WHERE short_id = ? LIMIT 1`
    )
    .bind(shortId)
    .first<ReportRow>();

  if (!row) return null;

  return {
    id: row.id,
    shortId: row.short_id ?? undefined,
    bpm: row.bpm,
    bpv1: row.bpv1,
    bpv0: row.bpv0,
    S2: row.S2,
    LTv: row.LTv,
    score: row.score,
    statusKey: row.status_key,
    createdAt: row.created_at
      ? { toDate: () => new Date(row.created_at * 1000) }
      : null,
  };
}
```

---

## 5. i18n Translations

Bổ sung vào object translations trong `app/report/page.tsx` (không sửa `app/page.tsx`):

```ts
const lookupTranslations = {
  ja: {
    pageTitle: "レポート照会",
    pageSubtitle: "Report Lookup",
    inputLabel: "レポートID（4桁）を入力",
    inputPlaceholder: "0000",
    searchButton: "検索",
    searching: "検索中...",
    notFoundTitle: "レポートが見つかりません",
    notFoundMsg: "入力されたIDに対応するレポートが見つかりませんでした。IDをご確認の上、再度お試しください。",
    errorTitle: "エラーが発生しました",
    errorMsg: "レポートの取得に失敗しました。しばらく時間をおいて再度お試しください。",
    backToMain: "← トップに戻る",
    tryAgain: "再検索",
    foundTitle: "測定結果",
    measuredAt: "測定日時",
    reportIdLabel: "レポートID",
    disclaimer: "⚠ この結果は医療診断ではなく、参考値として提供しています。",
  },
  en: {
    pageTitle: "Report Lookup",
    pageSubtitle: "レポート照会",
    inputLabel: "Enter your 4-digit Report ID",
    inputPlaceholder: "0000",
    searchButton: "Search",
    searching: "Searching...",
    notFoundTitle: "Report Not Found",
    notFoundMsg: "No report was found for the entered ID. Please check the ID and try again.",
    errorTitle: "An Error Occurred",
    errorMsg: "Failed to retrieve the report. Please wait a moment and try again.",
    backToMain: "← Back to Main",
    tryAgain: "Search Again",
    foundTitle: "Measurement Results",
    measuredAt: "Measured At",
    reportIdLabel: "Report ID",
    disclaimer: "⚠ These results are for reference only and not medical diagnosis.",
  },
};
```

---

## 6. Implementation Files

| File | Action | Mô tả |
|------|--------|-------|
| `lib/reportService.ts` | MODIFY | Thêm `getReportByShortId()` |
| `app/api/reports/[shortId]/route.ts` | CREATE | API GET theo shortId |
| `app/report/page.tsx` | CREATE | Search form + result display |
| `app/report/[shortId]/page.tsx` | CREATE | Redirect về `/report?id=XXXX` |

---

## 7. Error Handling

| Tình huống | Hành vi |
|-----------|---------|
| shortId không đúng 4 chữ số | Disable nút search + inline hint |
| shortId không tìm thấy (404) | `setStep("not-found")` + thông báo thân thiện |
| Server error (500) | `setStep("error")` + retry button |
| Network timeout | `setStep("error")` + retry button |
| URL `/report/abc` (non-digit) | Redirect về `/report`, hiển thị search trống |

---

## 8. Style Guidelines

- Kế thừa `getThemeColors(themePalette, isDark ? "dark" : "light")` từ `theme-palettes.ts`
- Đọc `themePalette` và `language` từ `localStorage` khi mount
- Design tương tự result screen trong `app/page.tsx`:
  - Vital cards layout
  - Overall evaluation card (emoji + label + comment)
  - Noto Sans JP font
  - Gradient background
- Search form: Input lớn, centered, số to dễ nhập tại booth
- Không cần header phức tạp — chỉ cần logo text + back link
