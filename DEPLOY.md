# Deploying to Vercel (recommended)

This project is a Next.js app with a server-side API route at `app/api/vital-sensing/route.ts`.

Recommended steps:

1. Create a Vercel account and connect your Git repository.
2. Add environment variables in the Vercel dashboard (Project Settings -> Environment Variables):
   - `API_BASE_URL` (e.g. https://jvit-demo.ishachoku.com)
   - `LOGIN_EMAIL`
   - `LOGIN_PASSWORD`
   - `BASIC_AUTH_ID`
   - `BASIC_AUTH_PW`

3. (Optional) If you prefer local testing, copy `.env.example` -> `.env.local` and fill values.

Notes & caveats:

- The API route uses the Node.js runtime (`export const runtime = "nodejs"`) so it runs as a serverless Node function on Vercel.
- Vercel serverless functions have limits on request body size and execution time. Large video uploads may hit platform limits. If you expect large uploads, consider:
  - Uploading directly from client to the external API (signed URL) and avoid proxying through the serverless function.
  - Using an intermediate storage (S3/Cloud Storage) and processing with a container (Cloud Run / ECS) or background job.

- This repo currently converts WebM->MP4 in the browser, which helps keep server work minimal.

## GitHub Actions で自動デプロイ (オプション)

このリポジトリには `.github/workflows/vercel-deploy.yml` を追加済みです。プッシュ時に自動でビルドして Vercel にデプロイするには、以下のリポジトリシークレットを GitHub に設定してください:

- `VERCEL_TOKEN` — Vercel Personal Token
- `VERCEL_ORG_ID` — Vercel Organization ID
- `VERCEL_PROJECT_ID` — Vercel Project ID

Vercel のトークン/ID は Vercel ダッシュボードのプロジェクト設定やアカウント設定で取得できます。GitHub Actions は `main` または `master` ブランチへプッシュされたときに動作します。

注意: GitHub Actions からのデプロイでは、Vercel 側にも環境変数を設定しておく必要があります（プロジェクトの Environment variables）。

Optional: Add `vercel.json` to customize function memory and timeout (already included here).
