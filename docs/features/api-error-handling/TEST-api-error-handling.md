# TEST: API Error Handling

**Feature**: api-error-handling
**Version**: 1.0.0
**Created**: 2026-02-24

---

## 1. Happy Path

### TC-001: Phân tích thành công → Hiển thị kết quả thực

```gherkin
Given user đã quay 6 giây video và camera đang ở step "analyzing"
When external API trả về { code: 200, data: { bpm, bpv1, bpv0, S2, LTv } }
Then step chuyển sang "result"
And hiển thị đúng các giá trị vital từ response thực
And KHÔNG hiển thị mock data
```

---

## 2. Error Cases

### TC-002: External API trả HTTP lỗi → Màn hình lỗi chung

```gherkin
Given user đã quay 6 giây và sendToApi() được gọi
When /api/vital-sensing trả về { error: true } với status 502
Then step chuyển sang "error"
And errorMessage hiển thị: "バイタルサインの分析...再度お試しください" (ja)
  hoặc "Vital sign analysis failed..." (en)
And KHÔNG có mock data được setResult()
```

### TC-003: Network timeout → Màn hình lỗi chung

```gherkin
Given sendToApi() gọi fetch với AbortController timeout 20s
When request vượt quá 20 giây không có response
Then AbortError được catch
And step chuyển sang "error" với message chung
And KHÔNG có mock data
```

### TC-004: Fatal processing error → Màn hình lỗi chung

```gherkin
Given MP4 conversion thành công, sendToApi() throws exception không xử lý được
When catch block của beginRecording() mr.onstop bắt lỗi
Then step chuyển sang "error" với message chung
And KHÔNG có hardcoded { bpm:"72",... } được setResult()
```

### TC-005: Server log chi tiết khi API lỗi

```gherkin
Given external API trả về lỗi với message "ご利用回数の上限に達しました"
When route.ts bắt được lỗi từ analyzeVitalSignal()
Then server console có log: "[VitalSensing] External API error:" kèm error object
And response gửi về client KHÔNG chứa message chi tiết đó
And response chứa message chung: "バイタルサインの分析に失敗しました"
```

### TC-006: Ngôn ngữ error message khớp với language hiện tại

```gherkin
Given user đang dùng ngôn ngữ "en"
When API thất bại
Then errorMessage là: "Vital sign analysis failed. Please wait a moment and try again."

Given user đang dùng ngôn ngữ "ja"
When API thất bại
Then errorMessage là: "バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。"
```

---

## 3. Hướng dẫn kiểm thử thủ công

### Kiểm thử TC-002 và TC-003:
1. Tạm thời comment `analyzeVitalSignal(file)` trong route.ts, thay bằng `throw new Error("test error")`
2. Chạy demo → Record → Observe
3. **Expected**: Màn hình "エラーが発生しました" xuất hiện, không có kết quả vital
4. Server log (terminal `npm run dev`) phải có: `[VitalSensing] External API error: Error: test error`

### Kiểm thử TC-006:
1. Đổi language sang "en" (nút 🌐)
2. Trigger lỗi như trên
3. **Expected**: Error message bằng tiếng Anh

### Kiểm thử TC-001 (regression):
1. Kết nối API thật hoặc dùng mock route test
2. Record bình thường
3. **Expected**: Kết quả real hiển thị như trước
