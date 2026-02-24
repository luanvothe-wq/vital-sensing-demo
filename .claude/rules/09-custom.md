---
description: Project-specific customizations (not overwritten on regeneration)
---

# Project Customizations

This file is for team-specific rules that won't be overwritten by preset updates.

## Infra
- Không sửa trực tiếp trong file `wrangler.jsonc`, mà sửa trong file `alchemy.run.ts`, file `wrangler.jsonc` được alchemy tạo ra.
- ref doc: https://alchemy.run/guides/cloudflare-nextjs.md

## Team Conventions

<!-- Define code review rules (reviewers, SLA, enforcement level) -->
<!-- Define branch/commit message conventions if more specific than standard -->
<!-- Define release checklist for demo/prod per internal process -->

## Product-Specific Rules

<!-- Vital score thresholds (excellent/good/fair/caution/check) — need adjustment? -->
<!-- Medical warning message display rules per local regulations -->
<!-- Required locales beyond `ja` and `en` -->

## External Integration Notes

<!-- Credential rotation policy for external vital API -->
<!-- Fallback policy when D1 is unavailable -->
<!-- Required environment variables per environment (local/demo/prod) -->

## Performance & Observability

<!-- KPIs to track: camera start time, analysis time, API failure rate -->
<!-- Log level rules for dev/staging/prod -->
<!-- Telemetry events for important state transitions -->

## Security & Compliance

<!-- Temporary video data handling rules (retention, deletion) -->
<!-- Sensitive data masking/anonymization rules in logs -->
<!-- Access control for team dashboard/reports -->

## Notes

- Keep content concise, action-oriented, avoid writing long documentation
- Major changes to this file should be reviewed by tech owner + product owner
