# AGENTS.md

## Project Overview

### Architecture

- **Pattern**: Frontend-first Next.js App Router with internal API route proxying to external vital sensing service
- **Rendering**: Client Component for main UI (camera, media stream, face detection, WebAssembly); Server for API routes
- **Data flow**: Camera → WebM recording → (optional MP4 convert) → `POST /api/vital-sensing` → external API → display results + save D1
- **Deployment**: Cloudflare Workers via OpenNext adapter + Alchemy IaC

### Tech Stack

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

### Project Structure

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

### Development Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Run local dev (migrate D1 + Alchemy dev)
npm run build                # Production build
npm run lint                 # ESLint check
npm run deploy               # Deploy to Cloudflare (demo stage)
npm run destroy              # Tear down Cloudflare resources
npm run db:migrate:local     # Apply D1 migrations locally
```

### API Contract (Internal)

#### POST /api/vital-sensing

- Request: `multipart/form-data` with field `file` (video blob)

##### Success
```json
{ "code": 200, "data": { "bpm": "75", "bpv1": "120", "bpv0": "75", "S2": "[97]", "LTv": "1.45" } }
```

##### Error
```json
{ "error": true, "message": "バイタルサインの分析に失敗しました" }
```

### Runtime Environment

| Scope | Variables |
|-------|-----------|
| API proxy | `API_BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD` |
| Alchemy | `ALCHEMY_PASSWORD` |

## Coding Standards

### Terms & Definitions

| Term | Action |
|------|--------|
| `fix bug` | Reproduce → add guard → verify main flow + fallback |
| `refactor` | Improve structure, no behavior or API payload change |
| `optimize` | Measure first, prioritize camera/recording responsiveness |
| `harden` | Improve resilience to network/timeout/permission/external service failures |

### Naming Conventions

#### Files

| Type | Convention | Example |
|------|------------|---------|
| Route folders | lower-case kebab | `app/api/vital-sensing/` |
| React pages | route context name | `page.tsx`, `layout.tsx` |
| Shared libs | camelCase | `reportService.ts`, `online-doctor.ts` |
| Config files | tool defaults | `next.config.ts`, `eslint.config.mjs` |
| Migrations | numbered prefix | `0001_initial.sql` |

#### Code

| Type | Convention | Example |
|------|------------|---------|
| Variables/functions | camelCase | `startCamera`, `sendToApi` |
| Types/interfaces | PascalCase | `VitalResult`, `TeamReport` |
| Constants | UPPER_SNAKE | `MOCK_PATTERNS`, `SHORT_ID_LENGTH` |
| Union states | string literal union | `type AppStep = "start" \| "camera" \| ...` |
| Theme palettes | PascalCase type + camelCase config | `ThemePalette`, `getThemeColors` |

### Architecture Layers

| Layer | Responsibility |
|-------|---------------|
| UI Flow | Display steps, animation, messages per state |
| Device/Media | Camera stream, recording, countdown, face alignment |
| Processing | Video conversion, call internal API, handle timeout/fallback |
| Data | Save/get reports via `lib/reportService.ts` + D1 |
| Integration | Proxy auth + forward video to external vital API |

### Do's

- ✅ Validate state transitions for each step (`start` → `camera` → `recording` → `analyzing` → `result`)
- ✅ Set explicit timeouts for network/heavy processing (API request, MP4 conversion, report fetch)
- ✅ Extract helpers when logic repeats or component grows too large
- ✅ Use TypeScript strict, avoid `any` unless absolutely necessary with clear reason
- ✅ Keep error messages user-friendly with fallback instead of crash
- ✅ Cleanup resources (`MediaStream`, intervals, animation frames) on unmount/reset
- ✅ Preserve response JSON contract of internal API routes
- ✅ Always proxy external API calls through `app/api/` routes

### Don'ts

- ❌ Don't hardcode credentials, tokens, or API keys in source
- ❌ Don't call external vital API directly from client UI
- ❌ Don't skip error handling paths when adding new integrations
- ❌ Don't add side effects to rendering path if hooks/callbacks can be used
- ❌ Don't block UI thread with synchronous heavy processing on browser
- ❌ Don't modify `TeamReport` shape without updating all dependent code

### Security Checklist

- [ ] No sensitive data (email/password/token) logged to console or response
- [ ] Required env vars validated before calling external service
- [ ] API routes restricted to expected HTTP methods (`POST`)
- [ ] Camera permission denial handled gracefully
- [ ] CORS/COEP/COOP headers not accidentally removed when editing config
- [ ] Raw video not persisted long-term without explicit requirement

## Frontend Guidelines

### Component & File Organization

- Extract large logic from `app/page.tsx` into feature modules: camera, analyze, result, team-report
- Prefer custom hooks for complex side effects (`useCamera`, `useFaceDetection`, `useTeamReports`)
- Keep `app/layout.tsx` minimal: metadata, root wrappers, global concerns only
- Shared utilities in `lib/` with clear APIs, no reverse dependency on UI

### State Management

- Use local state (`useState`, `useRef`, `useEffect`, `useCallback`) for real-time interaction
- Use finite-step state machine for `AppStep`; each transition requires explicit condition
- Separate transient vs persisted state:
  - **Transient**: camera stream, countdown, face status
  - **Persisted**: theme palette, language, team reports cache
- Long async operations always have loading/progress state + timeout fallback

### Styling & Theming

- **Design tone**: Clinical, gradient backgrounds, Noto Sans JP
- Use token/theme palette from `theme-palettes.ts` instead of hardcoding colors
- When adding new theme, update `theme-palettes.ts`, UI selector, and contrast text simultaneously
- Combine Tailwind utilities with scoped/global CSS consistently; avoid style conflicts

### Camera Flow UX Rules

- Always show guidance message per state (`loading`, `no-face`, `outside`, `inside`, `recording`)
- Start button enabled only when prerequisites are met (face detected, inside frame)
- If face tracking lost during recording: reset safely and explain reason clearly
- Results and errors must have back/reset button — never leave user in dead-end

### Performance

- Heavy imports (`face-api.js`, `@ffmpeg/ffmpeg`) via lazy/dynamic import
- Avoid unnecessary re-renders in detection loop; use `useRef` for mutable runtime values
- Limit UI update frequency for progress/countdown to reasonable rate
- Check memory leaks: stop tracks, clear intervals, cancel animation frames on reset/unmount

### Accessibility & i18n

- Maintain bilingual support (`ja`, `en`) for display text and error messages
- Interactive controls must have clear labels and appropriate tap targets for mobile
- Use semantic HTML for result/report sections
- Verify status colors (green/yellow/red) meet contrast requirements on both dark/light variants

### Data & API Interaction

- Frontend only calls internal `/api/vital-sensing`, never external URLs directly
- Always handle 3 outcome groups: success, API failure, timeout/interruption
- When changing payload/result shape, update `VitalResult` type and render cards simultaneously

## Backend Guidelines

### API Route Pattern

- All routes in `app/api/` using Next.js Route Handlers
- Thin route handlers: delegate business logic to `lib/` modules
- Response format: `{ code: 200, data: {...} }` for success, `{ error: true, message: "..." }` for error
- Set `runtime = "nodejs"` explicitly for routes needing Node.js APIs

### External API Integration (lib/online-doctor.ts)

- **Auth flow**: Login with email/password → get access token → use Bearer token for API calls
- **Timeouts**: 30s for login, 60s for vital analysis
- **Error handling**: Strict — no silent fallbacks, throw with descriptive message
- **FormData**: Never set Content-Type manually; let fetch set `multipart/form-data` with boundary automatically
- **Logging**: Log request/response for debugging, but mask sensitive data (tokens truncated)

### D1 Database (lib/reportService.ts)

- All functions receive `db: D1Database` as parameter (no module-level side effects)
- Table: `vital_reports` with auto-increment ID + 4-digit short ID
- Short ID generation: random + uniqueness check (max 10 attempts) + timestamp fallback
- Migrations in `migrations/` folder, applied via Wrangler

#### Key Operations

| Operation | Function |
|-----------|----------|
| Save report | `saveReport(db, data)` → `{ id, shortId }` |
| Get all reports | `getAllReports(db)` → `TeamReport[]` (newest first, limit 100) |

### Validation

- Check required form fields (e.g., `file` in vital-sensing route)
- Validate env vars (`LOGIN_EMAIL`, `LOGIN_PASSWORD`) before calling external service
- Return appropriate HTTP status codes: 400 (bad request), 502 (upstream error), 500 (unexpected)

### Error Handling

- Wrap external API calls in try/catch
- Log detailed error server-side (`console.error`)
- Return generic user-friendly message to client (never expose internal details)
- Distinguish business errors (API response code ≥ 400) from HTTP errors

### Deployment

- Cloudflare Workers via OpenNext + Alchemy
- D1 bindings configured in `alchemy.run.ts` and `wrangler.jsonc`
- Secrets managed via Alchemy (`alchemy.secret.env.*`)
- Deploy: `npm run deploy` | Destroy: `npm run destroy`

## Project Customizations

This file is for team-specific rules that won't be overwritten by preset updates.

### Team Conventions

<!-- Define code review rules (reviewers, SLA, enforcement level) -->
<!-- Define branch/commit message conventions if more specific than standard -->
<!-- Define release checklist for demo/prod per internal process -->

### Product-Specific Rules

<!-- Vital score thresholds (excellent/good/fair/caution/check) — need adjustment? -->
<!-- Medical warning message display rules per local regulations -->
<!-- Required locales beyond `ja` and `en` -->

### External Integration Notes

<!-- Credential rotation policy for external vital API -->
<!-- Fallback policy when D1 is unavailable -->
<!-- Required environment variables per environment (local/demo/prod) -->

### Performance & Observability

<!-- KPIs to track: camera start time, analysis time, API failure rate -->
<!-- Log level rules for dev/staging/prod -->
<!-- Telemetry events for important state transitions -->

### Security & Compliance

<!-- Temporary video data handling rules (retention, deletion) -->
<!-- Sensitive data masking/anonymization rules in logs -->
<!-- Access control for team dashboard/reports -->

### Notes

- Keep content concise, action-oriented, avoid writing long documentation
- Major changes to this file should be reviewed by tech owner + product owner

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

