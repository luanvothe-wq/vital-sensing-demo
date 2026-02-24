# gen-all-features-doc

> Tạo tài liệu chức năng (FRD/TDD) cho TOÀN BỘ features trong dự án có sẵn.

**Goal**: Create comprehensive Functional Requirements (FRD) and Technical Design (TDD) documentation.
**Mechanism**: State-Aware with **Auto Project Type Detection**. Uses `j t` CLI for task management and progress tracking.
**Resumable**: Check `j t list -s in_progress -P docs/*` → resume from incomplete task.

## ⚠️ CRITICAL RULES

1. ✅ **Extract from actual code only** - No assumptions or suggestions.
2. ✅ **Include paths** - Routes/endpoints/components with file references.
3. ✅ **Verify completeness** - Check all features documented.
4. ✅ **TDD quality** - Match complexity to feature (Simple/Medium/Complex).
5. ✅ **Language** - Use **Vietnamese** for all content (except code/technical terms).
6. ✅ **Checkpoint after each task** - Run `j t done <id>` after each task completed.
7. ✅ **Resume first** - Always check `j t list -s in_progress -P docs/*` before starting.
9. ✅ **Priority order** - `j t ready` returns tasks sorted by priority (p1 highest). Always pick highest-priority ready task first.

---

## 🔍 Project Type Detection

### Step 0: Auto-Detect Project Type

**ACTIONS** (Before Step 1):
1. Check project configuration files to determine type
2. Select appropriate templates and scan targets

### Detection Matrix

| Check | Indicators | Type | Template Set |
|-------|------------|------|--------------|
| **Backend-PHP** | `composer.json` + `routes/api.php` or `app/Http/Controllers/` | Laravel/CakePHP | Backend |
| **Backend-Node** | `nest-cli.json` or `src/controllers/` with Express patterns | NestJS/Express | Backend |
| **Frontend-React** | `package.json` with `next` or `react` + `pages/` or `app/` | Next.js/React | Frontend |
| **Frontend-Vue** | `package.json` with `nuxt` or `vue` + `pages/` or `src/views/` | Nuxt/Vue | Frontend |
| **Monorepo** | `pnpm-workspace.yaml` or `lerna.json` or `packages/` folder | Monorepo | Per-package |
| **Fullstack** | Both Backend + Frontend indicators found | Fullstack | Both |
| **Static/jQuery** | `.html` files + `<script>` tags with jQuery | Legacy Frontend | Frontend-simple |

### Template Selection

| Project Type | FRD Template | TDD Template | Scan Targets |
|--------------|--------------|--------------|--------------|
| **Backend-only** | `FRD-backend.template.md` | `TDD-backend.template.md` | routes, controllers, models, services |
| **Frontend-only** | `FRD-frontend.template.md` | `TDD-frontend.template.md` | pages, components, hooks, stores |
| **Fullstack/Mixed** | `FRD-fullstack.template.md` | `TDD-fullstack.template.md` | All targets (backend + frontend) |
| **Monorepo** | Detect per package | Detect per package | Each package separately |

### TDD Complexity Guide

**For Backend:**
| Level | Criteria | Sections |
|-------|----------|----------|
| **Simple** | Basic CRUD (3-5 operations) | 1-5 only |
| **Medium** | Standard operations + business rules | 1-6 |
| **Complex** | Multi-step workflows + complex logic | 1-8 |

**For Frontend:**
| Level | Criteria | Sections |
|-------|----------|----------|
| **Simple** | Basic UI rendering + simple state | 1-4 only |
| **Medium** | Form handling + API integration | 1-6 |
| **Complex** | Complex state management + multi-step flows | 1-8 |

---

## 🔄 Workflow Logic

### Step 1: Check Resume State

**ACTION**: Check `j t list -s in_progress -P docs/*`

**IF in_progress tasks found**:
1. Read task details: `j t show <id>`
2. Resume from that task's phase/step

**IF no in_progress but todo tasks exist**:
1. Check: `j t ready -P docs/*`
2. Pick next (highest priority): `j t pick`
3. Resume from Step 3 (Execution Loop)

**IF no tasks at all** → Continue to Step 2

---

### Step 2: Analyze & Register Tasks (Planning Phase)

1. **Detect Project Type**: Use Detection Matrix above → Determine type → Set template set.
2. **Check Business Documentation**: Find existing docs → If NOT FOUND → **FALLBACK**: Extract from code.
3. **Analyze Project Structure**: 
   - **Backend**: Scan `routes/`, `controllers/`, `models/`, `services/`
   - **Frontend**: Scan `pages/`, `components/`, `hooks/`, `stores/`, `src/views/`
   - **Monorepo**: Iterate through `packages/*/` and detect each package type
4. **Register tasks via CLI** — one task per feature, grouped by feature with docs as FRD → TDD → TEST:

   > ⚠️ Follow `skill:tasks-creator` conventions for task naming

   ```bash
   # For each detected feature:
   j t add "Create FRD-[feature-name].md" -p 1 -P docs/[feature-name]
   j t add "Create TDD-[feature-name].md" -p 2 -P docs/[feature-name]
   j t add "Create TEST-[feature-name].md" -p 3 -P docs/[feature-name]
   ```
5. **Set dependencies** per feature (FRD → TDD → TEST):
   ```bash
   j t dep T-002 T-001   # TDD waits for FRD
   j t dep T-003 T-002   # TEST waits for TDD
   ```

