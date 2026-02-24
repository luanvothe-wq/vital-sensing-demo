---
description: Extract feature context from conversation and sync docs/tasks after IDE plan mode
argument-hint: "[optional-feature-name]"
---

# /develop-feature-from-conversation Workflow

Use this workflow AFTER an IDE built-in plan mode finishes OR after planning with another Agent. It extracts feature context from the conversation and local changes to create or update FRD/TDD/TEST and sync tasks via `j tasks` CLI.

## When to Use

Use this workflow when you have a conversation containing feature work at any stage:

1. **After planning completed** - Requirements and design decided, not yet implemented
2. **After planning + implementation completed** - Code already written
3. **After planning + implementation + adjustments** - Code modified/refined after initial implementation

Other scenarios:
- You already used IDE plan mode to design/implement a feature
- Some code may already exist before Jai1 documentation
- You want to sync task status with actual progress via `j tasks` CLI

## When Not to Use

- You need full guided development from scratch (use `/develop-feature`)
- No meaningful conversation context or local changes exist

## Critical Rules

1. Always sync state from actual files before marking tasks done.
2. Never downgrade completed tasks unless conflict is confirmed.
3. Generate docs in Vietnamese (code/terms in English).
4. If tasks remain, ask user before continuing implementation.
5. Always sync tasks via `j tasks` CLI when updating progress. Reference `j t guide` for full usage.
6. **No Questions** - Extract information from conversation only, do NOT ask clarifying questions (planning already done).
7. **Priority order** - `j t ready` returns tasks sorted by priority (p1 highest). Always pick highest-priority ready task first.

---

## Workflow Phases

### Phase 1: Context Detection

**Step 1.1: Determine Feature Name**
- Use `$ARGUMENTS` if provided
- Otherwise infer from conversation (kebab-case English)

**Step 1.2: Collect Local Change Context**
- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git log -n 5 --oneline`

**Step 1.3: Find Existing Feature Docs**
- Search `docs/features/*/tasks.md`
- Search `docs/features/*/FRD-*.md`, `docs/features/*/TDD-*.md`, `docs/features/*/TEST-*.md`
- Determine mode:
  - `RESUME`: tasks.md exists with IN_PROGRESS
  - `UPDATE`: FRD/TDD/TEST exist or code exists
  - `NEW`: no docs and no related code

**Step 1.4: Extract Conversation Summary**
- Requirements and scope
- Architecture decisions
- Files already implemented
- Implementation adjustments/refinements (if any)

> **NOTE**: If conversation context is insufficient, output warning and proceed with available information. Do NOT ask for clarification.

---

### Phase 2: Extract Planning Information

> **Purpose**: Extract and save planning decisions from conversation (already completed with another Agent).

#### Step 2.1: Extract Requirements

**EXTRACT** from conversation context:
- Functional requirements (What should the feature do?)
- Non-functional requirements (Performance, security, scalability?)
- Scope boundaries (What is NOT included?)
- User roles/personas affected
- Integration points with existing system
- Edge cases and error scenarios

**OUTPUT** (internal, for task registration):
```
### Requirements (Extracted)
- [Requirement 1]
- [Requirement 2]
- ...
```

#### Step 2.2: Extract Design Decisions

**EXTRACT** from conversation context:
- Architecture approach chosen
- Key components and their purposes
- Data flow decisions
- Technology choices made
- Any trade-offs discussed

**OUTPUT** (internal, for task registration):
```
### Design Decisions (Extracted)
- [Decision 1]
- [Decision 2]
- ...
```

#### Step 2.3: Summarize Planning

**OUTPUT**:
```
📋 **Planning Extracted from Conversation**

✅ Requirements: [X] points extracted
✅ Design Decisions: [Y] decisions extracted

