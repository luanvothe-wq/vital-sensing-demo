---
trigger: always_on
---

# Frontend Guidelines

## Component and File Organization

- Mac dinh tach logic lon khoi `app/page.tsx` thanh module nho theo feature: camera, analyze, result, team-report.
- Uu tien custom hooks cho side effects phuc tap (`useCamera`, `useFaceDetection`, `useTeamReports`).
- Giu `app/layout.tsx` gon: metadata, root wrappers, global concerns.
- Utilities dung chung dat trong `lib/` voi API ro rang, tranh phu thuoc nguoc vao UI.

## State Management Approach

- Dung local state (`useState`, `useRef`, `useEffect`, `useCallback`) cho luong tuong tac real-time.
- Uu tien finite-step thinking cho `AppStep`; moi transition phai co dieu kien ro.
- Tach transient state va persisted state:
  - Transient: camera stream, countdown, face status.
  - Persisted: theme palette, language, team reports cache.
- Khi co xu ly async dai, luon co loading/progress state va timeout fallback.

## Styling and Theming

- Giu huong thiet ke hien tai: clinical tone, gradient background, Noto Sans JP cho UI.
- Su dung token/theme palette thay vi hardcode mau moi trong nhieu noi.
- Neu them theme moi, cap nhat dong bo `theme-palettes.ts`, UI selector, va contrast text.
- Ket hop Tailwind utilities voi scoped/global CSS mot cach nhat quan; tranh xung dot style.

## UI/UX Rules for Camera Flow

- Luon hien thong diep huong dan theo state (`loading`, `no-face`, `outside`, `inside`, `recording`).
- Nut bat dau do luong chi enable khi dieu kien can thiet da dat.
- Neu mat tracking giua recording, reset an toan va thong bao ro ly do.
- Ket qua va loi phai co nut quay lai/reset de user thoat khoi dead-end.

## Performance Guidelines

- Import nang (`face-api.js`, `@ffmpeg/ffmpeg`) theo lazy/dynamic import nhu hien tai.
- Tranh render lai khong can thiet trong vong lap detection; dung `useRef` cho mutable runtime values.
- Gioi han tan suat update UI cho progress/countdown o muc hop ly.
- Kiem tra memory leak: stop track, clear interval, cancel animation frame khi reset/unmount.

## Accessibility and Internationalization

- Duy tri ho tro song ngu (`ja`, `en`) cho text hien thi va thong diep loi.
- Dam bao interactive controls co label ro rang va tap target phu hop mobile.
- Uu tien semantic HTML cho section ket qua/bao cao.
- Kiem tra mau trang thai (xanh/vang/do) dat muc contrast doc duoc tren ca dark/light variant.

## Data and API Interaction (Frontend)

- Frontend chi goi API noi bo `/api/vital-sensing`, khong goi external URL truc tiep.
- Luon xu ly 3 nhom ket qua: success, api-failure, timeout/interruption.
- Duy tri fallback mock/session de demo khong bi dung do ket noi dich vu ngoai.
- Khi thay doi payload/result shape, cap nhat dong bo type `VitalResult` va render cards.

## Testing Focus (Manual Priority)

- Happy path: cho phep camera -> record 6 giay -> analyze -> result.
- Permission denied path: vao man hinh loi va retry hoat dong.
- Face outside path: khong cho bat dau recording va canh bao ro rang.
- Team report path: fetch thanh cong va fallback session khi Firestore fail.
