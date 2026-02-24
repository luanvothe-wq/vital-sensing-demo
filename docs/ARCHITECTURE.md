# Architecture Overview

> Tài liệu kiến trúc high-level cho vital-sensing-demo

## 🏗️ Tech Stack

### Core
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | ^4 |
| Database | Firebase Firestore | ^12.9.0 |

### Processing Services
| Service | Usage |
|---------|-------|
| face-api.js | (^0.22.2) Client-side face detection và alignment |
| @ffmpeg/ffmpeg | (^0.12.10) WASM/Client-side video encode WebM sang MP4 |

## 📐 Architecture Pattern

**Pattern**: Frontend-first App Router với API proxy server-side

```
[Client/Browser] -- MediaStream / WASM --> [NextJS Route Handler] -- POST --> [External Vital API]
       |                                            |
       v                                            v
[Firestore (fallback/cache)] <--------------- [Firestore (Lưu Kết quả)]
```

## 📁 Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `app/api/vital-sensing/` | Backend proxy và gọi external API | `route.ts` |
| `app/` | Client UI chính của ứng dụng | `page.tsx`, `layout.tsx`, `theme-palettes.ts` |
| `lib/` | Firebase service provider, utilities | `firebase.ts`, `reportService.ts` |
| `public/` | Model cho AI, FFmpeg core WASM | `models/`, `ffmpeg/` |

## 🔄 Request Flow

```mermaid
sequenceDiagram
    Client->>+Browser: getUserMedia (Camera)
    Browser->>+face-api: Detect Face
    Browser->>+MediaRecorder: Record Video (WebM)
    Browser->>+FFmpeg (WASM): Convert WebM to MP4
    Browser->>+NextJS API (/api/vital-sensing): POST MP4
    NextJS API->>+External API: Submit for Vital Analysis
    External API-->>-NextJS API: Vital Results
    NextJS API-->>-Browser: Return Data
    Browser->>+Firestore: Save Session Report
```

## 🔐 Authentication

**Method**: API Keys / Basic Auth / Firebase Auth
Backend Route Handler đóng vai trò proxy để bảo mật `BASIC_AUTH_ID`, `BASIC_AUTH_PW`, `API_BASE_URL` khi gọi External API. Client dùng `NEXT_PUBLIC_FIREBASE_*` cho Firestore.

## 📝 Development Notes

### Conventions
- Các helper components được ưu tiên tách ra cấu trúc nhỏ gọn để giữ file `app/page.tsx` quản lý state rõ ràng.
- Giao diện có clinical tone, gradient background, hiển thị ngôn ngữ song ngữ (ja/en).

### Important Files
- `app/api/vital-sensing/route.ts` - Trung tâm forward video lên dịch vụ Vital API bằng thông tin xác thực từ server
- `app/page.tsx` - Luồng hiển thị chính: `start` -> `camera` -> `recording` -> `analyzing` -> `result`
- `app/theme-palettes.ts` - Quản lý màu theo chủ đề.
