---
description: Vital Sensing Demo coding standards and conventions
---

# Coding Standards

## Terms & Definitions

| Term | Action |
|------|--------|
| `fix bug` | Reproduce → add guard → verify main flow + fallback |
| `refactor` | Improve structure, no behavior or API payload change |
| `optimize` | Measure first, prioritize camera/recording responsiveness |
| `harden` | Improve resilience to network/timeout/permission/external service failures |

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Route folders | lower-case kebab | `app/api/vital-sensing/` |
| React pages | route context name | `page.tsx`, `layout.tsx` |
| Shared libs | camelCase | `reportService.ts`, `online-doctor.ts` |
| Config files | tool defaults | `next.config.ts`, `eslint.config.mjs` |
| Migrations | numbered prefix | `0001_initial.sql` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Variables/functions | camelCase | `startCamera`, `sendToApi` |
| Types/interfaces | PascalCase | `VitalResult`, `TeamReport` |
| Constants | UPPER_SNAKE | `MOCK_PATTERNS`, `SHORT_ID_LENGTH` |
| Union states | string literal union | `type AppStep = "start" \| "camera" \| ...` |
| Theme palettes | PascalCase type + camelCase config | `ThemePalette`, `getThemeColors` |

## Architecture Layers

| Layer | Responsibility |
|-------|---------------|
| UI Flow | Display steps, animation, messages per state |
| Device/Media | Camera stream, recording, countdown, face alignment |
| Processing | Video conversion, call internal API, handle timeout/fallback |
| Data | Save/get reports via `lib/reportService.ts` + D1 |
| Integration | Proxy auth + forward video to external vital API |

## Do's

- ✅ Validate state transitions for each step (`start` → `camera` → `recording` → `analyzing` → `result`)
- ✅ Set explicit timeouts for network/heavy processing (API request, MP4 conversion, report fetch)
- ✅ Extract helpers when logic repeats or component grows too large
- ✅ Use TypeScript strict, avoid `any` unless absolutely necessary with clear reason
- ✅ Keep error messages user-friendly with fallback instead of crash
- ✅ Cleanup resources (`MediaStream`, intervals, animation frames) on unmount/reset
- ✅ Preserve response JSON contract of internal API routes
- ✅ Always proxy external API calls through `app/api/` routes

## Don'ts

- ❌ Don't hardcode credentials, tokens, or API keys in source
- ❌ Don't call external vital API directly from client UI
- ❌ Don't skip error handling paths when adding new integrations
- ❌ Don't add side effects to rendering path if hooks/callbacks can be used
- ❌ Don't block UI thread with synchronous heavy processing on browser
- ❌ Don't modify `TeamReport` shape without updating all dependent code

## Security Checklist

- [ ] No sensitive data (email/password/token) logged to console or response
- [ ] Required env vars validated before calling external service
- [ ] API routes restricted to expected HTTP methods (`POST`)
- [ ] Camera permission denial handled gracefully
- [ ] CORS/COEP/COOP headers not accidentally removed when editing config
- [ ] Raw video not persisted long-term without explicit requirement
