# TDD: Migration từ Firebase Firestore sang Cloudflare D1 + Alchemy (Nextjs resource)

**Feature Name**: cloudflare-d1-migration  
**Version**: 1.3  
**Created**: 2026-02-24  
**Updated**: 2026-02-24 (dùng `Nextjs` resource từ alchemy/cloudflare — chính thức)  
**Status**: Draft  
**References**:
- FRD-cloudflare-d1-migration.md
- https://alchemy.run/guides/cloudflare-nextjs
- https://alchemy.run/providers/cloudflare/worker/

---

## 1. Tổng quan kỹ thuật

Alchemy có **`Nextjs` resource** chuyên biệt cho Next.js deployment. Đây là cách đúng nhất và đơn giản nhất:

```
┌────────────────────────────────────────────────────────────────┐
│  MẢNG 1: Infrastructure — alchemy.run.ts (DUY NHẤT)          │
│  D1Database + Nextjs (resource đặc biệt cho Next.js)          │
├────────────────────────────────────────────────────────────────┤
│  MẢNG 2: Database Layer — trong Next.js App Router            │
│  lib/reportService.ts → D1 raw SQL                            │
│  lib/d1.ts → getCloudflareContext() helper                    │
├────────────────────────────────────────────────────────────────┤
│  MẢNG 3: API Routes — giữ nguyên Next.js App Router           │
│  app/api/vital-sensing/route.ts → giữ proxy logic             │
│  app/api/reports/route.ts → GET/POST với D1                   │
│                                                                │
│  MẢNG 4: Config                                               │
│  next.config.ts → thêm initOpenNextCloudflareForDev()         │
│  open-next.config.ts → tạo mới                               │
│  types/env.d.ts → type-safe bindings                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc đề xuất

### 2.1 `Nextjs` resource — Full-stack Next.js trên Cloudflare Workers

```
alchemy.run.ts
    ├── D1Database("vital-reports-db")
    │       └── migrationsDir: "./migrations"
    └── Nextjs("website")               ← resource chuyên Next.js
            ├── adopt: true
            └── bindings:
                    ├── DB → D1Database
                    ├── API_BASE_URL → string env
                    ├── LOGIN_EMAIL → secret
                    ├── LOGIN_PASSWORD → secret
                    ├── BASIC_AUTH_ID → secret
                    └── BASIC_AUTH_PW → secret
```

### 2.2 D1 access trong Next.js API Routes

```typescript
// app/api/reports/route.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = async () => {
  const { env } = getCloudflareContext();
  const db = env.DB; // D1Database — type-safe từ types/env.d.ts
  // ...
};
```

### 2.3 Toàn bộ flow

```
Browser
  └── Next.js App (Cloudflare Worker via Nextjs resource)
          ├── /                       → UI (page.tsx — Client Component)
          ├── /api/vital-sensing POST → proxy → External API
          └── /api/reports GET/POST   → D1 ("vital-reports-db")
