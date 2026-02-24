---
trigger: always_on
description: Tong quan du an vital-sensing-demo va kien truc Next.js App Router
---

# Project Overview

## Architecture

- **Pattern**: Frontend-first app voi Next.js App Router, co route API noi bo de proxy den dich vu phan tich vital.
- **Rendering**: UI chinh dung Client Component (`app/page.tsx`) vi phu thuoc camera, media stream, face detection va WebAssembly.
- **Data flow**: Camera/WebM -> convert MP4 tren browser -> `POST /api/vital-sensing` -> external API -> hien thi ket qua + luu Firestore.
- **Fallback strategy**: Neu API hoac Firebase loi, app van tiep tuc bang mock data/session cache de giu trai nghiem demo.

## Tech Stack

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

## Project Structure

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

## Runtime Environments

| Scope | Variables |
|------|-----------|
| API proxy auth | `API_BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`, `BASIC_AUTH_ID`, `BASIC_AUTH_PW` |
| Firebase client | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` |

## Development Commands

```bash
npm run dev      # Chay local dev server
npm run build    # Build production
npm run start    # Run production build
npm run lint     # Kiem tra lint theo Next + TypeScript rules
```

## API Contract (Internal)

### Endpoint

- `POST /api/vital-sensing`
- Request: `multipart/form-data` voi field `file` (video blob)

### Success shape

```json
{ "code": 200, "data": { "bpm": "75", "bpv1": "120", "bpv0": "75", "S2": "[97]", "LTv": "1.45" } }
```

### Error shape

```json
{ "error": true, "message": "..." }
```

## Key Conventions For Agents

- Ton trong luong UX demo: uu tien fallback an toan thay vi fail hard.
- Khong bo qua route proxy; integration external service phai qua `app/api/vital-sensing/route.ts`.
- Code moi cho UI nen tach theo component/feature thay vi tiep tuc tang kich thuoc `app/page.tsx`.
- Khong commit secret/env values; chi dung placeholders va tai lieu bien moi truong.
