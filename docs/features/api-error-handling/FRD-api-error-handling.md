# FRD: API Error Handling

**Feature**: api-error-handling
**Version**: 1.0.0
**Status**: Draft
**Created**: 2026-02-24

---

## 1. Tổng quan

Hiện tại khi external Vital Sensing API thất bại, hệ thống âm thầm thay thế bằng mock data và hiển thị kết quả giả cho người dùng. Behavior này không phù hợp với môi trường production vì người dùng không biết kết quả là không thật.

Feature này thay thế toàn bộ mock fallback khi API lỗi bằng cơ chế hiển thị thông báo lỗi chung chung cho người dùng, đồng thời log chi tiết kỹ thuật lên server để debug.

---

## 2. User Stories

### US-001: Hiển thị lỗi chung khi API thất bại

**Là** người dùng đang sử dụng chức năng đo vital,
**Khi** API phân tích thất bại vì bất kỳ lý do nào (quota, network, server error...),
**Thì** tôi thấy màn hình lỗi với thông báo thân thiện và nút "Thử lại từ đầu".

**Acceptance Criteria:**
- Màn hình lỗi hiển thị message không chứa thông tin kỹ thuật (stack trace, URL, token...)
- Message được dịch theo ngôn ngữ hiện tại (ja/en)
- Có nút reset để quay lại màn hình ban đầu
- KHÔNG hiển thị kết quả giả (mock data)

### US-002: Log chi tiết lỗi phía server

**Là** developer/operator,
**Khi** API external trả về lỗi,
**Thì** tôi thấy log chi tiết ở server (Next.js API route server-side console) bao gồm: status code, response body, error message.

**Acceptance Criteria:**
- `console.error()` ghi đầy đủ thông tin lỗi từ external API
- Log không bị lọc hay rút gọn
- Log xảy ra phía server (route handler), không phải browser console
- Thông tin log KHÔNG được trả về client trong response

---

## 3. Phạm vi (Scope)

### Trong scope
- Xóa toàn bộ logic mock fallback trong `sendToApi()` tại `app/page.tsx`
- Xóa toàn bộ hardcoded mock fallback trong `beginRecording()` catch block tại `app/page.tsx`
- Thêm `console.error()` chi tiết tại `app/api/vital-sensing/route.ts` khi external API lỗi
- Giữ nguyên message lỗi an toàn trả về cho client (không tiết lộ chi tiết)

### Ngoài scope
- Không thêm retry logic
- Không thêm environment flag
- Không thay đổi `lib/online-doctor.ts`
- Không thay đổi fallback của Firestore (vẫn dùng sessionReports)
- Không thay đổi fallback của MP4 conversion (vẫn fallback sang WebM)

---

## 4. Error Messages (UI facing)

| Ngôn ngữ | Message |
|----------|---------|
| Tiếng Nhật (ja) | `バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。` |
| Tiếng Anh (en) | `Vital sign analysis failed. Please wait a moment and try again.` |

---

## 5. Luồng xử lý mới

```
[Camera Recording Completed]
        ↓
[MP4 Conversion] → lỗi → [WebM fallback] (giữ nguyên)
        ↓
[sendToApi()] → gọi /api/vital-sensing
        ↓ thành công
[Hiển thị kết quả thực]
        ↓ thất bại (bất kỳ lỗi nào)
[setStep("error") + message chung]  ← THAY ĐỔI: xóa mock path
        ↓
[User nhấn "Retry"] → quay về start
```

---

## 6. Non-Functional Requirements

- Message lỗi phải xuất hiện trong vòng 500ms sau khi nhận phản hồi lỗi
- Không block UI thread khi xử lý lỗi
- Log server-side không ảnh hưởng đến response time của API route