```

---

## 3. Quyết định kỹ thuật

| Quyết định | Lựa chọn | Lý do |
|-----------|---------|-------|
| Alchemy resource cho Next.js | **`Nextjs`** từ `alchemy/cloudflare` | Resource chính thức — tự handle build + deploy Next.js on Workers |
| D1 context accessor | **`getCloudflareContext()`** từ `@opennextjs/cloudflare` | Pattern chính thức trong API Routes Alchemy Next.js |
| ORM | **Raw SQL** | Đơn giản, ít dep, query nhỏ |
| Migration | **Alchemy `migrationsDir`** | Tự apply khi deploy |
| env vars | **`alchemy.secret.env.*`** | Plain string vs secret trong Alchemy |
| `open-next.config.ts` | **Tạo mới** | Required bởi `@opennextjs/cloudflare` |
| `types/env.d.ts` | **Tạo mới** | Type-safe bindings từ alchemy.run.ts |
| Deploy script | **`npm run deploy`** | Gọi `alchemy run alchemy.run.ts` |

---

## 4. Schema D1

```sql
-- migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS vital_reports (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  bpm         TEXT    NOT NULL,
  bpv1        TEXT    NOT NULL,
  bpv0        TEXT    NOT NULL,
  S2          TEXT    NOT NULL,
  LTv         TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  status_key  TEXT    NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_vital_reports_created_at
  ON vital_reports(created_at DESC);
```

---

## 5. Implementation Files

### Nhóm 1: Infrastructure + Config

| File | Action | Mô tả |
|------|--------|-------|
| `alchemy.run.ts` | CREATE | Khai báo D1Database + Nextjs resource |
| `migrations/0001_initial.sql` | CREATE | Schema D1 |
| `open-next.config.ts` | CREATE | Config OpenNext adapter cho Cloudflare |
| `types/env.d.ts` | CREATE | Type-safe bindings (D1, secrets) |
| `tsconfig.json` | UPDATE | Include `alchemy.run.ts` + `@cloudflare/workers-types` |
| `.env` | UPDATE | Thêm `ALCHEMY_PASSWORD` |

### Nhóm 2: Database Layer

| File | Action | Mô tả |
|------|--------|-------|
| `lib/d1.ts` | CREATE | Helper `getD1()` dùng `getCloudflareContext` |
| `lib/reportService.ts` | REWRITE | Thay Firestore → D1 raw SQL; nhận `db` param |
| `lib/firebase.ts` | DELETE | |

### Nhóm 3: API Routes

| File | Action | Mô tả |
|------|--------|-------|
| `app/api/reports/route.ts` | CREATE | GET + POST /api/reports dùng D1 |
| `app/api/vital-sensing/route.ts` | CHECK | Giữ nguyên; kiểm tra env var access |

### Nhóm 4: Frontend + Config

| File | Action | Mô tả |
|------|--------|-------|
| `next.config.ts` | UPDATE | Thêm `initOpenNextCloudflareForDev()` + giữ headers |
| `app/page.tsx` | UPDATE | Thay gọi reportService trực tiếp → `fetch("/api/reports")` |
| `package.json` | UPDATE | Thêm `alchemy`, `@opennextjs/cloudflare`, `@cloudflare/workers-types`; xóa `firebase`, `vercel` |
| `.gitignore` | UPDATE | Thêm `.open-next` |
| `DEPLOY.md` | REWRITE | Hướng dẫn Cloudflare + Alchemy |

---

## 6. Chi tiết implementation

### 6.1 `alchemy.run.ts`

```typescript
import alchemy from "alchemy";
import { D1Database, Nextjs } from "alchemy/cloudflare";

const app = await alchemy("vital-sensing-demo");

// D1 Database
const db = await D1Database("vital-reports-db", {
  migrationsDir: "./migrations",
});

// Next.js deployment trên Cloudflare Workers
export const website = await Nextjs("website", {
  adopt: true,          // adopt nếu worker đã tồn tại
  bindings: {
    DB: db,

    // External Vital API credentials
    API_BASE_URL: alchemy.env.API_BASE_URL!,
    LOGIN_EMAIL: alchemy.secret.env.LOGIN_EMAIL!,
    LOGIN_PASSWORD: alchemy.secret.env.LOGIN_PASSWORD!,
    BASIC_AUTH_ID: alchemy.secret.env.BASIC_AUTH_ID!,
    BASIC_AUTH_PW: alchemy.secret.env.BASIC_AUTH_PW!,
  },
});

console.log({ url: website.url });

await app.finalize();
```

### 6.2 `types/env.d.ts` — type-safe bindings

```typescript
// Auto-generated Cloudflare binding types.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

import type { website } from "../alchemy.run.ts";

export type CloudflareEnv = typeof website.Env;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
```

### 6.3 `open-next.config.ts`

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

### 6.4 `next.config.ts`

```typescript
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/models/:path*",
        headers: [{ key: "Cross-Origin-Resource-Policy", value: "cross-origin" }],
      },
      {
        source: "/ffmpeg/:path*",
        headers: [{ key: "Cross-Origin-Resource-Policy", value: "cross-origin" }],
      },
    ];
  },
};

export default nextConfig;

// Local dev: init Cloudflare D1 bindings mock
initOpenNextCloudflareForDev();
```

### 6.5 `lib/d1.ts`

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getD1(): D1Database {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error("D1 binding 'DB' not configured");
  }
  return env.DB;
}
```

### 6.6 `lib/reportService.ts` (rewritten)

```typescript
export interface TeamReport {
  id: string;
  bpm: string;
  bpv1: string;
  bpv0: string;
  S2: string;
  LTv: string;
  score: number;
  statusKey: string;
  createdAt: Date | null;
}

type ReportRow = {
  id: string; bpm: string; bpv1: string; bpv0: string;
  S2: string; LTv: string; score: number;
  status_key: string; created_at: number;
};

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

  const row = await db
    .prepare("SELECT id FROM vital_reports ORDER BY rowid DESC LIMIT 1")
    .first<{ id: string }>();
  return row?.id ?? "unknown";
}

export async function getAllReports(db: D1Database): Promise<TeamReport[]> {
  const result = await db
    .prepare(
      `SELECT id, bpm, bpv1, bpv0, S2, LTv, score, status_key, created_at
       FROM vital_reports ORDER BY created_at DESC LIMIT 100`
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
    createdAt: row.created_at ? new Date(row.created_at * 1000) : null,
  }));
}
```

