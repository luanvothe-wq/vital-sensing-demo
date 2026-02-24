# FRD - Report Lookup (Tra cứu kết quả theo Short ID)

**Feature Name**: report-lookup  
**Version**: 1.0  
**Created**: 2026-02-24  
**Status**: Draft

---

## 1. Tổng quan

Cho phép người dùng tra cứu lại kết quả đo vital signs bằng **Short ID 4 chữ số** (dạng `VS-XXXX`).  
Sau khi đo xong, người dùng nhận được Short ID, và có thể dùng nó để xem lại kết quả bất cứ lúc nào thông qua một trang tìm kiếm riêng.

---

## 2. Phạm vi (Scope)

| Trong phạm vi | Ngoài phạm vi |
|---------------|---------------|
| Trang nhập Short ID để tra cứu | Chỉnh sửa hoặc xóa report |
| Trang hiển thị kết quả report | Tra cứu theo tên/email/thông tin khác |
| Thông báo khi không tìm thấy | Lịch sử tra cứu |
| Hỗ trợ song ngữ ja/en | Chia sẻ report qua link (ngoài URL trực tiếp) |
| URL trực tiếp `/report/XXXX` | Xác thực / quyền truy cập |

---

## 3. User Stories

### US-001: Tra cứu kết quả bằng Short ID
**Là** người dùng đã đo vital,  
**Tôi muốn** nhập Short ID 4 chữ số vào ổ tìm kiếm,  
**Để** xem lại kết quả đo của mình.

**Acceptance Criteria**:
- AC-001-1: Có trang `/report` với form nhập 4 chữ số
- AC-001-2: Input chỉ nhận đúng 4 chữ số (0-9), auto-format hoặc validate
- AC-001-3: Nhấn Search → gọi API, hiển thị kết quả  
- AC-001-4: Hiển thị đầy đủ: BPM, Systolic BP, Diastolic BP, S2, LTv, Overall status
- AC-001-5: Hỗ trợ song ngữ ja/en (theo localStorage setting)

### US-002: Truy cập trực tiếp qua URL
**Là** người dùng,  
**Tôi muốn** có thể mở URL `/report/1234` trực tiếp,  
**Để** xem ngay kết quả mà không cần nhập lại ID.

**Acceptance Criteria**:
- AC-002-1: Route `/report/[shortId]` load trực tiếp kết quả
- AC-002-2: Nếu shortId trong URL hợp lệ → redirect hoặc pre-fill form và hiển thị kết quả

### US-003: Xử lý khi không tìm thấy
**Là** người dùng,  
**Tôi muốn** nhận thông báo rõ ràng khi ID không tồn tại,  
**Để** biết cần kiểm tra lại ID.

**Acceptance Criteria**:
- AC-003-1: Hiển thị thông báo lỗi thân thiện: "IDが見つかりません" / "Report not found"
- AC-003-2: Cho phép nhập lại ID mới (không reload page)
- AC-003-3: Không hiển thị trang 404 hệ thống

### US-004: Navigation
**Là** người dùng,  
**Tôi muốn** có thể quay về trang chính từ trang tra cứu,  
**Để** đo lại hoặc xem team report.

**Acceptance Criteria**:
- AC-004-1: Có nút/link quay về trang chính (`/`)
- AC-004-2: Design đồng nhất với theme của trang chính (đọc localStorage)

---

## 4. UX Flow

```
[/report]
    │
    ▼
┌─────────────────────────┐
│  Search Form             │
│  ┌─────────────────┐    │
│  │  _ _ _ _        │    │
│  │  (4-digit input)│    │
│  └─────────────────┘    │
│  [Search Button]         │
└─────────────────────────┘
    │
    ├─── ID hợp lệ → Hiển thị Result Card (BPM, BP, status)
    │
    └─── ID không tồn tại → Thông báo "Not Found" + cho phép nhập lại
```

---

## 5. Non-Functional Requirements

- **Performance**: Kết quả trả về trong < 3 giây
- **Responsive**: Mobile-first, hoạt động tốt trên điện thoại tại booth triển lãm
- **Accessibility**: Form label rõ ràng, keyboard navigable
- **Consistency**: Dùng cùng theme palette (clinical-blue / clean-white) từ localStorage
- **Security**: Không expose thông tin nhạy cảm ngoài vital data đã lưu

---

## 6. Error Cases

| ERR-001 | Short ID không tồn tại trong D1 | Thông báo friendly, cho nhập lại |
| ERR-002 | Input không đủ 4 chữ số | Disable nút Search hoặc inline validation |
| ERR-003 | API lỗi server (500) | Thông báo lỗi chung, cho retry |
| ERR-004 | Mất kết nối mạng | Thông báo network error |
