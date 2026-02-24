# TEST: Migration Cloudflare D1 + Alchemy Deploy

**Feature Name**: cloudflare-d1-migration  
**Version**: 1.0  
**Created**: 2026-02-24  
**References**: FRD-cloudflare-d1-migration.md, TDD-cloudflare-d1-migration.md

---

## Happy Path Scenarios

### TC-001: Lưu report vital vào D1 thành công (US-001 → AC-001-1)

```gherkin
Given user hoàn thành đo vital signs và nhận kết quả từ /api/vital-sensing
When page.tsx gọi POST /api/reports với { bpm, bpv1, bpv0, S2, LTv, score, statusKey }
Then response status là 201
And body chứa { id: "<uuid-string>" }
And D1 table vital_reports có 1 record mới với đúng data
```

### TC-002: Đọc danh sách report thành công (US-002 → AC-002-1)

```gherkin
Given D1 đã có 3 records trong vital_reports
When client gọi GET /api/reports
Then response status là 200
And body.reports là array 3 items
And items được sort theo createdAt DESC (mới nhất đứng đầu)
And mỗi item có đủ fields: id, bpm, bpv1, bpv0, S2, LTv, score, statusKey, createdAt
```

### TC-003: createdAt trả về đúng format (AC-002-1)

```gherkin
Given 1 record được insert vào D1 lúc timestamp T
When GET /api/reports được gọi
Then item.createdAt là ISO 8601 string tương ứng với timestamp T (±1s)
```

### TC-004: Deploy với Alchemy tạo DB + app thành công (US-003 → AC-003-1)

```gherkin
Given môi trường có CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN
And alchemy.run.ts khai báo D1Database và CloudflarePages
When chạy `npx alchemy deploy`
Then D1 database "vital-reports-db" được tạo trên Cloudflare dashboard
And Cloudflare Pages project "vital-sensing-demo" được tạo/cập nhật
And binding DB được map đúng với D1 database
And app accessible tại URL trả về từ alchemy
```

### TC-005: Migration chạy tự động khi deploy (US-004 → AC-004-1)

```gherkin
Given file migrations/0001_initial.sql tồn tại với CREATE TABLE vital_reports
When `npx alchemy deploy` hoàn thành
Then bảng vital_reports tồn tại trong D1 với đúng schema
And POST /api/reports hoạt động được ngay sau deploy
```

### TC-006: App load bình thường trên Cloudflare Pages (End-to-end)

```gherkin
Given app đã deploy lên Cloudflare Pages
When user truy cập URL của app từ browser
Then trang chủ load thành công
And camera permission prompt xuất hiện bình thường
And FFmpeg WASM load được (COOP/COEP headers đúng từ _headers file)
And face detection model load từ /models/ thành công
```

---

## Error Case Scenarios

### TC-E001: D1 binding không available (ERR-D1-UNAVAILABLE)

```gherkin
Given route handler không có D1 binding (mis-config)
When GET /api/reports được gọi
Then response status là 500
And body chứa { error: "Failed to fetch reports" }
And server log ghi lỗi rõ ràng "D1 binding 'DB' not available"
And app client hiển thị fallback (session cache hoặc empty state), không crash
```

### TC-E002: Insert thất bại do D1 error (ERR-DB-WRITE)

```gherkin
Given D1 trả về lỗi khi INSERT (network/quota)
When POST /api/reports được gọi
Then response status là 500
And body chứa { error: "Failed to save report" }
And kết quả analyze vẫn hiển thị đúng trên UI (save failure không block result display)
```

### TC-E003: Alchemy deploy thiếu credentials (ERR-ALCHEMY-AUTH)

```gherkin
Given CLOUDFLARE_API_TOKEN không được set
When chạy `npx alchemy deploy`
Then command thất bại với error message rõ ràng về missing credentials
And không có resource nào bị tạo dở hoặc corrupt
```

---

## Edge Cases

### TC-EC001: Migration chạy lại (idempotent) (AC-004-3)

```gherkin
Given vital_reports table đã tồn tại
When `npx alchemy deploy` chạy lại lần 2
Then không có lỗi "table already exists"
And data cũ trong vital_reports không bị xóa
```

### TC-EC002: Report list trả về empty khi DB rỗng (AC-002-1)

```gherkin
Given D1 table vital_reports chưa có record nào
When GET /api/reports được gọi
Then response status là 200
And body là { reports: [] }
```

### TC-EC003: statusKey mapping đúng giữa camelCase ↔ snake_case (AC-001-2)

```gherkin
Given POST /api/reports body { statusKey: "good" }
When record được INSERT vào D1
Then D1 column status_key = "good"
And GET /api/reports trả về item.statusKey = "good" (không phải status_key)
```

---

## Manual Test Checklist (Cloudflare Deploy)

### Pre-deploy
- [ ] `npm run build` pass không lỗi
- [ ] `npx @cloudflare/next-on-pages` build thành công
- [ ] `wrangler pages dev .vercel/output/static --d1 DB=vital-reports-db` chạy local được

### Deploy lần đầu
- [ ] `npx alchemy deploy` tạo D1 DB thành công
- [ ] D1 có table `vital_reports` đúng schema
- [ ] Cloudflare Pages project xuất hiện trong dashboard
- [ ] URL app load được, không HTTPS error

### Functional test trên Cloudflare
- [ ] Camera permission hoạt động
- [ ] FFmpeg WASM load (check console không có COOP/COEP error)
- [ ] Record 6s → analyze → kết quả hiển thị
- [ ] Report được lưu vào D1 (kiểm tra Cloudflare dashboard)
- [ ] GET /api/reports trả về report vừa lưu
- [ ] Team report page hiển thị đúng danh sách

### Environment variables
- [ ] API_BASE_URL đúng
- [ ] LOGIN_EMAIL / LOGIN_PASSWORD đúng (test với call analyze thực)
- [ ] Không có Firebase env vars nào còn trong config
