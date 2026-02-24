---
description: Vital Sensing Demo project overview and architecture
---

# Project Overview

## Architecture

- **Pattern**: Frontend-first Next.js App Router with internal API route proxying to external vital sensing service
- **Rendering**: Client Component for main UI (camera, media stream, face detection, WebAssembly); Server for API routes
- **Data flow**: Camera → WebM recording → (optional MP4 convert) → `POST /api/vital-sensing` → external API → display results + save D1
- **Deployment**: Cloudflare Workers via OpenNext adapter + Alchemy IaC

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + global CSS + runtime theme palette |
| Database | Cloudflare D1 (SQLite) |
| Face Detection | face-api.js (TinyFaceDetector, local models) |
| Video Processing | @ffmpeg/ffmpeg (WASM, currently disabled) |
| API Integration | Online Doctor Vital Sensing API (proxied) |
| Deployment | Cloudflare Workers + Alchemy IaC |
| Runtime | Node.js (route handlers), Browser APIs (MediaRecorder) |

## Project Structure

```
app/
  api/
    vital-sensing/route.ts   # Proxy auth + submit video to external API
    reports/route.ts          # Team reports CRUD (D1)
  globals.css                 # Global styles + Tailwind import
  layout.tsx                  # Root layout, metadata, fonts
  page.tsx                    # Main client flow (camera → record → analyze → result)
  theme-palettes.ts           # Theme palette definitions
lib/
  online-doctor.ts            # External API wrapper (auth + vital analysis)
  reportService.ts            # D1 report persistence (save/get)
  d1.ts                       # D1 database helper
migrations/                   # D1 SQL migrations
public/
  models/                     # face-api model files
alchemy.run.ts                # Alchemy IaC deployment config
```

## Development Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Run local dev (migrate D1 + Alchemy dev)
npm run build                # Production build
npm run lint                 # ESLint check
npm run deploy               # Deploy to Cloudflare (demo stage)
npm run destroy              # Tear down Cloudflare resources
npm run db:migrate:local     # Apply D1 migrations locally
```

## API Contract (Internal)

### POST /api/vital-sensing

- Request: `multipart/form-data` with field `file` (video blob)

#### Success
```json
{ "code": 200, "data": { "bpm": "75", "bpv1": "120", "bpv0": "75", "S2": "[97]", "LTv": "1.45" } }
```

#### Error
```json
{ "error": true, "message": "バイタルサインの分析に失敗しました" }
```

## Runtime Environment

| Scope | Variables |
|-------|-----------|
| API proxy | `API_BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD` |
| Alchemy | `ALCHEMY_PASSWORD` |
