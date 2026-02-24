# TEST - Report Lookup (Tra cứu kết quả theo Short ID)

**Feature Name**: report-lookup  
**Version**: 1.0  
**Created**: 2026-02-24  
**FRD Reference**: FRD-report-lookup.md

---

## 1. Happy Path Scenarios

### TC-001: Tra cứu thành công bằng Short ID hợp lệ [US-001]
```gherkin
Given user mở trang /report
And đã có report với shortId "1234" trong D1
When user nhập "1234" vào ô input
And user nhấn nút Search
Then hiển thị result card với đầy đủ thông tin (BPM, BP, status)
And hiển thị thông tin "Measured At" với thời gian đo
And hiển thị "Report ID: VS-1234"
```

### TC-002: Truy cập trực tiếp qua URL [US-002]
```gherkin
Given có route /report/1234
And shortId "1234" tồn tại trong D1
When user mở URL /report/1234
Then redirect về /report?id=1234
And kết quả hiển thị tự động (auto-search)
```

### TC-003: Hỗ trợ song ngữ [US-001 AC-001-5]
```gherkin
Given localStorage có language = "en"
When user mở /report
Then tất cả labels hiển thị bằng tiếng Anh
And khi user đổi sang "ja", labels chuyển sang tiếng Nhật
```

### TC-004: Giữ theme nhất quán [US-004 AC-004-2]
```gherkin
Given localStorage có themePalette = "clean-white"
When user mở /report
Then background và màu sắc áp dụng theme "clean-white"
And không bị flash về dark theme rồi mới chuyển
```

---

## 2. Error Cases

### TC-101: Short ID không tồn tại [US-003, ERR-001]
```gherkin
Given user mở /report
When user nhập "9999" (không có trong D1)
And nhấn Search
Then API trả về 404
And hiển thị thông báo: "レポートが見つかりません" / "Report Not Found"
And input không bị xóa (user có thể nhập lại)
And không redirect sang trang 404
```

### TC-102: Input không đủ 4 chữ số [ERR-002]
```gherkin
Given user mở /report
When user nhập "12" (chỉ 2 chữ số)
Then nút Search bị disabled
And không có API call nào được thực hiện
When user nhập thêm để đủ "1234"
Then nút Search được enable
```

### TC-103: Server error [ERR-003]
```gherkin
Given API /api/reports/1234 trả về 500
When user nhập "1234" và nhấn Search
Then hiển thị thông báo lỗi chung
And có button retry để search lại
```

### TC-104: Input có ký tự không hợp lệ [ERR-002]
```gherkin
Given user mở /report
When user gõ "abc4" vào input
Then chỉ "4" được nhận vào (abc bị lọc)
Or toàn bộ bị reject và input chỉ nhận digits
```

---

## 3. Edge Cases

### TC-201: shortId leading zeros
```gherkin
Given report có shortId = "0042"
When user nhập "0042" và search
Then kết quả tìm thấy đúng report
And hiển thị "VS-0042" (giữ nguyên leading zeros)
```

### TC-202: URL /report/abc (non-digit shortId)
```gherkin
When user mở URL /report/abc
Then redirect về /report
And form hiển thị trống (không pre-fill)
```

### TC-203: Loading state
```gherkin
When user nhấn Search
Then nút Search hiển thị "Searching..." và disabled
And có spinner hoặc loading indicator
Until API trả về response
```

---

## 4. API Test Cases

### API-001: GET /api/reports/1234 — found
- Request: `GET /api/reports/1234`
- Expected: `200 { report: { shortId: "1234", bpm: "...", ... } }`

### API-002: GET /api/reports/9999 — not found
- Request: `GET /api/reports/9999`
- Expected: `404 { error: "not_found" }`

### API-003: GET /api/reports/abc — invalid
- Request: `GET /api/reports/abc`
- Expected: `400 { error: "invalid_id" }`

### API-004: GET /api/reports/12 — invalid (less than 4 digits)
- Request: `GET /api/reports/12`
- Expected: `400 { error: "invalid_id" }`