Proceeding to sync tasks via CLI...
```

> **NOTE**: Do NOT ask any questions in this phase. If information is missing, mark as "[Not specified in conversation]" and proceed.

---

### Phase 3: Sync Tasks via CLI

**If tasks already exist for this feature**:
1. Check existing: `j t list -P feature/[name]`
2. Sync each task based on file existence and git status:
   - File exists + clean → `j t done <id>`
   - File exists + modified → keep as in_progress
   - File missing → keep as todo
3. Add missing tasks if conversation reveals new ones

**If no tasks exist**:
1. Register tasks via CLI — assign priorities to enforce order:
   ```bash
   j t add "Create FRD-[name].md" -p 1 -P feature/[name]
   j t add "Create TDD-[name].md" -p 2 -P feature/[name]
   j t add "Create TEST-[name].md" -p 3 -P feature/[name]
   ```
2. Set dependencies: `j t dep T-002 T-001` etc.
3. Add Phase 2 tasks from TDD (if exists) — see Phase 5
4. Mark completed tasks based on actual files: `j t done <id>`
5. **Sync tasks to git**: `j t sync`

> 📖 Reference: `skill:tasks-creator` for task naming conventions and grouping strategy
> 📖 Reference: `j t guide` for full usage

**Task Sync Rules**:
- File missing → keep as `todo`
- File exists + modified/untracked → keep as `in_progress`
- File exists + clean → `j t done <id>`
- No file reference → only mark done if conversation confirms

---

### Phase 4: Documentation Generation

**FRD**:
- If missing: create from `.jai1/templates/feature-docs/FRD-backend.template.md`
- If exists: append new requirements with `[ADDED]`
- Use extracted requirements from Planning Phase
- Mark completed: `j t done <frd-task-id>`

**TDD**:
- If missing: create from `.jai1/templates/feature-docs/TDD-backend.template.md`
- If exists: update with implementation details
- Use extracted design decisions from Planning Phase
- Ensure Section 6 lists all implementation files
- Mark completed: `j t done <tdd-task-id>`

**TEST** (`TEST-[feature-name].md`):
- If missing: create from `.jai1/templates/feature-docs/TEST-feature.template.md`
- If exists: append new scenarios with existing preserved
- Extract test scenarios:
  - **Happy Path**: từ FRD User Stories (US-XXX)
  - **Error Cases**: từ TDD Error Handling (ERR-XXX)
  - **Edge Cases**: chỉ khi có boundary conditions đặc biệt
- Format: Gherkin ngắn gọn (Given-When-Then, 3-5 lines per scenario)
- Mark completed: `j t done <test-task-id>`

---

### Phase 5: Implementation Sync

1. Read TDD Section 6 (Implementation Files)
2. Compare with actual files
3. **Check pending tasks** for dependencies: `j t list -s todo -j` and `j t list -s in_progress -j`
4. Add missing Phase 2 tasks via CLI — **group by component/layer, NOT per-file**:

   > ⚠️ Follow `skill:tasks-creator` conventions: title = mục đích logic, KHÔNG chứa filepath

   ```bash
   # ❌ SAI — file-per-task
   j t add "[file.ts] description" -p 1 -P feature/[name]

   # ✅ ĐÚNG — component-per-task
   j t add "Implement auth service" -p 2 -P feature/[name]
   j t update T-006 -n "files: auth.service.ts"
   ```
5. **Set dependencies** if needed: `j t dep <child> <parent>`
6. Mark completed files: `j t done <id>`
7. **Sync tasks to git**: `j t sync`

**Status Rules**:
- All tasks done → Feature complete
- Any task in_progress → Feature in progress
- Otherwise → Feature in progress

---

### Phase 6: Ask User Before Continuing Implementation

> **MANDATORY**: Always stop and ask user before implementing remaining tasks.

**If remaining tasks exist**:
1. Show summary of completed vs remaining tasks
2. Show ready tasks: `j t ready -P feature/[name]` (sorted by priority — highest first)
3. Ask user:

```
📋 Documentation & sync completed!

📊 Tasks: [X] total, [Y] completed, [Z] remaining
📊 Ready tasks: `j t ready -P feature/[name]`
   (sorted by priority — highest priority first)

👉 Tiếp tục implement phần còn lại không? (yes/no)
```

4. **WAIT** for user response
5. If **yes** → Pick from `j t ready -P feature/[name]`, use `j t pick` (auto-picks highest-priority), resume implementation (same as `/develop-feature` Step 7)
6. If **no** → Stop. User can resume later.

**If all tasks complete**:
- Update status to `✅ COMPLETED`
- Output completion report

---

## Output Templates

### Sync Completed
```
✅ Feature Sync Completed

📁 Feature: [feature-name]
📂 Location: docs/features/[feature-name]/

📋 Planning (Extracted):
- Requirements: [X] points
- Design decisions: [Y] decisions

📄 Documentation:
- [✓/✗] FRD-[feature-name].md
- [✓/✗] TDD-[feature-name].md
- [✓/✗] TEST-[feature-name].md

📊 Tasks: [X] total, [Y] completed, [Z] remaining

Next: Continue implementation? (yes/no)
```

### No Context Found
```
⚠️ Không đủ context từ conversation.

Đã kiểm tra:
- Git changes: none
- Existing feature docs: none

Gợi ý: dùng `/develop-feature` để bắt đầu mới.
```

---

## ✅ Quality Checklist

- [ ] Planning information extracted from conversation
- [ ] Tasks registered via `j t add` with dependencies and priorities
- [ ] FRD has all extracted requirements
- [ ] TDD reflects design decisions from conversation
- [ ] TEST covers Happy Path + Error Cases
- [ ] All files synced with actual git status
- [ ] User confirmed before continuing implementation
- [ ] Checkpoint log updated
