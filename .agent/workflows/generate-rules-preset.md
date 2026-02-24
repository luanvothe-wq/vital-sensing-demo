---
trigger: always_on
---

# Generate Rules Preset

Create rule preset files for AI coding assistants by analyzing project codebase. Uses `skill:rule-preset-creator` for intelligent generation following PRESET-STANDARD.

## ⚠️ CRITICAL RULES

1. **Skill required** - Use `skill:rule-preset-creator` for analysis and generation
2. **PRESET-STANDARD** - Read `rule-presets/PRESET-STANDARD.md` before generating
3. **Output location** - Files go to `.jai1/rule-preset/`
4. **Sync required** - Run `j rules apply` after generation
5. **No full code** - Rules are guidance, not documentation (50-150 lines per file)

---

## 🎯 WORKFLOW OVERVIEW

```
Detect input sources
       ↓
  Has source code?
   ├── YES → Load skill → Analyze codebase → Detect stack
   └── NO  → Interactive Setup (batch questions)
                    ↓
       User confirms stack & files
                    ↓
             Generate rule files
                    ↓
          Save to .jai1/rule-preset/
                    ↓
               Sync to IDEs
```

---

## 📋 PHASES

### Phase 0: Prerequisites Check

**Step 0.1: Detect Input Sources**

Scan project for available input sources:

| Source | Files to Check | Priority |
|--------|---------------|----------|
| **Config files** | `package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml` | Primary |
| **Framework configs** | `next.config.*`, `nuxt.config.*`, `vite.config.*`, `angular.json` | Primary |
| **Monorepo indicators** | `pnpm-workspace.yaml`, `turbo.json`, `nx.json` | Primary |
| **Project docs** | `docs/README.md`, `docs/ARCHITECTURE.md` | Optional supplement |
| **Source code** | `src/`, `app/`, `apps/`, `packages/` | For pattern detection |

**Decision Table**:

| Condition | Action |
|-----------|--------|
| Config files found | Continue to Phase 1 |
| Only docs found | Continue to Phase 1 (docs-only mode) |
| Nothing found | Go to **Phase 0.5: Interactive Setup** |

**Step 0.2: Check Existing Preset**

```
Check: .jai1/rule-preset/ exists with files?
- YES → Ask: "Regenerate?" (will overwrite, except 09-custom.md)
- NO  → Fresh generation
```

---

### Phase 0.5: Interactive Setup (Empty Directory)

Khi không detect được source code, sử dụng `skill:rule-preset-from-survey` để thu thập thông tin dự án qua khảo sát.

**Step 0.5.1:** Hỏi permission:

```
📋 Không tìm thấy source code trong thư mục hiện tại.
Bạn muốn khởi tạo rules bằng cách trả lời khảo sát không? [Y/n]
```

- `Y` → Load `skill:rule-preset-from-survey` và thực hiện survey theo hướng dẫn trong skill
- `n` → STOP workflow

**Step 0.5.2:** Sau khi skill hoàn tất survey và user xác nhận → chuyển sang **Phase 2 Step 2.2** (SKIP Phase 1).

> **Note**: Dữ liệu stack được lấy từ câu trả lời khảo sát thay vì codebase scan. Phase 1 được SKIP vì không có source code để analyze.

---

### Phase 1: Load Skill & Analyze

**Step 1.1: Load Skill**

