---
trigger: always_on
---

# /run-group Workflow

> **Goal**: Implement tất cả tasks của 1 group (parent) theo thứ tự priority.
> **Smart**: Tự động pick task ready → implement → done → next, dừng khi hết tasks.

## ⚠️ CRITICAL RULES

1. ✅ **Auto-execute entirely** - Không dừng hỏi user giữa các tasks (trừ khi cần clarify)
2. ✅ **Checkpoint after each task** - Run `j t done <id>` sau mỗi task hoàn thành
3. ✅ **Priority order** - `j t ready -P <parent>` trả về tasks sorted by priority. Luôn pick task có priority cao nhất.
4. ✅ **Sync after completion** - Run `j t sync` sau khi hoàn thành tất cả tasks
5. ✅ **Resume-friendly** - Kiểm tra `j t list -s in_progress -P <parent>` trước khi bắt đầu
6. ✅ **Follow TDD/FRD** - Đọc docs nếu có trước khi implement

---

## 🎯 INPUT

**Required**: Parent name (group name)

**Usage**:
- `/run-group feature/auth` — Implement tất cả tasks của feature/auth
- `/run-group plan/refactor` — Implement tất cả tasks của plan/refactor
- `/run-group prd/download` — Implement tất cả tasks của prd/download
- `/run-group` — Hiện danh sách parents để chọn

---

## 🔄 Workflow Logic

### Step 1: Determine Target Group

**IF `$ARGUMENTS` is provided**:
- Use as parent name directly
- Verify exists: `j t list -P <parent>`
- If no tasks found → Error: "Group not found"

**IF no arguments**:
1. **Show available groups**: `j t parents -s in_progress` and `j t parents -s ready` and `j t parents -s todo`
2. **Output**:
   ```
   📦 Available groups to implement:

     🔵  feature/auth      — 2/4 tasks (1 in_progress)
     📋  plan/refactor     — 0/3 tasks (2 ready)
     🔴  prd/download      — 0/2 tasks (blocked)

   👉 Chọn group nào? (nhập parent name, ví dụ: feature/auth)
   ```
3. **WAIT** for user input
4. Use user's response as parent name

---

### Step 2: Check Resume State

**ACTION**: `j t list -s in_progress -P <parent>`

**IF in_progress tasks found**:
1. Read task details: `j t show <id>`
2. Check if implementation is partially done
3. **Resume**: Continue implementing from where it stopped
4. After completion: `j t done <id>` → continue to next

**IF no in_progress** → Continue to Step 3

---

### Step 3: Read Context (If Available)

**ACTIONS**:
1. **Check for feature docs**: 
   - `docs/features/*/FRD-*.md` — Requirements
   - `docs/features/*/TDD-*.md` — Technical design
   - `docs/features/*/TEST-*.md` — Test scenarios
2. **Check for plan docs**:
   - `docs/plans/*.md` — Plan details
3. **Read relevant docs** to understand implementation requirements
4. **Detect project patterns** from existing codebase

---

### Step 4: Auto-Implementation Loop

**LOOP**: `j t ready -P <parent>` → implement each (highest priority first):

1. **Pick task**: `j t pick` hoặc pick from `j t ready -P <parent>` (auto-picks highest-priority ready task, sets in_progress)
2. **Read task notes**: `j t show <id>` → get file list and context from notes field
3. **Read docs** (FRD/TDD) to get design for files in the task
4. **Check existing code** if modifying existing files
5. **Detect project patterns** from existing codebase
6. **Generate/Modify all files** in the task according to design
7. **Mark done**: `j t done <id>`
8. **Check next**: `j t ready -P <parent>` → if more tasks, continue loop

**IMPLEMENTATION RULES**:
- One task = one component/concern with multiple related files
- Follow project patterns (detect from existing code)
- Import correct dependencies
- Complete error handling
- Comments for complex logic (Vietnamese OK)
- Consistent naming conventions

---

### Step 5: Completion Report

**Verify all tasks done**: `j t list -P <parent>` → all should be ✅

**Sync tasks**: `j t sync`

**OUTPUT**:
```
✅ Group Implementation Complete

📦 Group: <parent>

📊 Tasks:
- [✓] T-001: [title]
- [✓] T-002: [title]
- [✓] T-003: [title]
- ...

📦 Implementation:
- Files created: [X]
- Files modified: [Y]
- Total tasks completed: [Z]

📊 All groups: `j t parents`

🔗 Next Steps:
- Review changes and commit with /commit-it
- Run tests if applicable
```

---

## 📋 Usage Examples

### Example 1: Direct Group Name
```
User: /run-group feature/auth

Step 1: Target = feature/auth
Step 2: No in_progress tasks
Step 3: Read FRD-auth.md, TDD-auth.md
Step 4: Loop
  → j t pick → T-004 "Tạo domain types" → implement → j t done T-004
  → j t pick → T-005 "Implement JWT helper" → implement → j t done T-005
  → j t pick → T-006 "Implement auth service" → implement → j t done T-006
Step 5: All done → j t sync → report
```

### Example 2: Interactive Selection
```
User: /run-group

📦 Available groups:
  🔵  feature/auth      — 1/4 tasks (1 in_progress)
  📋  plan/refactor     — 0/3 tasks (2 ready)

👉 Chọn group nào?

User: feature/auth

→ Continues as Example 1
```

### Example 3: Resume After Interruption
```
User: /run-group feature/auth

Step 1: Target = feature/auth
Step 2: Found T-005 in_progress → resume
  → Check partial implementation
  → Complete T-005 → j t done T-005
Step 4: Continue loop with remaining tasks
Step 5: All done → report
```

---

## ✅ Quality Checklist

- [ ] Target group identified (from argument or interactive selection)
- [ ] Resume state checked: `j t list -s in_progress -P <parent>`
- [ ] Context docs read (FRD/TDD/Plan if available)
- [ ] All tasks implemented following project patterns
- [ ] Each task marked done: `j t done <id>`
- [ ] All tasks verified: `j t list -P <parent>`
- [ ] Tasks synced to git: `j t sync`

---

## 📌 Notes

- **Parent types**: Works with any parent prefix (`feature/*`, `plan/*`, `prd/*`, `bug/*`)
- **Priority**: Tasks are always picked in priority order (p1 highest via `j t ready`)
- **Dependencies**: Blocked tasks are automatically skipped until deps are resolved
- **Resume**: Safe to interrupt and resume — in_progress tasks are picked up automatically
- **Companion commands**: Use `j t parents` to see all groups and their status
