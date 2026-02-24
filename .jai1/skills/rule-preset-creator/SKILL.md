---
name: rule-preset-creator
description: "Analyze codebase architecture and generate rule-presets for AI agents. Use when creating new rule-presets for existing projects, when user wants to generate AI coding rules for their codebase, or when analyzing project structure to create custom AI agent guidelines. Supports all stack types: frontend, backend, fullstack, monorepo, mobile, desktop, cli, docs, bot."
---

# Rule Preset Creator

Generate rule-presets by analyzing codebase architecture and tech stack.

## Workflow

```
1. Analyze Codebase  →  2. Detect Stack  →  3. Generate Files  →  4. Review
```

## Step 1: Analyze Codebase

### 1.1 Get Directory Structure

```bash
find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/vendor/*' -maxdepth 3
```

### 1.2 Check Config Files

| Stack | Config Files |
|-------|--------------|
| JS/TS | `package.json`, `tsconfig.json` |
| PHP | `composer.json`, `artisan` |
| Python | `pyproject.toml`, `requirements.txt` |
| Monorepo | `pnpm-workspace.yaml`, `turbo.json`, `nx.json` |

### 1.3 For Monorepo: Scan apps/ & packages/

```bash
ls -la apps/ packages/ 2>/dev/null
cat apps/*/package.json packages/*/package.json 2>/dev/null
```

## Step 2: Detect Stack Type

| Stack | Indicators | Files to Generate |
|-------|------------|-------------------|
| **frontend** | React/Vue/Next/Nuxt, no backend | 01, 02, 03-frontend, 09 |
| **backend** | Express/NestJS/Laravel/FastAPI | 01, 02, 04-backend, 09 |
| **fullstack** | Both frontend + backend | 01, 02, 03, 04, 09 |
| **monorepo** | pnpm-workspace, apps/ + packages/ | 01, 02, 03-workspace, 04-08, 09 |
| **cli** | bin/, Commander/yargs | 01, 02, 09 |
| **docs** | VitePress/Docusaurus | 01, 02, 03-content, 09 |
| **bot** | Discord.js/Telegraf | 01, 02, 04, 09 |

## Step 3: Determine Output Path

Output path: `.jai1/rule-preset/` (files trực tiếp, không có subfolder)

## Step 4: Generate Files

### Core Principle: Simple & Focused

Mỗi file tập trung vào:
- **Architecture** - Patterns, layers
- **Structure** - Directory layout
- **Standards & Conventions** - Naming, do's/don'ts

**KHÔNG include:**
- Full code implementations
- Detailed API documentation
- Step-by-step tutorials

### File Requirements by Stack Type

#### Standard Project (frontend/backend/fullstack)

| File | Content Focus |
|------|---------------|
| **01-project.md** | Overview, tech stack table, structure tree, commands |
| **02-standards.md** | Naming conventions table, architecture layers, do's/don'ts |
| **03-frontend.md** | Component patterns, state management, styling approach |
| **04-backend.md** | Controller/service patterns, validation, auth approach |
| **09-custom.md** | Template for team-specific rules |

#### Monorepo Project

| File | Content Focus |
|------|---------------|
| **01-project.md** | Workspace structure table (all apps/packages) |
| **02-standards.md** | Shared conventions across workspace |
| **03-workspace.md** | pnpm/turborepo config, cross-package deps |
| **04-08** | Per-app/package: Stack + Structure + Conventions |
| **09-custom.md** | Template |

### Tiêu Chuẩn Cho Mỗi App/Package (Monorepo)

Mỗi app/package PHẢI có đủ 3 phần:

**1. Technical Stack** (table)
```markdown
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 |
| Language | TypeScript |
```

**2. Structure** (tree)
```markdown
```
src/
├── components/  # UI components
├── lib/         # Utilities
└── app/         # Routes
```
```

**3. Coding Standards & Conventions**
```markdown
### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx` |

### Do's / Don'ts
- ✅ Use server components by default
- ❌ Don't use `any` type
```

### Nguyên Tắc Chọn Files

**Tối thiểu hóa số files** - Chỉ tạo files thực sự cần thiết:

| Project Type | Minimum Files | Add If Needed |
|--------------|---------------|---------------|
| Simple frontend | 01, 02, 09 | 03 if complex |
| Simple backend | 01, 02, 09 | 04 if complex |
| Fullstack | 01, 02, 03, 04, 09 | - |
| Small monorepo | 01, 02, 03-workspace, 07-shared, 09 | 04-06 if apps differ |
| Large monorepo | All 01-09 | - |

**Gom nhóm linh hoạt:**
- 2+ apps cùng stack → gom 1 file (e.g., `05-frontend-apps.md`)
- Packages nhỏ → gom vào `07-shared.md`
- Chỉ tách riêng khi stack khác biệt đáng kể

## Step 5: Review Checklist

- [ ] Output path đúng
- [ ] Files đơn giản, tập trung (50-150 lines mỗi file)
- [ ] Dùng tables cho conventions, bullets cho patterns
- [ ] Không có full code implementations
- [ ] Không trùng lặp giữa files
- [ ] Monorepo: mỗi app/package có Stack + Structure + Conventions

## Resources

- `references/preset-json-template.md` - preset.json schema
- `references/rule-file-templates.md` - File templates
- `references/stack-detection-patterns.md` - Detection patterns
- `scripts/analyze-codebase.py` - Analysis script
