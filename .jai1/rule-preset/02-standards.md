---
trigger: always_on
description: Coding standards va conventions cho vital-sensing-demo
---

# Coding Standards

## Terms and Expected Actions

| Term | Action |
|------|--------|
| `fix bug` | Tai hien loi -> them/kiem tra guard -> verify lai luong chinh va fallback |
| `refactor` | Cai thien cau truc ma khong doi hanh vi va payload API |
| `optimize` | Do luong truoc, uu tien responsiveness camera/recording/analyzing |
| `harden` | Tang kha nang chiu loi mang, timeout, permission, va external service |

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| App route/page | lower-case route folders | `app/api/vital-sensing/route.ts` |
| React components | PascalCase cho component name, file theo route context | `page.tsx`, `layout.tsx` |
| Shared libs | camelCase utility files | `reportService.ts`, `theme-palettes.ts` |
| Config files | tool default naming | `next.config.ts`, `eslint.config.mjs` |

### Code Symbols

| Type | Convention | Example |
|------|------------|---------|
| Variables/functions | camelCase | `startCamera`, `sendToApi` |
| Types/interfaces | PascalCase | `VitalResult`, `TeamReport` |
| Constants | UPPER_SNAKE for immutable config | `MOCK_PATTERNS` |
| Union states | string literal unions | `type AppStep = "start" | ...` |

## Architecture Layers

| Layer | Responsibility |
|-------|---------------|
| UI Flow | Hien thi step, animation, message theo trang thai |
| Device/Media | Camera stream, recording, countdown, face alignment |
| Processing | WebM -> MP4, call internal API, handle timeout/fallback |
| Data | Save/get reports qua `lib/reportService.ts` |
| Integration | Proxy auth + forward video den external vital API |

## Do

- Validate input va state transitions cho tung buoc (`start` -> `camera` -> `recording` -> `analyzing` -> `result`).
- Dat timeout ro rang cho network/process nang (API request, MP4 conversion, team report fetch).
- Tach helper functions khi logic lap lai hoac component vuot nguong de maintain.
- Dung TypeScript strict, tranh `any` tru khi bat kha khang va co ly do ro.
- Giu thong diep loi huong nguoi dung than thien, co fallback thay vi crash.
- Uu tien cleanup resources (`MediaStream`, interval, animation frame) khi unmount/reset.
- Bao toan contract response JSON cua route API noi bo.

## Do Not

- Khong hardcode credentials, token, API key trong source.
- Khong goi truc tiep external vital API tu client UI.
- Khong bo qua path xu ly loi khi them integration moi.
- Khong them side effects vao rendering path neu co the dua vao hooks/callbacks.
- Khong block UI thread bang xu ly dong bo dai tren browser.
- Khong sua doi shape `TeamReport` tuy y ma khong cap nhat dong bo noi dung lien quan.

## Security and Privacy Checklist

- [ ] Khong log thong tin nhay cam (email/password/token) ra console hoac response.
- [ ] Kiem tra bien moi truong bat buoc truoc khi goi external service.
- [ ] Gioi han endpoint API route theo method mong muon (`POST`).
- [ ] Xu ly truong hop user tu choi camera permission.
- [ ] Dam bao CORS/COEP/COOP headers khong bi vo tinh xoa khi sua config.
- [ ] Khong luu video raw vao noi luu tru lau dai neu khong co yeu cau ro rang.

## Quality Gates

- Truoc khi merge: `npm run lint` pass.
- Neu sua luong chinh camera/analyze: test thu cong tren desktop Chrome.
- Neu sua API route/env: test ca case co token va case fallback.