> ℹ️ `j t ready` returns tasks sorted by priority (p1 = highest). `j t pick` picks the highest-priority ready task.

**Auto-Transition**: Do NOT stop. Immediately proceed to **Step 3**.

---

### Step 3: Execution Loop (The Engine)

**LOOP**: `j t ready -P docs/*` → implement each (highest priority first):

1. **Pick task**: `j t pick` (auto-picks highest-priority ready task, sets in_progress)
2. **Read task details**: `j t show <id>` → identify task type (FRD, TDD, or TEST) and Feature Name
3. **IF no ready tasks**: Stop. Output "All features documented." → Go to Step 4

4. **Analyze Feature Complexity**:
   - Simple: Basic CRUD, single entity, no complex logic
   - Medium: Multiple entities, business logic, permissions
   - Complex: Workflows, integrations, security requirements

5. **Generate Documentation (with Conditional Sections)**:
   
   **For each section in template:**
   - Read the `[CONDITIONAL]` markers
   - Check INCLUDE IF / SKIP IF conditions
   - **IF SKIP IF matches** → Omit section entirely (don't create empty section)
   - **IF INCLUDE IF matches** → Generate content from code
   
   **Section Skip Rules:**
   | Section | Skip If |
   |---------|---------|
   | ERD / Data Model | Feature không tạo/modify database |
   | Roles & Permissions | Không có auth/permission logic |
   | Business Rules | Simple CRUD, không có rules đặc biệt |
   | NFR | Standard requirements, không có metrics đặc biệt |
   | Process Flow | Single-step action |
   | Security & Performance | Simple/Medium complexity |
   | Edge Cases (Test) | Không có boundary conditions |
   | Integration Tests | Standalone feature |

6. **Checkpoint**: `j t done <id>`
   - *Why?* This saves progress. If the agent crashes now, the next run skips this task.

7. **Repeat**:
   - Go back to sub-step 1 of Step 3.
   - Continue until no ready tasks remain.

---

### Step 4: Completion Report

**Verify all tasks done**: `j t list -P docs/*` → all should be ✅

**OUTPUT**:
```
✅ All Features Documentation Complete

📊 Summary:
- Project Type: [detected]
- Framework: [detected]
- Features documented: [X]
- Total tasks completed: `j t list -P docs/* -s done`

🔗 Next Steps:
- Review docs in `docs/features/`
- Run `/gen-project-overview` for project overview docs
```

---

## 📝 Documentation Templates & Guidelines

### Templates Location

All templates are located in `.jai1/templates/feature-docs/`:

| Document | Backend Template | Frontend Template |
|----------|------------------|-------------------|
| FRD | `FRD-backend.template.md` | `FRD-frontend.template.md` |
| TDD | `TDD-backend.template.md` | `TDD-frontend.template.md` |
| TEST | `TEST-feature.template.md` | `TEST-feature.template.md` |

### Template Usage

1. **Read template file** before generating each document
2. **Replace placeholders** `[placeholder]` with actual values
3. **Remove sections** not applicable (especially for TDD by complexity)
4. **Verify with source code** - all information must be extracted from code

---

## 🏗️ Monorepo Handling

For monorepo projects:

1. **Scan Packages**: List all packages in `packages/` or workspace config
2. **Per-Package Detection**: Detect type of each package independently
3. **Feature Grouping**: Group features by package with prefix
   ```markdown
   ### Package: @app/api (Backend)
   - [ ] FRD-auth.md
   - [ ] TDD-auth.md
   ...
   
   ### Package: @app/web (Frontend)
   - [ ] FRD-dashboard.md
   - [ ] TDD-dashboard.md
   ...
   ```
4. **Output Structure**: 
   ```
   docs/features/
   ├── api/
   │   ├── auth/
   │   └── users/
   └── web/
       ├── dashboard/
       └── settings/
   ```

---

## ✅ Final Notes

- **Language**: Use Vietnamese, include file paths.
- **Verification**: Verify all from code, no assumptions.
- **Complexity**: Conditional sections based on complexity.
- **Scope**: Auto-detect and support Backend/Frontend/Fullstack/Monorepo.
- **Flow**: Sequential: FRD → TDD → Tests per feature → Next feature.
- **Naming**: Folder names must be `[feature-name]` (snake_case or kebab-case), NO numbering.

---

## ✅ Requirements

- ✅ Use Vietnamese, include real code examples with file paths
- ✅ All information MUST be verified from source code
- ✅ [CONDITIONAL] sections only added when information exists
- ✅ Auto-detect project type (Backend/Frontend/Fullstack/Monorepo)
- ✅ Output MUST be complete but concise - NO suggestions, NO recommendations, NO future improvements
- ✅ If information not found in code → Skip section or mark "Not applicable", DO NOT add placeholder content
- ✅ Tasks registered via `j t add` with dependencies and priorities
- ✅ All tasks marked done: `j t list -P docs/*`

## 🔄 Continuous Execution Guidelines

**CRITICAL**: 
1. Never stop for input → Use fallbacks
2. Detect project type → Select appropriate templates
3. Register ALL feature tasks via `j t add` with project prefix `docs/[feature-name]`
4. For EACH feature (in priority order via `j t ready`):
   - `j t pick` → Create FRD → `j t done <id>`
   - `j t pick` → Create TDD → `j t done <id>`
   - `j t pick` → Create TEST → `j t done <id>`
5. Verify ALL → Generate completion report

**Sequential Workflow**: Complete all 3 documents for Feature 1 → Move to Feature 2 → Continue until ALL features done
