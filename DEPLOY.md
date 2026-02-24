# Deployment Guide — Vital Sensing Demo

## Overview

App được deploy lên **Cloudflare Workers** thông qua [Alchemy](https://alchemy.run) — một Infrastructure-as-Code framework cho Cloudflare.

- **Database**: Cloudflare D1 (SQLite tại edge)
- **Deployment**: Cloudflare Workers via Alchemy `Nextjs` resource
- **IaC**: `alchemy.run.ts` (file duy nhất)

---

## Prerequisites

- Node.js >= 18
- Tài khoản Cloudflare (miễn phí)

---

## 1. Local Development

```bash
# Cài dependencies
npm install

# Chạy local dev server (Next.js dev server + D1 local mock)
npm run dev
```

> `initOpenNextCloudflareForDev()` trong `next.config.ts` sẽ tự động mock D1 binding khi `next dev`.
> API routes sử dụng `getCloudflareContext()` sẽ hoạt động local.

---

## 2. Environment Variables

Tạo file `.env.local` (copy từ `.env.local.example` nếu có):

```bash
# External Vital API
API_BASE_URL=https://your-api-base-url
LOGIN_EMAIL=your-email@example.com
LOGIN_PASSWORD=your-password
BASIC_AUTH_ID=
BASIC_AUTH_PW=

# Alchemy (bắt buộc cho deploy)
ALCHEMY_PASSWORD=change-me-to-a-strong-password
```

---

## 3. Deploy lên Cloudflare

### Bước 1: Login Cloudflare

```bash
npx alchemy login
```

### Bước 2: Deploy

```bash
npm run deploy
```

Alchemy sẽ tự động:
1. Build Next.js app (`next build`)
2. Bundle với OpenNext Cloudflare adapter
3. Tạo D1 database `vital-reports-db` (nếu chưa có)
4. Apply migration `migrations/0001_initial.sql`
5. Deploy Worker lên Cloudflare với tất cả bindings

Sau deploy, URL sẽ hiện ra:

```
✅ Deployment configured
   Website → https://website.<your-account>.workers.dev
```

---

## 4. Files quan trọng

| File | Mục đích |
|------|---------|
| `alchemy.run.ts` | **IaC config duy nhất** — D1Database + Nextjs resource |
| `migrations/0001_initial.sql` | Schema D1 — tự apply khi deploy |
| `open-next.config.ts` | OpenNext Cloudflare adapter config |
| `types/env.d.ts` | Type-safe bindings từ alchemy.run.ts |
| `lib/d1.ts` | Helper lấy D1 binding qua `getCloudflareContext()` |
| `lib/reportService.ts` | D1 raw SQL functions |
| `app/api/reports/route.ts` | GET/POST /api/reports |

---

## 5. Destroy (cleanup)

```bash
npx alchemy destroy
```

> ⚠️ Lệnh này sẽ xóa Worker và D1 database trên Cloudflare.
