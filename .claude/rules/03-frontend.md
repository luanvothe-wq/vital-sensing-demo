---
description: Vital Sensing Demo frontend development rules
---

# Frontend Guidelines

## Component & File Organization

- Extract large logic from `app/page.tsx` into feature modules: camera, analyze, result, team-report
- Prefer custom hooks for complex side effects (`useCamera`, `useFaceDetection`, `useTeamReports`)
- Keep `app/layout.tsx` minimal: metadata, root wrappers, global concerns only
- Shared utilities in `lib/` with clear APIs, no reverse dependency on UI

## State Management

- Use local state (`useState`, `useRef`, `useEffect`, `useCallback`) for real-time interaction
- Use finite-step state machine for `AppStep`; each transition requires explicit condition
- Separate transient vs persisted state:
  - **Transient**: camera stream, countdown, face status
  - **Persisted**: theme palette, language, team reports cache
- Long async operations always have loading/progress state + timeout fallback

## Styling & Theming

- **Design tone**: Clinical, gradient backgrounds, Noto Sans JP
- Use token/theme palette from `theme-palettes.ts` instead of hardcoding colors
- When adding new theme, update `theme-palettes.ts`, UI selector, and contrast text simultaneously
- Combine Tailwind utilities with scoped/global CSS consistently; avoid style conflicts

## Camera Flow UX Rules

- Always show guidance message per state (`loading`, `no-face`, `outside`, `inside`, `recording`)
- Start button enabled only when prerequisites are met (face detected, inside frame)
- If face tracking lost during recording: reset safely and explain reason clearly
- Results and errors must have back/reset button — never leave user in dead-end

## Performance

- Heavy imports (`face-api.js`, `@ffmpeg/ffmpeg`) via lazy/dynamic import
- Avoid unnecessary re-renders in detection loop; use `useRef` for mutable runtime values
- Limit UI update frequency for progress/countdown to reasonable rate
- Check memory leaks: stop tracks, clear intervals, cancel animation frames on reset/unmount

## Accessibility & i18n

- Maintain bilingual support (`ja`, `en`) for display text and error messages
- Interactive controls must have clear labels and appropriate tap targets for mobile
- Use semantic HTML for result/report sections
- Verify status colors (green/yellow/red) meet contrast requirements on both dark/light variants

## Data & API Interaction

- Frontend only calls internal `/api/vital-sensing`, never external URLs directly
- Always handle 3 outcome groups: success, API failure, timeout/interruption
- When changing payload/result shape, update `VitalResult` type and render cards simultaneously
