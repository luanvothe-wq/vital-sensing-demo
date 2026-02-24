---
trigger: always_on
---

# /work-next — Pick & Implement Next Task

> **Goal**: Automatically pick the next available task, implement it, and repeat.
> **For**: AI agents working through a task backlog. Also useful for developers wanting guided task flow.

## ⚠️ CRITICAL RULES

1. ✅ **Use `jai1 tasks` CLI** - All task management via CLI commands
2. ✅ **Follow project patterns** - Detect and match existing code style
3. ✅ **One task at a time** - Complete current before picking next
4. ✅ **Reference guide** - Run `jai1 t guide` for full CLI usage

---

## 🔄 Workflow Logic

### Step 1: Pick Next Task

**ACTION**: Find and claim the next available task.

```bash
jai1 t ready                    # Show all ready tasks
jai1 t pick                     # Claim top priority task
```

**IF no tasks ready**:
1. Check if tasks are blocked: `jai1 t list -s todo`
2. If blocked → show blocked dependencies
3. If no tasks at all → suggest: `jai1 t add "..." -P <parent>`
4. **END** workflow

**IF task picked**:
- Task auto-set to `in_progress` with your name
- Continue to Step 2

---

### Step 2: Load Context

**ACTIONS**:
1. Read task details: `jai1 t show <id>`
2. **If task has parent** — read docs based on parent type:

   | Parent | Docs to read |
   |--------|-------------|
   | `feature/{name}` | `docs/features/{name}/FRD-{name}.md` — Requirements |
   |  | `docs/features/{name}/TDD-{name}.md` — Technical design |
   |  | `docs/features/{name}/TEST-{name}.md` — Test scenarios |
   | `plan/{name}` | `docs/plans/{name}.md` — Plan file with checklist |
   | `bug/{name}` | `docs/features/{feature}/FRD-*.md` — Related feature docs |
   |  | `docs/features/{feature}/fixes/FIX-*.md` — Previous fix history |

3. **Read related codebase files**:
   - Search for existing patterns
   - Understand dependencies
4. **Check task dependencies**: verify all `depends_on` are truly done

---

### Step 3: Implement

**ACTIONS**:
1. Follow task requirements from parent docs
2. Use project patterns (detect from existing code)
3. Implement changes with proper error handling
4. Follow naming conventions

**IMPLEMENTATION RULES**:
- Complete error handling
- Import correct dependencies
- Comments for complex logic
- Consistent naming

---

### Step 4: Complete & Continue

**ACTIONS**:
1. Mark task done:
   ```bash
   jai1 t done <id>
   ```

2. Preview next task:
   ```bash
   jai1 t ready                    # Check what's next
   ```
   → Take the **first result's ID and title** as `<next-id>` and `<next-title>` for the output below.

3. **OUTPUT**:
   ```
   ✅ Task <id> completed: <title>

   📦 Files changed:
   - [file1] (created/modified)
   - [file2] (created/modified)

   ⏭️ Next task: <next-id> — <next-title>
   Pick next task? (yes/no)
   ```

   **IF no tasks ready**:
   ```
   ✅ Task <id> completed: <title>

   📦 Files changed:
   - [file1] (created/modified)
   - [file2] (created/modified)

   🎉 All tasks completed! No more tasks in the backlog.
   ```
   → **END** workflow

4. **IF yes** → Go to Step 1
5. **IF no** → **END** workflow

---

## 📋 Quick Reference

```bash
jai1 t ready          # What can I work on?
jai1 t pick           # Claim next task
jai1 t show <id>      # Task details
jai1 t done <id>      # Mark complete
jai1 t summary        # Dashboard overview
jai1 t guide          # Full usage guide
```
