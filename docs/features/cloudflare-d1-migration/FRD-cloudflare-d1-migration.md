# FRD: Migration từ Firebase Firestore sang Cloudflare D1 + Alchemy Deploy

**Feature Name**: cloudflare-d1-migration  
**Version**: 1.0  
**Created**: 2026-02-24  
**Status**: Draft  
**Mode**: UPDATE (codebase hiện tại đang dùng Vercel + Firestore)

---

## 1. Tổng quan

Refactor hệ thống lưu trữ báo cáo vital sensing từ Firebase Firestore sang Cloudflare D1 (SQLite-based serverless database), đồng thời chuyển toàn bộ deployment từ Vercel sang Cloudflare Pages/Workers. Sử dụng [Alchemy](https://alchemy.run) làm Infrastructure-as-Code (IaC) tool để quản lý các Cloudflare resource một cách type-safe bằng TypeScript.

---

## 2. Mục tiêu

| Mục tiêu | Mô tả |
|----------|-------|
| Thay thế Firestore | Dùng Cloudflare D1 (SQLite) thay thế hoàn toàn Firebase Firestore |
| Deploy lên Cloudflare | Chuyển từ Vercel sang Cloudflare Pages (Next.js on edge) |
| IaC với Alchemy | Dùng `alchemy.run` để khai báo và quản lý D1, Pages resource |
| Xóa Firebase dependency | Loại bỏ toàn bộ Firebase SDK khỏi project |
| Giữ nguyên UX | Không thay đổi giao diện, flow camera, analyze result |

---

## 3. User Stories

### US-001: Lưu report vital vào D1
> **Là** hệ thống backend,  
> **Khi** user hoàn thành đo vital signs,  
> **Tôi muốn** lưu report vào Cloudflare D1  
> **Để** dữ liệu được persist và truy vấn sau.

**Acceptance Criteria**:
- AC-001-1: `saveReport()` ghi dữ liệu vào bảng `vital_reports` trong D1
- AC-001-2: Mỗi record có `id` tự sinh (UUID hoặc auto-increment), `created_at` timestamp
- AC-001-3: Môi trường `production` và `development` dùng cùng DB nhưng có thể cấu hình riêng
- AC-001-4: Nếu D1 không khả dụng, app trả về lỗi rõ ràng (không crash silent)

### US-002: Đọc danh sách report từ D1
> **Là** team report page,  
> **Khi** user mở xem báo cáo team,  
> **Tôi muốn** lấy danh sách reports từ D1  
> **Để** hiển thị kết quả đo lịch sử.

**Acceptance Criteria**:
- AC-002-1: `getAllReports()` trả về danh sách sắp xếp theo `created_at DESC`
- AC-002-2: Chỉ trả về các field cần thiết: `id, bpm, bpv1, bpv0, S2, LTv, score, statusKey, created_at`
- AC-002-3: Fallback session cache hoạt động khi D1 timeout

### US-003: Deploy lên Cloudflare Pages bằng Alchemy
> **Là** developer,  
> **Khi** tôi chạy `npx alchemy deploy`,  
> **Tôi muốn** tự động provision D1 database và deploy Next.js app lên Cloudflare Pages  
> **Để** không cần thao tác thủ công trên Cloudflare dashboard.

**Acceptance Criteria**:
- AC-003-1: File `alchemy.run.ts` định nghĩa D1Database và CloudflarePages resource
- AC-003-2: D1 binding tự động inject vào Next.js route handlers
- AC-003-3: Migration SQL chạy tự động khi deploy (`alchemy deploy`)
- AC-003-4: Environment variables cho external API được khai báo trong Alchemy config

### US-004: Database Migration
> **Là** hệ thống,  
> **Khi** deploy lần đầu,  
> **Tôi muốn** tự động tạo schema D1  
> **Để** bảng `vital_reports` sẵn sàng nhận dữ liệu.

**Acceptance Criteria**:
- AC-004-1: File migration SQL tại `migrations/0001_initial.sql`
- AC-004-2: Schema có đủ columns phù hợp với `TeamReport` interface hiện tại
- AC-004-3: Migration idempotent (chạy lại không lỗi)

---

## 4. Phạm vi thay đổi

### IN SCOPE
- `lib/firebase.ts` → **xóa**
- `lib/reportService.ts` → **viết lại** dùng D1 binding
- `app/api/vital-sensing/route.ts` → **cập nhật** context để nhận D1 binding từ Cloudflare
- `app/api/reports/route.ts` → **tạo mới** endpoint GET danh sách reports
- `alchemy.run.ts` → **tạo mới** IaC config
- `migrations/0001_initial.sql` → **tạo mới** schema D1
- `package.json` → thêm `alchemy`, `@cloudflare/next-on-pages`, xóa `firebase`
- `DEPLOY.md` → **cập nhật** hướng dẫn Cloudflare thay vì Vercel
- `.env.local` → **cập nhật** bỏ Firebase vars, thêm Cloudflare vars

### OUT OF SCOPE
- Không thay đổi UI/UX, flow camera, face detection
- Không thay đổi external vital API integration
- Không thêm authentication cho report endpoint (giữ như hiện tại)
- Không migrate data cũ từ Firestore sang D1

---

## 5. Constraints & Limitations

| Ràng buộc | Chi tiết |
|-----------|---------|
| Cloudflare Edge Runtime | Next.js route handlers cần dùng `export const runtime = "edge"` hoặc tương thích với `@cloudflare/next-on-pages` |
| D1 binding | D1 chỉ accessible trong server context (Route Handlers, Server Actions), không phải client |
| FFmpeg WASM | Cần giữ nguyên COOP/COEP headers; Cloudflare Pages hỗ trợ custom headers qua `_headers` file |
| File upload | Video blob `POST /api/vital-sensing` có thể giới hạn 100MB trên Cloudflare Workers (free tier 100MB) |
| Node.js vs Edge | `app/api/vital-sensing/route.ts` hiện dùng `runtime = "nodejs"` — cần kiểm tra compatibility với Cloudflare |

---

## 6. Non-Functional Requirements

- **Availability**: D1 có SLA từ Cloudflare, không cần managed infra
- **Latency**: D1 read ở edge < 10ms (SQLite local replica)
- **Cost**: D1 free tier 5GB storage, 25M reads/day — phù hợp demo
- **Security**: D1 binding chỉ server-side, không expose ra client
- **Observability**: Log lỗi D1 rõ ràng ở server console

---

## 7. Dependencies

| Dependency | Ghi chú |
|-----------|---------|
| Cloudflare account | Free tier đủ dùng |
| `alchemy` npm package | IaC tool, TypeScript-native |
| `@cloudflare/next-on-pages` | Adapter cho Next.js trên Cloudflare Pages |
| `wrangler` | CLI tool Cloudflare để test local D1 |
| `drizzle-orm` (optional) | ORM cho D1, có thể dùng raw SQL thay thế |

---

## 8. Acceptance Testing Summary

Xem chi tiết tại `TEST-cloudflare-d1-migration.md`

- Happy path: Lưu report sau analyze → lấy lại được
- Error path: D1 unavailable → fallback an toàn
- Deploy path: `alchemy deploy` tự động tạo DB và deploy app