Use `skill:rule-preset-creator` which handles:
- Codebase directory structure analysis
- Config file detection (see skill's `references/stack-detection-patterns.md`)
- Dependency parsing
- Monorepo scanning (`apps/`, `packages/`)

**Step 1.2: Read PRESET-STANDARD**

Read `rule-presets/PRESET-STANDARD.md` for:
- File naming conventions (01-09)
- Stack type → required files mapping
- Content guidelines (guidance over documentation)
- Line limits per file (50-150 lines, total < 500)

**Step 1.3: Supplement with Docs (if available)**

If `docs/README.md` or `docs/ARCHITECTURE.md` exist, read them to enrich context:
- Project overview from README
- Architecture decisions from ARCHITECTURE
- These supplement codebase scan, NOT replace it

---

### Phase 2: Stack Detection & User Confirmation

**Step 2.1: Present Detection Results**

Output detected stack for user review:

```
🔍 Detected Stack

TYPE: <detected stack type>

FRAMEWORK
  ✓ Next.js 16 (app router detected)
  ✓ React 19

STYLING
  ✓ Tailwind CSS v4 + shadcn/ui

DATABASE
  ✓ Prisma (PostgreSQL)

TOOLING
  ✓ TypeScript 5.x

PATTERNS
  • Structure: Feature-based (src/features/*)
  • Components: Functional + custom hooks
  • Naming: kebab-case files, PascalCase components
```

For **monorepo**, also show workspace scan:

```
WORKSPACE
  apps/api     → NestJS 11 (backend)
  apps/web     → Next.js 16 (frontend)
  packages/ui  → React component library
  packages/utils → Shared utilities
```

**Step 2.2: Determine Files to Generate**

Based on stack type, propose files (from PRESET-STANDARD):

| Stack Type | Proposed Files |
|------------|---------------|
| frontend | 01-project, 02-standards, 03-frontend, 09-custom |
| backend | 01-project, 02-standards, 04-backend, 09-custom |
| fullstack | 01-project, 02-standards, 03-frontend, 04-backend, 09-custom |
| monorepo | 01-project, 02-standards, 03-workspace, 04-08 (per app), 09-custom |
| cli | 01-project, 02-standards, 09-custom |
| docs | 01-project, 02-standards, 03-content, 09-custom |
| bot | 01-project, 02-standards, 04-backend, 09-custom |
| mobile | 01-project, 02-standards, 03-frontend, 09-custom |
| desktop | 01-project, 02-standards, 03-frontend, 09-custom |

**Step 2.3: User Confirmation**

```
📋 Will generate files:
  01-project.md    (~80-120 lines)  Project overview
  02-standards.md  (~60-100 lines)  Coding standards
  03-frontend.md   (~50-80 lines)   Frontend guidelines
  09-custom.md     (~40-60 lines)   Template for customization

Proceed? [Y/n/edit]:
```

- `Y` → Continue to Phase 3
- `n` → Cancel
- `edit` → User can adjust stack type, add/remove files

---

### Phase 3: Generate Files

**Step 3.1: Generate Following Skill Templates**

Use `skill:rule-preset-creator` references:
- `references/rule-file-templates.md` — File templates per type
- `references/preset-json-template.md` — preset.json schema

**Content Constraints** (from PRESET-STANDARD):

| Constraint | Limit |
|------------|-------|
| Lines per file | 50-150 |
| Total lines (all files) | < 500 (monorepo: < 700) |
| Code examples | 2-5 lines max, pattern signatures only |
| Format | Tables for conventions, bullets for patterns |
| Duplication | Each info in ONE file only |

**Step 3.2: Monorepo Extra Requirements**

If stack type is monorepo, each app/package file (04-08) MUST have:

1. **Technical Stack** (table)
2. **Structure** (directory tree)
3. **Coding Standards & Conventions** (naming table + patterns + do's/don'ts)

Grouping rules:
- Same stack apps → combine in 1 file
- Different stack apps → separate files
- Small packages → combine in `07-shared.md`

---

### Phase 4: Save & Sync

**Step 4.1: Ensure Directory**

Create `.jai1/rule-preset/` if not exists.

**Step 4.2: Save Each File**

For each generated file:
- Save to `.jai1/rule-preset/<filename>`
- Do NOT overwrite `09-custom.md` if it already exists (user customizations)

**Step 4.3: Create preset.json**

Create `.jai1/rule-preset/preset.json`:

```json
{
  "name": "<projectName>",
  "version": "1.0.0",
  "description": "Rules for <tech stack> project",
  "tags": ["<stackType>"],
  "stack": {
    "frontend": "<framework or null>",
    "backend": "<framework or null>",
    "css": "<css framework or null>",
    "database": "<database or null>",
    "language": "<primary language>",
    "runtime": "<runtime or null>"
  },
  "files": {
    "required": ["01-project.md", "02-standards.md"],
    "optional": ["<detected optional files>"],
    "template": ["09-custom.md"]
  }
}
```

**Step 4.4: Sync to IDEs**

```bash
j rules apply
```

---

### Phase 5: Report

**Step 5.1: Output Summary**

```markdown
## ✅ Rule Preset Generated

**Project**: <projectName>
**Stack Type**: <stackType>
**Date**: <current date>

### Files Generated
| File | Lines | Purpose |
|------|-------|---------|
| 01-project.md | 80 | Project overview and structure |
| 02-standards.md | 60 | Coding standards |
| 03-frontend.md | 70 | Frontend guidelines |
| 09-custom.md | 40 | Template for customization |

**Total**: <totalLines> lines

### Next Steps
1. Review generated rules in `.jai1/rule-preset/`
2. Customize `09-custom.md` for project-specific needs
3. Re-run `j rules apply` after any changes
```

---

## 🔄 REGENERATE MODE

When rule-preset already exists:

**Step R.1: Detect Existing**
```
Check: .jai1/rule-preset/preset.json exists?
- YES → Ask: "Regenerate?" (will overwrite except 09-custom.md)
- NO  → Fresh generation
```

**Step R.2: Backup (Optional)**
If regenerating, backup existing files to `.jai1/rule-preset-backup/`

---

## ✅ QUALITY CHECKLIST

- [ ] Codebase analyzed (config files + source)
- [ ] Stack type correctly detected
- [ ] PRESET-STANDARD.md read before generation
- [ ] Files follow skill templates (rule-file-templates.md)
- [ ] Each file 50-150 lines, total < 500
- [ ] No full code implementations
- [ ] No duplication between files
- [ ] All files saved to .jai1/rule-preset/
- [ ] preset.json created
- [ ] `j rules apply` executed
- [ ] 09-custom.md preserved if existed
- [ ] Summary displayed