### 6.7 `app/api/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { saveReport, getAllReports } from "@/lib/reportService";

export async function GET() {
  try {
    const db = getD1();
    const reports = await getAllReports(db);
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getD1();
    const body = await req.json();
    const id = await saveReport(db, body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
```

### 6.8 `package.json` — scripts và deps

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "deploy": "npx alchemy run alchemy.run.ts",
  "lint": "eslint"
},
"dependencies": {
  "@ffmpeg/ffmpeg": "^0.12.10",
  "@ffmpeg/util":"^0.12.1",
  "face-api.js": "^0.22.2",
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3"
},
"devDependencies": {
  "@cloudflare/workers-types": "latest",
  "@opennextjs/cloudflare": "latest",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "alchemy": "latest",
  "eslint": "^9",
  "eslint-config-next": "16.1.6",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

> **Xóa**: `firebase` (dep), `vercel` (devDep)

### 6.9 `tsconfig.json` — bổ sung

```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    // ... existing options ...
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "alchemy.run.ts",       // ← thêm
    "types/env.d.ts"        // ← thêm
  ]
}
```

---

## 7. Luồng dữ liệu

### Analyze → Save report:
```
page.tsx → fetch POST /api/vital-sensing → route.ts → external API → kết quả
page.tsx → fetch POST /api/reports       → route.ts → getD1() → D1 INSERT
```

### Team report fetch:
```
page.tsx → fetch GET /api/reports → route.ts → getD1() → D1 SELECT
```

---

## 8. Build & Deploy Flow

```bash
# Local dev (Next.js với D1 mock local)
npm run dev
# → next dev (initOpenNextCloudflareForDev() cung cấp D1 binding mock)

# Deploy lên Cloudflare
npm run deploy
# = npx alchemy run alchemy.run.ts
# Alchemy sẽ:
#   1. Build Next.js (tự động qua Nextjs resource)
#   2. Run opennextjs-cloudflare build
#   3. Tạo/update D1 "vital-reports-db"
#   4. Apply migrations/0001_initial.sql
#   5. Deploy Worker lên Cloudflare với tất cả bindings
```

---

## 9. Dependency changes

```diff
# dependencies
- "firebase": "^12.9.0"

# devDependencies
- "vercel": "^50.17.1"
+ "alchemy": "latest"
+ "@opennextjs/cloudflare": "latest"
+ "@cloudflare/workers-types": "latest"
```

---

## 10. Environment Variables

| Variable | Khai báo | Ghi chú |
|----------|---------|---------|
| `ALCHEMY_PASSWORD` | `.env` | Bắt buộc — encrypt secrets trong Alchemy state |
| `API_BASE_URL` | `.env.local` → `alchemy.env` | Plain text |
| `LOGIN_EMAIL` | `.env.local` → `alchemy.secret.env` | Secret |
| `LOGIN_PASSWORD` | `.env.local` → `alchemy.secret.env` | Secret |
| `BASIC_AUTH_ID` | `.env.local` → `alchemy.secret.env` | Secret |
| `BASIC_AUTH_PW` | `.env.local` → `alchemy.secret.env` | Secret |
| ~~`NEXT_PUBLIC_FIREBASE_*`~~ | **XÓA** | |

---

## 11. Implementation Checklist

**Song song:**
- 🔲 T-009: `alchemy.run.ts` + `migrations/0001_initial.sql` + `open-next.config.ts` + `types/env.d.ts`
- 🔲 T-010: `package.json` update; `.env` (ALCHEMY_PASSWORD); `tsconfig.json` update; `.gitignore`

**Sau T-009, T-010:**
- 🔲 T-011: `lib/d1.ts` + `lib/reportService.ts` rewrite + xóa `lib/firebase.ts`

**Sau T-011:**
- 🔲 T-012: `app/api/reports/route.ts` (GET + POST)

**Sau T-012:**
- 🔲 T-013: `app/page.tsx` update (reportService → fetch /api/reports); `next.config.ts` update

**Song song sau T-009:**
- 🔲 T-014: `DEPLOY.md` rewrite
