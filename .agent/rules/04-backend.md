---
trigger: always_on
---

# Backend Guidelines

## API Route Pattern

- All routes in `app/api/` using Next.js Route Handlers
- Thin route handlers: delegate business logic to `lib/` modules
- Response format: `{ code: 200, data: {...} }` for success, `{ error: true, message: "..." }` for error
- Set `runtime = "nodejs"` explicitly for routes needing Node.js APIs

## External API Integration (lib/online-doctor.ts)

- **Auth flow**: Login with email/password → get access token → use Bearer token for API calls
- **Timeouts**: 30s for login, 60s for vital analysis
- **Error handling**: Strict — no silent fallbacks, throw with descriptive message
- **FormData**: Never set Content-Type manually; let fetch set `multipart/form-data` with boundary automatically
- **Logging**: Log request/response for debugging, but mask sensitive data (tokens truncated)

## D1 Database (lib/reportService.ts)

- All functions receive `db: D1Database` as parameter (no module-level side effects)
- Table: `vital_reports` with auto-increment ID + 4-digit short ID
- Short ID generation: random + uniqueness check (max 10 attempts) + timestamp fallback
- Migrations in `migrations/` folder, applied via Wrangler

### Key Operations

| Operation | Function |
|-----------|----------|
| Save report | `saveReport(db, data)` → `{ id, shortId }` |
| Get all reports | `getAllReports(db)` → `TeamReport[]` (newest first, limit 100) |

## Validation

- Check required form fields (e.g., `file` in vital-sensing route)
- Validate env vars (`LOGIN_EMAIL`, `LOGIN_PASSWORD`) before calling external service
- Return appropriate HTTP status codes: 400 (bad request), 502 (upstream error), 500 (unexpected)

## Error Handling

- Wrap external API calls in try/catch
- Log detailed error server-side (`console.error`)
- Return generic user-friendly message to client (never expose internal details)
- Distinguish business errors (API response code ≥ 400) from HTTP errors

## Deployment

- Cloudflare Workers via OpenNext + Alchemy
- D1 bindings configured in `alchemy.run.ts` and `wrangler.jsonc`
- Secrets managed via Alchemy (`alchemy.secret.env.*`)
- Deploy: `npm run deploy` | Destroy: `npm run destroy`
