# AGENTS.md

## Project Overview

### Architecture

- **Pattern**: Frontend-first app voi Next.js App Router, co route API noi bo de proxy den dich vu phan tich vital.
- **Rendering**: UI chinh dung Client Component (`app/page.tsx`) vi phu thuoc camera, media stream, face detection va WebAssembly.
- **Data flow**: Camera/WebM -> convert MP4 tren browser -> `POST /api/vital-sensing` -> external API -> hien thi ket qua + luu Firestore.
- **Fallback strategy**: Neu API hoac Firebase loi, app van tiep tuc bang mock data/session cache de giu trai nghiem demo.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + global CSS + runtime theme palette |
| API Route | Next.js Route Handler (`app/api/*`) |
| Face Detection | `face-api.js` (TinyFaceDetector, model local trong `public/models`) |
| Video Processing | `@ffmpeg/ffmpeg` WASM |
| Persistence | Firebase Firestore |
| Runtime | Node.js (route handler), Browser APIs (MediaRecorder/getUserMedia) |

### Project Structure

```text
app/
  api/
    vital-sensing/
      route.ts            # Proxy + auth + submit file den external API
  globals.css             # Global styles + Tailwind import
  layout.tsx              # Root layout, metadata, font setup
  page.tsx                # Main client flow (camera -> record -> analyze -> result)
  theme-palettes.ts       # Theme palette config
lib/
  firebase.ts             # Firebase app + Firestore init
  reportService.ts        # Save/get team reports
public/
  models/                 # face-api model files
  ffmpeg/                 # ffmpeg core files
```

### Runtime Environments

