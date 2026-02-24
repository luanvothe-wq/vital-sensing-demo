---
description: Review task list for issues, missing dependencies, duplicates, and report problems with solutions
---

# /review-tasks — Task Health Check

> **Goal**: Audit all registered tasks to detect issues (wrong order, missing dependencies, duplicates, orphans, circular deps) and report findings with actionable fixes.
> **Non-destructive**: This workflow only reads and reports — never modifies tasks.

## ⚠️ CRITICAL RULES

1. ✅ **Read-only** — DO NOT modify, add, or delete any tasks
2. ✅ **Report everything** — List all issues found, even minor ones
3. ✅ **Actionable fixes** — Every issue must include a concrete CLI command to fix it
4. ✅ **Reference guide** — Run `j t guide` for full CLI usage if needed

---

## 🔄 Workflow Logic

### Step 1: Collect All Tasks

**ACTION**: Gather full task list with details.

```bash
j t list -j                     # All tasks in JSON
j t list -s todo -j             # Pending tasks
j t list -s in_progress -j      # In-progress tasks
j t list -s done -j             # Completed tasks
j t summary                     # Dashboard overview
```

**IF no tasks found** → Report "No tasks registered" and **END**.

---

### Step 2: Analyze — Dependency Issues

**CHECK** each task's `depends_on` field:

| Issue | Detection | Severity |
|-------|-----------|----------|
| **Missing dependency** | Task B logically needs Task A's output but has no `depends_on` | 🔴 HIGH |
| **Circular dependency** | A → B → C → A | 🔴 HIGH |
| **Dependency on non-existent task** | `depends_on` references an ID that doesn't exist | 🔴 HIGH |
| **Dependency on done task** | Task depends on an already-completed task (harmless but noisy) | 🟡 LOW |
| **Wrong dependency direction** | A depends on B, but A should run first logically | 🟠 MEDIUM |

**HOW TO DETECT MISSING DEPENDENCIES**:
1. Read task titles and notes to understand what each task does
2. If Task A creates types/interfaces and Task B imports them → B should depend on A
3. If Task A creates a service and Task B builds an API layer using it → B should depend on A
4. Common dependency patterns:
   - `domain types` → `service` → `API layer` → `tests`
   - `FRD` → `TDD` → `TEST` → `implementation tasks`
   - `config/setup` → everything else

---

### Step 3: Analyze — Task Quality Issues

**CHECK** each task for:

| Issue | Detection | Severity |
|-------|-----------|----------|
| **Duplicate tasks** | Two tasks with same/very similar title under same parent | 🟠 MEDIUM |
| **Orphan tasks** | Task has no parent (`-P` flag missing) | 🟡 LOW |
| **Vague title** | Title doesn't clearly describe what to do | 🟡 LOW |
| **File-per-task anti-pattern** | Title contains filepath like `[auth.ts]` instead of component purpose | 🟠 MEDIUM |
| **Wrong priority order** | p1 task depends on p2 task (should be reversed) | 🟠 MEDIUM |
| **Stuck in_progress** | Task is `in_progress` but appears abandoned (no recent changes) | 🟠 MEDIUM |
| **Blocked forever** | Task's dependency can never be resolved (parent deleted/failed) | 🔴 HIGH |

---

### Step 4: Analyze — Cross-Reference with Codebase

**IF tasks have parent** (e.g., `feature/[name]` or `plan/[name]`):

1. **Check docs exist**:
   - `feature/*` → verify `docs/features/[name]/FRD-*.md`, `TDD-*.md` exist
   - `plan/*` → verify `docs/plans/[name].md` exists
2. **Check TDD file list** matches implementation tasks:
   - Read TDD Section "Implementation Files"
   - Compare with registered tasks
   - Flag files mentioned in TDD but not covered by any task
   - Flag tasks that reference files not in TDD
3. **Check code vs tasks**:
   - If tasks reference files → verify paths are valid
   - If implementation tasks exist but code already exists → flag potential duplicate work

---

### Step 5: Generate Report

**OUTPUT FORMAT**:

```
🔍 Task Review Report
═══════════════════════════════════════

📊 Overview
- Total tasks: [N]
- By status: [X] todo │ [Y] in_progress │ [Z] done
- Parents: [list of parent prefixes found]
- Issues found: [total count]

═══════════════════════════════════════

🔴 HIGH — Must Fix
───────────────────────────────────────

1. [Issue title]
   📌 Task: T-XXX "[task title]"
   ❓ Problem: [clear explanation]
   ✅ Fix:
   ```bash
   j t dep T-XXX T-YYY   # Add missing dependency
   ```

2. ...

🟠 MEDIUM — Should Fix
───────────────────────────────────────

3. [Issue title]
   📌 Task: T-XXX "[task title]"
   ❓ Problem: [clear explanation]
   ✅ Fix:
   ```bash
   [fix command]
   ```

🟡 LOW — Nice to Fix
───────────────────────────────────────

5. [Issue title]
   ...

═══════════════════════════════════════

✅ Summary
- 🔴 HIGH: [N] issues
- 🟠 MEDIUM: [N] issues
- 🟡 LOW: [N] issues

💡 Quick Fix (copy-paste all fixes):
```bash
# HIGH priority fixes
j t dep T-XXX T-YYY
j t dep T-AAA T-BBB

# MEDIUM priority fixes
j t update T-CCC -n "files: ..."
```
```

**IF no issues found**:
```
🔍 Task Review Report
═══════════════════════════════════════

📊 Overview
- Total tasks: [N]
- By status: [X] todo │ [Y] in_progress │ [Z] done

✅ No issues found! Tasks are healthy.
```

→ **END** workflow.

---

## 📋 Usage

```bash
# Review all tasks
/review-tasks

# Review tasks for a specific feature/plan
/review-tasks feature/user-auth
/review-tasks plan/refactor-auth
```

**When a parent is specified**: Only analyze tasks under that parent prefix.
**When no parent specified**: Analyze ALL tasks.

---

## 📋 Quick Reference

```bash
j t list -j               # All tasks (JSON)
j t list -P <parent> -j   # Tasks by parent (JSON)
j t show <id>             # Task details + deps
j t summary               # Dashboard
j t guide                 # Full CLI usage
```
