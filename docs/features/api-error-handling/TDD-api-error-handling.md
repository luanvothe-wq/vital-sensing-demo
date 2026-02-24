# TDD: API Error Handling

**Feature**: api-error-handling
**Version**: 1.0.0
**Status**: Draft
**Created**: 2026-02-24

---

## 1. Kiến trúc tổng quan

Thay đổi tập trung ở 2 lớp:

```
[Browser - page.tsx]          [Server - route.ts]
sendToApi()                   POST /api/vital-sensing
     ↓ lỗi                         ↓ external API lỗi
setStep("error")              console.error(chi tiết)
message chung cho user        trả về message an toàn
```

**Nguyên tắc thiết kế:**
- **Separation of concerns**: UI layer chỉ biết "có lỗi", Server layer log chi tiết
- **Information hiding**: Chi tiết lỗi kỹ thuật chỉ nằm ở server log, không rò rỉ ra client
- **Minimal change**: Chỉ sửa đúng 2 file, không refactor rộng

---

## 2. Thay đổi `app/api/vital-sensing/route.ts`

### 2.1 Behavior hiện tại

```ts
catch (apiError: unknown) {
  const errorMessage = apiError instanceof Error ? apiError.message : "分析に失敗しました";
  return NextResponse.json({ error: true, message: errorMessage }, { status: 400 });
}
```

**Vấn đề**: `errorMessage` đôi khi chứa thông tin nội bộ (URL, token prefix, response body).

### 2.2 Behavior mới

```ts
catch (apiError: unknown) {
  // Log chi tiết phía server để debug
  console.error("[VitalSensing] External API error:", apiError);

  // Trả về message chung chung, an toàn cho client
  return NextResponse.json(
    { error: true, message: "バイタルサインの分析に失敗しました" },
    { status: 502 }
  );
}
```

**Điểm thay đổi:**
- Thêm `console.error()` với object lỗi đầy đủ (Next.js sẽ log ra server console)
- Đổi message trả về thành chuỗi cố định, không expose error nội bộ
- Đổi status từ `400` → `502` (Bad Gateway) vì lỗi xuất phát từ upstream service

---

## 3. Thay đổi `app/page.tsx`

### 3.1 Xóa mock fallback trong `sendToApi()`

**Hiện tại** (dòng ~482–499):
```ts
} catch (err) {
  console.warn("実API失敗、モックデータを使用:", err);
  // Mock data path — XÓA TOÀN BỘ BLOCK NÀY
  await new Promise((r) => setTimeout(r, 1000));
  const pattern = MOCK_PATTERNS[mockCycleIndex % MOCK_PATTERNS.length];
  mockCycleIndex++;
  setResult(pattern);
  setStep("result");
  const sc = computeScore(pattern);
  ...
}
```

**Thay bằng:**
```ts
} catch (err) {
  // Hiển thị màn hình lỗi chung chung cho user
  const message = language === "ja"
    ? "バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。"
    : "Vital sign analysis failed. Please wait a moment and try again.";
  setErrorMessage(message);
  setStep("error");
}
```

### 3.2 Xóa hardcoded mock fallback trong `beginRecording()`

**Hiện tại** (dòng ~535–550), catch block của `mr.onstop`:
```ts
} catch (fatalErr) {
  // XÓA TOÀN BỘ MOCK BLOCK
  console.error("致命的エラー、モック表示:", fatalErr);
  await new Promise((r) => setTimeout(r, 500));
  const fb = { bpm: "72", bpv1: "118", bpv0: "76", S2: "[97]", LTv: "1.45" };
  setResult(fb);
  setStep("result");
  ...
}
```

**Thay bằng:**
```ts
} catch (fatalErr) {
  console.error("[VitalSensing] Fatal processing error:", fatalErr);
  const message = language === "ja"
    ? "バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。"
    : "Vital sign analysis failed. Please wait a moment and try again.";
  setErrorMessage(message);
  setStep("error");
}
```

### 3.3 Ghi chú về `MOCK_PATTERNS` và `mockCycleIndex`

Sau khi xóa 2 mock block trên, `MOCK_PATTERNS` và `mockCycleIndex` sẽ không còn được tham chiếu ở đâu. **Xóa 2 khai báo này** tại đầu file (dòng ~11–18):
```ts
// XÓA:
const MOCK_PATTERNS = [...];
let mockCycleIndex = 0;
```

---

## 4. Lý do chọn `language` trong `sendToApi()`

`sendToApi` là `useCallback` không nhận `language` trong dependency array hiện tại. Có 2 cách handle:

**Phương án A** – Dùng hardcoded Japanese (đơn giản nhất):
```ts
setErrorMessage("バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。");
```
→ Không cần thay đổi dependency array của useCallback.

**Phương án B** – Dùng `useRef` để track language:
```ts
const languageRef = useRef(language);
useEffect(() => { languageRef.current = language; }, [language]);
// trong sendToApi:
const message = translations[languageRef.current].analysisError;
```
→ Phức tạp hơn, cần thêm key vào translations.

**Quyết định**: Dùng **Phương án B** vì app đã song ngữ đầy đủ, consistency quan trọng hơn.

**Thêm key `analysisError` vào translations:**
```ts
ja: { ..., analysisError: "バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。" }
en: { ..., analysisError: "Vital sign analysis failed. Please wait a moment and try again." }
```

---

## 5. HTTP Status Code

| Tình huống | Status cũ | Status mới | Lý do |
|---|---|---|---|
| External API lỗi | 400 | 502 Bad Gateway | Lỗi từ upstream service, không phải client |
| File không có | 400 | 400 | Giữ nguyên — lỗi input của client |
| Server error khác | 500 | 500 | Giữ nguyên |

---

## 6. Implementation Files

| File | Loại thay đổi | Mô tả |
|---|---|---|
| `app/page.tsx` | MODIFY | Xóa mock fallback, thêm error path, thêm languageRef, thêm translation key |
| `app/api/vital-sensing/route.ts` | MODIFY | Thêm console.error chi tiết, đổi message + status code |

---

## 7. Không thay đổi

- `lib/online-doctor.ts` — giữ nguyên, thư viện đã throw đúng
- `lib/reportService.ts` — giữ nguyên
- Fallback MP4 → WebM — giữ nguyên (không liên quan)
- Fallback Firestore → sessionReports — giữ nguyên (không liên quan)