| Scope | Variables |
|------|-----------|
| API proxy auth | `API_BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`, `BASIC_AUTH_ID`, `BASIC_AUTH_PW` |
| Firebase client | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` |

### Development Commands

```bash
npm run dev      # Chay local dev server
npm run build    # Build production
npm run start    # Run production build
npm run lint     # Kiem tra lint theo Next + TypeScript rules
```

### API Contract (Internal)

#### Endpoint

- `POST /api/vital-sensing`
- Request: `multipart/form-data` voi field `file` (video blob)

#### Success shape

```json
{ "code": 200, "data": { "bpm": "75", "bpv1": "120", "bpv0": "75", "S2": "[97]", "LTv": "1.45" } }
```

#### Error shape

```json
{ "error": true, "message": "..." }
```

### Key Conventions For Agents

- Ton trong luong UX demo: uu tien fallback an toan thay vi fail hard.
- Khong bo qua route proxy; integration external service phai qua `app/api/vital-sensing/route.ts`.
- Code moi cho UI nen tach theo component/feature thay vi tiep tuc tang kich thuoc `app/page.tsx`.
- Khong commit secret/env values; chi dung placeholders va tai lieu bien moi truong.

## Coding Standards

### Terms and Expected Actions

| Term | Action |
|------|--------|
| `fix bug` | Tai hien loi -> them/kiem tra guard -> verify lai luong chinh va fallback |
| `refactor` | Cai thien cau truc ma khong doi hanh vi va payload API |
| `optimize` | Do luong truoc, uu tien responsiveness camera/recording/analyzing |
| `harden` | Tang kha nang chiu loi mang, timeout, permission, va external service |

### Naming Conventions

#### Files

| Type | Convention | Example |
|------|------------|---------|
| App route/page | lower-case route folders | `app/api/vital-sensing/route.ts` |
| React components | PascalCase cho component name, file theo route context | `page.tsx`, `layout.tsx` |
| Shared libs | camelCase utility files | `reportService.ts`, `theme-palettes.ts` |
| Config files | tool default naming | `next.config.ts`, `eslint.config.mjs` |

#### Code Symbols

| Type | Convention | Example |
|------|------------|---------|
| Variables/functions | camelCase | `startCamera`, `sendToApi` |
| Types/interfaces | PascalCase | `VitalResult`, `TeamReport` |
| Constants | UPPER_SNAKE for immutable config | `MOCK_PATTERNS` |
| Union states | string literal unions | `type AppStep = "start" | ...` |

### Architecture Layers

| Layer | Responsibility |
|-------|---------------|
| UI Flow | Hien thi step, animation, message theo trang thai |
| Device/Media | Camera stream, recording, countdown, face alignment |
| Processing | WebM -> MP4, call internal API, handle timeout/fallback |
| Data | Save/get reports qua `lib/reportService.ts` |
| Integration | Proxy auth + forward video den external vital API |

### Do

- Validate input va state transitions cho tung buoc (`start` -> `camera` -> `recording` -> `analyzing` -> `result`).
- Dat timeout ro rang cho network/process nang (API request, MP4 conversion, team report fetch).
- Tach helper functions khi logic lap lai hoac component vuot nguong de maintain.
- Dung TypeScript strict, tranh `any` tru khi bat kha khang va co ly do ro.
- Giu thong diep loi huong nguoi dung than thien, co fallback thay vi crash.
- Uu tien cleanup resources (`MediaStream`, interval, animation frame) khi unmount/reset.
- Bao toan contract response JSON cua route API noi bo.

### Do Not

- Khong hardcode credentials, token, API key trong source.
- Khong goi truc tiep external vital API tu client UI.
- Khong bo qua path xu ly loi khi them integration moi.
- Khong them side effects vao rendering path neu co the dua vao hooks/callbacks.
- Khong block UI thread bang xu ly dong bo dai tren browser.
- Khong sua doi shape `TeamReport` tuy y ma khong cap nhat dong bo noi dung lien quan.

### Security and Privacy Checklist

- [ ] Khong log thong tin nhay cam (email/password/token) ra console hoac response.
- [ ] Kiem tra bien moi truong bat buoc truoc khi goi external service.
- [ ] Gioi han endpoint API route theo method mong muon (`POST`).
- [ ] Xu ly truong hop user tu choi camera permission.
- [ ] Dam bao CORS/COEP/COOP headers khong bi vo tinh xoa khi sua config.
- [ ] Khong luu video raw vao noi luu tru lau dai neu khong co yeu cau ro rang.

### Quality Gates

- Truoc khi merge: `npm run lint` pass.
- Neu sua luong chinh camera/analyze: test thu cong tren desktop Chrome.
- Neu sua API route/env: test ca case co token va case fallback.

## Frontend Guidelines

### Component and File Organization

- Mac dinh tach logic lon khoi `app/page.tsx` thanh module nho theo feature: camera, analyze, result, team-report.
- Uu tien custom hooks cho side effects phuc tap (`useCamera`, `useFaceDetection`, `useTeamReports`).
- Giu `app/layout.tsx` gon: metadata, root wrappers, global concerns.
- Utilities dung chung dat trong `lib/` voi API ro rang, tranh phu thuoc nguoc vao UI.

### State Management Approach

- Dung local state (`useState`, `useRef`, `useEffect`, `useCallback`) cho luong tuong tac real-time.
- Uu tien finite-step thinking cho `AppStep`; moi transition phai co dieu kien ro.
- Tach transient state va persisted state:
  - Transient: camera stream, countdown, face status.
  - Persisted: theme palette, language, team reports cache.
- Khi co xu ly async dai, luon co loading/progress state va timeout fallback.

### Styling and Theming

- Giu huong thiet ke hien tai: clinical tone, gradient background, Noto Sans JP cho UI.
- Su dung token/theme palette thay vi hardcode mau moi trong nhieu noi.
- Neu them theme moi, cap nhat dong bo `theme-palettes.ts`, UI selector, va contrast text.
- Ket hop Tailwind utilities voi scoped/global CSS mot cach nhat quan; tranh xung dot style.

### UI/UX Rules for Camera Flow

- Luon hien thong diep huong dan theo state (`loading`, `no-face`, `outside`, `inside`, `recording`).
- Nut bat dau do luong chi enable khi dieu kien can thiet da dat.
- Neu mat tracking giua recording, reset an toan va thong bao ro ly do.
- Ket qua va loi phai co nut quay lai/reset de user thoat khoi dead-end.

### Performance Guidelines

- Import nang (`face-api.js`, `@ffmpeg/ffmpeg`) theo lazy/dynamic import nhu hien tai.
- Tranh render lai khong can thiet trong vong lap detection; dung `useRef` cho mutable runtime values.
- Gioi han tan suat update UI cho progress/countdown o muc hop ly.
- Kiem tra memory leak: stop track, clear interval, cancel animation frame khi reset/unmount.

### Accessibility and Internationalization

- Duy tri ho tro song ngu (`ja`, `en`) cho text hien thi va thong diep loi.
- Dam bao interactive controls co label ro rang va tap target phu hop mobile.
- Uu tien semantic HTML cho section ket qua/bao cao.
- Kiem tra mau trang thai (xanh/vang/do) dat muc contrast doc duoc tren ca dark/light variant.

### Data and API Interaction (Frontend)

- Frontend chi goi API noi bo `/api/vital-sensing`, khong goi external URL truc tiep.
- Luon xu ly 3 nhom ket qua: success, api-failure, timeout/interruption.
- Duy tri fallback mock/session de demo khong bi dung do ket noi dich vu ngoai.
- Khi thay doi payload/result shape, cap nhat dong bo type `VitalResult` va render cards.

### Testing Focus (Manual Priority)

- Happy path: cho phep camera -> record 6 giay -> analyze -> result.
- Permission denied path: vao man hinh loi va retry hoat dong.
- Face outside path: khong cho bat dau recording va canh bao ro rang.
- Team report path: fetch thanh cong va fallback session khi Firestore fail.

## Project Customizations

File nay de team bo sung quy tac rieng theo van hanh noi bo.
No khong nen bi overwrite khi regenerate preset.

### Team Conventions

- [ ] Dinh nghia quy uoc review code (so nguoi review, SLA, muc do bat buoc).
- [ ] Dinh nghia quy uoc branch/commit message chi tiet hon neu can.
- [ ] Dinh nghia checklist release demo/prod theo quy trinh noi bo.

### Product-Specific Rules

- [ ] Nguong danh gia vital score (excellent/good/fair/caution/check) co can dieu chinh?
- [ ] Quy tac hien thi thong diep canh bao y te theo phap ly noi bo.
- [ ] Danh sach locale bat buoc ngoai `ja` va `en`.

### External Integration Notes

- [ ] Chinh sach rotate credentials cho external vital API.
- [ ] Chinh sach fallback khi Firestore khong kha dung.
- [ ] Danh sach environment variables bat buoc theo tung moi truong.

### Performance and Observability

- [ ] KPI can theo doi: thoi gian start camera, thoi gian analyze, ty le fail API.
- [ ] Quy tac log level cho dev/staging/prod.
- [ ] Neu can, them telemetry events cho moi state transition quan trong.

### Security and Compliance

- [ ] Quy tac xu ly du lieu video tam thoi (retention, xoa du lieu).
- [ ] Quy tac mask/anonymize thong tin nhay cam trong logs.
- [ ] Danh sach doi tuong duoc phep truy cap dashboard/bao cao team.

### Notes

- Giu noi dung gon, huong dan hanh dong ro, tranh viet thanh tai lieu huong dan dai dong.
- Moi thay doi lon trong file nay nen duoc review boi owner ky thuat + product.

## Jai1 Framework Agent

You are an AI agent working within the Jai1 framework ecosystem.

### File Access (Highest Priority)

By default, DO NOT read contents from the `.jai1/` directory unless there is an explicit reference to a file within it, such as:
- `@.jai1/rules/jai1.md`
- `skill:pdf-extract`
- Other direct file references

This prevents unnecessary context loading and ensures skills are only loaded when explicitly requested.

### Response 
- Alway use Vietnamese for response.

### Technical Stack Preference

When making technology decisions, follow this thinking pattern:

1. **Default to established stack**: If the technology in `packages/core/context/jv-it-context.md` is suitable for the requirement, prioritize using it.

2. **When proposing new technologies**: Consider compatibility first:
   - Team size and company size
   - Existing technical stack the company already uses
   - Learning curve and adoption effort

3. **For specialized requirements**: When the established stack cannot meet specific needs, propose the best solution for that requirement with clear justification.

This ensures consistency while allowing flexibility for genuine technical needs.

### Skills Reference

When a user prompt contains a skill reference pattern, load and follow the corresponding skill instructions.

#### Pattern Detection

Detect skill references using these patterns:
- `skill:{name}` (e.g., `skill:pdf-extract`)
- `skill {name}` (e.g., `skill pdf-extract`)

#### Skill Loading Procedure

When a skill pattern is detected:

1. Extract the skill name from the pattern
2. Read the skill file at `.jai1/skills/{name}/SKILL.md`
3. Parse the YAML frontmatter for metadata (name, description)
4. Follow the instructions in the skill body
5. Access bundled resources as needed:
   - `scripts/` - Executable code for deterministic tasks
   - `references/` - Documentation to load into context
   - `assets/` - Files used in output (templates, images, etc.)

