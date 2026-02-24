---
name: rule-preset-from-survey
description: "Interactive survey to collect project tech stack info for rule-preset generation. Use when no source code is detected in the current directory and user wants to create AI coding rules manually. Guides user through step-by-step questions about project type, language, framework, styling, database, and tools — one question at a time."
---

# Rule Preset From Survey

Collect project tech stack information through a step-by-step survey when no source code is available.

## ⚠️ CRITICAL RULES

1. Hỏi **TỪNG CÂU MỘT**. Mỗi message chỉ chứa **1 câu hỏi duy nhất**.
2. Sau mỗi câu hỏi, **DỪNG LẠI và CHỜ** user trả lời. KHÔNG hỏi câu tiếp theo.
3. Mỗi câu hỏi PHẢI có options dạng `a) b) c)` để user chọn.
4. **CẤM** gom nhiều câu hỏi lại thành 1 message.
5. **CẤM** yêu cầu user nhập dạng `key=value`, pipe `|`, hay free-text dài.
6. **CẤM** tự gợi ý stack mặc định rồi bảo user sửa.
7. User chỉ cần trả lời bằng chữ cái (ví dụ: `a`, `a,f`) là đủ.

## Survey Flow

Thực hiện tuần tự từng bước. Mỗi bước = 1 message duy nhất. Chờ phản hồi trước khi tiếp tục.

### Question 1 — Loại dự án

```
🚀 Câu 1/8 — Loại dự án? (chọn 1)

a) Frontend          b) Backend          c) Fullstack
d) Monorepo          e) CLI              f) Docs site
g) Bot               h) Mobile           i) Desktop
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 2 — Ngôn ngữ chính

```
📝 Câu 2/8 — Ngôn ngữ chính? (chọn 1)

a) TypeScript        b) JavaScript       c) PHP
d) Python            e) Go               f) Rust
g) Java              h) Khác: ___
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 3 — Framework

Dựa vào câu 1 + 2, hiển thị options phù hợp. Xem `references/survey-options.md` để lấy đúng danh sách options.

Format:

```
🔧 Câu 3/8 — Framework? (chọn 1)

a) ...    b) ...    c) ...
d) Khác: ___
```

Nếu Fullstack: hỏi frontend framework trước (câu 3), rồi hỏi backend framework (câu 3b) ở message tiếp theo.

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 4 — Styling / CSS

> Chỉ hỏi nếu project có frontend. Nếu pure backend/CLI/bot → **BỎ QUA**.

```
🎨 Câu 4/8 — CSS / UI? (chọn 1 hoặc nhiều, ví dụ: a,f)

a) Tailwind CSS v4   b) Tailwind CSS v3   c) CSS Modules
d) Styled Components e) Vanilla CSS       f) shadcn/ui
g) Khác: ___
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 5 — Database / ORM

> Chỉ hỏi nếu project có backend. Nếu pure frontend/docs/mobile → **BỎ QUA**.

Xem `references/survey-options.md` để lấy options theo ngôn ngữ (TS/JS, PHP, Python).

Format:

```
🗄️ Câu 5/8 — Database / ORM? (chọn 1)

a) ...    b) ...    c) ...
f) Không dùng
g) Khác: ___
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 6 — Tên dự án

```
📛 Câu 6/8 — Tên dự án?

Nhập tên hoặc Enter để dùng default: <tên thư mục hiện tại>
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 7 — Package manager

```
📦 Câu 7/8 — Package manager? (chọn 1)

a) pnpm              b) npm
c) yarn              d) bun
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

### Question 8 — Công cụ bổ sung

```
🔨 Câu 8/8 — Công cụ bổ sung? (chọn nhiều hoặc skip, ví dụ: a,b)

a) ESLint + Prettier       b) Vitest / Jest
c) Docker                  d) CI/CD (GitHub Actions)
e) Husky + lint-staged     f) Không cần
```

**⛔ DỪNG. CHỜ USER TRẢ LỜI.**

## Output: Tổng kết & Xác nhận

Sau khi thu thập đủ câu trả lời, hiển thị tổng kết:

```
🔍 Tổng kết dự án của bạn

LOẠI:        <stack type>
DỰ ÁN:       <project name>
NGÔN NGỮ:    <language>

FRAMEWORK:   <framework>
STYLING:     <css/ui hoặc N/A>
DATABASE:    <database/ORM hoặc N/A>

PKG MANAGER: <package manager>
TOOLS:       <tools>
```

Sau đó hỏi xác nhận:

```
Đúng chưa? [Y/n/edit]
```

- `Y` → Hoàn tất survey, trả kết quả về workflow để tiếp tục generate
- `n` → Hủy
- `edit` → Quay lại Question 1

## Resources

- `references/survey-options.md` — Chi tiết options cho mỗi project type + language
