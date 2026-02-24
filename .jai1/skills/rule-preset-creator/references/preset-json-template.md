# preset.json Template

Use this template when generating `preset.json` for a new preset.

## Schema

```json
{
  "slug": "<preset-slug>",
  "name": "<Human Readable Name>",
  "description": "Rules for <tech stack> projects with <key features>",
  "version": "1.0.0",
  "tags": ["<stack-type>", "<optional-tags>"],

  "stack": {
    "frontend": "<framework version or null>",
    "backend": "<framework version or null>",
    "mobile": "<framework or null>",
    "desktop": "<framework or null>",
    "css": "<CSS framework or null>",
    "database": "<database or null>",
    "language": "<primary language>",
    "runtime": "<runtime version or null>"
  },

  "files": {
    "required": ["01-project.md", "02-standards.md"],
    "optional": ["<03-06 files based on stack>"],
    "template": ["09-custom.md"]
  },

  "output": {
    "agentsMd": true,
    "ideFolder": ".cursor/rules"
  }
}
```

## Field Guidelines

### slug
- Kebab-case identifier
- Must match directory name
- Pattern: `<framework>-<variant>` (e.g., `laravel-api`, `nextjs-tw4-shadcn`)

### name
- Human readable, title case
- Include main technologies

### description
- Start with "Rules for..."
- Include framework versions
- Mention key features (2-3 max)

### tags
First tag is stack type: `frontend`, `backend`, `fullstack`, `monorepo`, `mobile`, `desktop`, `cli`, `docs`, `bot`

Additional tags:
- `api` - API-focused backend
- `spa` - Single page app
- `ssr` - Server-side rendering

### stack
Set to `null` for non-applicable fields:

| Stack Type | frontend | backend | mobile | desktop |
|------------|----------|---------|--------|---------|
| frontend | value | null | null | null |
| backend | null | value | null | null |
| fullstack | value | value | null | null |
| mobile | null | null | value | null |
| monorepo | varies | varies | null | null |

### files
Based on stack type:

| Type | Required Files |
|------|---------------|
| frontend | 01, 02, 03-frontend, 09 |
| backend | 01, 02, 04-backend, 09 |
| fullstack | 01, 02, 03, 04, 09 |
| monorepo | 01, 02, 03-workspace, 09 |
| docs | 01, 02, 03-content, 09 |

## Examples

### Frontend Preset
```json
{
  "slug": "react-vite-zustand",
  "name": "React + Vite + Zustand",
  "description": "Rules for React 19 SPA with Vite, Zustand state management, and Tailwind CSS",
  "version": "1.0.0",
  "tags": ["frontend", "spa"],
  "stack": {
    "frontend": "React 19 + Vite",
    "backend": null,
    "css": "Tailwind CSS v4",
    "database": null,
    "language": "TypeScript"
  },
  "files": {
    "required": ["01-project.md", "02-standards.md", "03-frontend.md"],
    "optional": ["05-testing.md"],
    "template": ["09-custom.md"]
  },
  "output": {
    "agentsMd": true,
    "ideFolder": ".cursor/rules"
  }
}
```

### Backend Preset
```json
{
  "slug": "fastapi-postgres",
  "name": "FastAPI + PostgreSQL",
  "description": "Rules for FastAPI REST API with PostgreSQL, SQLAlchemy, and Pydantic v2",
  "version": "1.0.0",
  "tags": ["backend", "api"],
  "stack": {
    "frontend": null,
    "backend": "FastAPI 0.115+",
    "css": null,
    "database": "PostgreSQL 16+",
    "language": "Python 3.12+"
  },
  "files": {
    "required": ["01-project.md", "02-standards.md", "04-backend.md"],
    "optional": ["05-testing.md"],
    "template": ["09-custom.md"]
  },
  "output": {
    "agentsMd": true,
    "ideFolder": ".cursor/rules"
  }
}
```

### Monorepo Preset
```json
{
  "slug": "monorepo-nextjs-nestjs",
  "name": "Monorepo: Next.js + NestJS",
  "description": "Rules for pnpm monorepo with Next.js frontend and NestJS backend",
  "version": "1.0.0",
  "tags": ["fullstack", "monorepo"],
  "stack": {
    "frontend": "Next.js 16",
    "backend": "NestJS 11",
    "css": "Tailwind CSS v4",
    "database": "PostgreSQL",
    "language": "TypeScript",
    "runtime": "Node 22"
  },
  "files": {
    "required": ["01-project.md", "02-standards.md", "03-workspace.md"],
    "optional": ["04-api.md", "05-web.md", "07-shared.md", "08-testing.md"],
    "template": ["09-custom.md"]
  },
  "output": {
    "agentsMd": true,
    "ideFolder": ".cursor/rules"
  }
}
```

### Monorepo Complex (Multiple Apps)
```json
{
  "slug": "monorepo-saas-platform",
  "name": "Monorepo: SaaS Platform",
  "description": "Rules for pnpm monorepo with multiple apps (api, web, mobile) and shared packages",
  "version":": "1.0.0",
  "tags": ["fullstack", "monorepo"],
  "stack": {
    "frontend": "Next.js 16 + React Native",
    "backend": "NestJS 11",
    "mobile": "React Native 0.75",
    "css": "Tailwind CSS v4",
    "database": "PostgreSQL + Redis",
    "language": "TypeScript",
    "runtime": "Node 22"
  },
  "files": {
    "required": ["01-project.md", "02-standards.md", "03-workspace.md"],
    "optional": [
      "04-api.md",
      "05-web.md",
      "06-mobile.md",
      "07-shared.md",
      "08-testing.md"
    ],
    "template": ["09-custom.md"]
  },
  "output": {
    "agentsMd": true,
    "ideFolder": ".cursor/rules"
  }
}
```

## Output Path

Output path luôn là `.jai1/rule-preset/` (files trực tiếp, không có subfolder):

```
.jai1/rule-preset/
├── preset.json
├── 01-project.md
├── 02-standards.md
├── 03-frontend.md
└── 09-custom.md
```
