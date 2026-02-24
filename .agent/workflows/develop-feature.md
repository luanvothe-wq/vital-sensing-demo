---
trigger: always_on
---

# Feature Development Workflow (Auto-Resume)

> **Goal**: Develop new feature or extend existing feature with Planning → FRD → TDD → TEST → Auto-implement.
> **Resumable**: Check `j t list -s in_progress` → resume from incomplete task.

## ⚠️ CRITICAL RULES

1. ✅ **Auto-execute entirely** - Do not stop to ask user, only stop when need to clarify ambiguity
2. ✅ **Checkpoint after each task** - Run `j t done <id>` after each task completed
3. ✅ **Extract from code** - Verify information from actual source code
4. ✅ **Vietnamese** - Documentation content in Vietnamese
5. ✅ **Resume first** - Always check `j t list -s in_progress -P feature/*` before starting
6. ✅ **Batch Questions** - When asking, group all related questions together in one batch
7. ✅ **Task guide** - Reference `j t guide` for full task management usage
8. ✅ **Priority order** - `j t ready` returns tasks sorted by priority (p1 highest). Always pick highest-priority ready task first.

---

## 🔄 Workflow Logic

### Step 1: Check Resume State

**ACTION**: Check `j t list -s in_progress -P feature/*`

**IF in_progress tasks found**:
1. Read task details: `j t show <id>`
2. Resume from that task's phase/step

**IF no in_progress but todo tasks exist for this feature**:
1. Check: `j t ready -P feature/[name]`
2. Pick next (highest priority): `j t pick`

**IF no tasks at all** → Continue to Step 2

---

### Step 2: Analyze & Detect Mode

**ACTIONS**:
1. **Parse user input**: Extract feature name, requirements, scope
2. **Generate canonical name**: kebab-case English (e.g., `user-registration`)
3. **Search existing**:
   - Check `docs/features/` for matching folder
   - Search codebase for related files (routes, controllers, services)

**DETERMINE MODE**:
| Condition | Mode |
|-----------|------|
| Feature folder exists with FRD/TDD OR code files exist | UPDATE |
| Neither exists | NEW |

**OUTPUT**: Mode (NEW/UPDATE), Feature Name, Requirements List

---

### Step 3: Planning Phase - Requirements Clarification

> **Purpose**: Ensure requirements are crystal clear before any design or implementation.

#### Step 3.1: Assess Requirements Clarity

**EVALUATE** user's input for:
- Functional requirements (What should the feature do?)
- Non-functional requirements (Performance, security, scalability?)
- Scope boundaries (What is NOT included?)
- User roles/personas affected
- Integration points with existing system
- Edge cases and error scenarios

**CLARITY CHECK**:
| Aspect | Clear? | Notes |
|--------|--------|-------|
| Core functionality | ✓/✗ | |
| User stories/use cases | ✓/✗ | |
| Input/Output expectations | ✓/✗ | |
| Error handling expectations | ✓/✗ | |
| Constraints/limitations | ✓/✗ | |

#### Step 3.2: Batch Questions for Clarification (If Needed)

**IF requirements are NOT clear**:

1. **Compile all unclear points** into a single batch of questions
2. **Group questions by category**:
   - 🎯 **Functional**: What exactly should happen?
   - 👤 **User Context**: Who uses this? How?
   - 🔗 **Integration**: How does this connect to existing features?
   - ⚠️ **Edge Cases**: What happens when X fails?
   - 📊 **Constraints**: Any limits on performance, data size, etc.?

**FORMAT**:
```
📋 Cần làm rõ một số điểm trước khi thiết kế:

🎯 **Chức năng:**
1. [Question 1]
2. [Question 2]

👤 **Ngữ cảnh sử dụng:**
3. [Question 3]

🔗 **Tích hợp:**
4. [Question 4]

Vui lòng trả lời các câu hỏi trên để tiếp tục.
```

3. **WAIT** for user response
4. **IF still unclear after response** → Ask follow-up batch questions (max 2 rounds)
5. **IF clear** → Proceed to Step 4

**IF requirements are ALREADY CLEAR** → Skip to Step 4

---

### Step 4: Planning Phase - Design Overview

> **Purpose**: Present high-level architecture and get alignment before detailed design.

#### Step 4.1: Create Design Overview

**GENERATE** a concise design overview including:

1. **Architecture Approach**: How this feature fits into the system
2. **Key Components**: Main modules/services involved
3. **Data Flow**: How data moves through the feature
4. **Technology Choices**: Libraries, patterns, frameworks to use
5. **Alternative Options**: If multiple valid approaches exist

**FORMAT**:
```
📐 **Design Overview: [Feature Name]**

### 1. Kiến trúc đề xuất
[Brief description of architectural approach]

### 2. Các thành phần chính
- Component A: [purpose]
- Component B: [purpose]
- ...

### 3. Luồng dữ liệu
[Step-by-step data flow]

### 4. Công nghệ sử dụng
- [Technology/Pattern]: [reason]
- ...

### 5. Các phương án thay thế (nếu có)
| Option | Pros | Cons |
|--------|------|------|
| Option A | ... | ... |
| Option B | ... | ... |
```

#### Step 4.2: Batch Questions for Design Decisions (If Needed)

**IF there are multiple valid options OR design decisions needed**:

1. **Present the options** clearly with pros/cons
2. **Compile all design questions** into one batch:

**FORMAT**:
```
🤔 **Cần xác nhận một số quyết định thiết kế:**

📊 **Lựa chọn kiến trúc:**
1. [Option A vs Option B] - Bạn prefer option nào?

🔧 **Chi tiết kỹ thuật:**
2. [Technical decision question]
3. [Another technical question]

📁 **Cấu trúc:**
4. [Structure-related question]

Vui lòng cho biết lựa chọn của bạn.
```

3. **WAIT** for user response
4. **Update design overview** based on responses

**IF no design questions needed** → Proceed to Step 5

#### Step 4.3: Finalize Design

**OUTPUT** final design summary:
```
✅ **Design Confirmed**

- Approach: [chosen approach]
- Key decisions: [list of confirmed decisions]
- Ready to proceed with documentation.
```

---

### Step 5: Register Tasks via CLI

**ACTION**: Use `j tasks` CLI to register tasks for this feature.

> 📖 Reference: `skill:tasks-creator` for task naming conventions and grouping strategy
> 📖 Reference: `j t guide` for full CLI usage

1. **Check existing tasks**: `j t list -P feature/[name]`
2. **Check pending tasks** (find dependencies): `j t list -s todo -j` and `j t list -s in_progress -j`
3. **Add Phase 1 tasks** (if not exists) — assign priority to enforce order:
   ```bash
   j t add "Create FRD-[name].md" -p 1 -P feature/[name]
   j t add "Create TDD-[name].md" -p 2 -P feature/[name]
   j t add "Create TEST-[name].md" -p 3 -P feature/[name]
   ```
4. **Set dependencies**: FRD → TDD → TEST
   ```bash
   j t dep T-002 T-001   # TDD waits for FRD
   j t dep T-003 T-002   # TEST waits for TDD
   ```
5. **Phase 2 tasks** will be added after TDD completion (when file list is known)
6. **Sync tasks to git**: `j t sync`

> ℹ️ `j t ready` returns tasks sorted by priority (p1 = highest). `j t pick` picks the highest-priority ready task.

**CHECKPOINT**: Tasks registered & synced → Continue immediately

---

### Step 6: Phase 1 - Documentation

#### Task 6.1: Create/Update FRD

**Template**: `.jai1/templates/feature-docs/FRD-backend.template.md`

**IF MODE = NEW**:
- Create `docs/features/[feature-name]/FRD-[feature-name].md`
- Use template with confirmed requirements from Planning Phase

**IF MODE = UPDATE**:
- Read existing FRD
- Append new requirements (preserve existing)
- Mark changes with `[ADDED]` prefix

**CHECKPOINT**: `j t done <frd-task-id>`

---

#### Task 6.2: Create/Update TDD

**Template**: `.jai1/templates/feature-docs/TDD-backend.template.md`

**IF MODE = NEW**:
- Create `docs/features/[feature-name]/TDD-[feature-name].md`
- Use design decisions from Planning Phase

**IF MODE = UPDATE**:
- Read existing TDD
- Add new design sections
- Preserve existing designs

**CRITICAL**: Section "6. Implementation Files" must list all files to create/modify

**CHECKPOINT**:
1. `j t done <tdd-task-id>`
2. **Add Phase 2 tasks** from TDD Section 6 — group by **component/layer**, NOT per-file:

   > ⚠️ Follow `skill:tasks-creator` conventions: title = mục đích logic, KHÔNG chứa filepath

   ```bash
   # ❌ SAI — file-per-task (gây trùng ID, title khó đọc)
   j t add "[jwt.ts] Tao helper JWT" -p 1 -P feature/[name]
   j t add "[auth.types.ts] Tao DTO types" -p 1 -P feature/[name]

   # ✅ ĐÚNG — component-per-task
   j t add "Tạo domain types và error classes" -p 1 -P feature/[name]
   j t add "Implement JWT security helper" -p 1 -P feature/[name]
   j t add "Implement auth service" -p 2 -P feature/[name]
   j t add "Implement API layer (controller, routes, validators)" -p 3 -P feature/[name]
   ```
3. **Track files in notes**:
   ```bash
   j t update T-004 -n "files: auth.types.ts, auth.errors.ts"
   j t update T-005 -n "files: jwt.ts"
   ```
4. **Set dependencies** (domain → infra → service → API):
   ```bash
   j t dep T-006 T-004   # service ← domain types
   j t dep T-007 T-006   # API ← service
   ```
5. **Sync tasks to git**: `j t sync`

---

#### Task 6.3: Create/Update TEST

**Template**: `.jai1/templates/feature-docs/TEST-feature.template.md`

**IF MODE = NEW**:
- Create `docs/features/[feature-name]/TEST-[feature-name].md`
- Extract test scenarios from FRD (User Stories → Happy Path)
- Extract error cases from TDD (Error Handling section)

**IF MODE = UPDATE**:
- Read existing TEST
- Add new scenarios for new requirements
- Preserve existing scenarios

**CONTENT GUIDE**:
- **Happy Path**: 1 scenario per main User Story (US-XXX)
- **Error Cases**: 1 scenario per error code (ERR-XXX)
- **Edge Cases**: Only if có boundary conditions đặc biệt

**FORMAT**: Gherkin ngắn gọn (Given-When-Then, 3-5 lines per scenario)

**CHECKPOINT**: `j t done <test-task-id>`

---

### Step 6.5: Ask User Before Implementation

> **MANDATORY**: Always stop here and ask user before proceeding to implementation.

**OUTPUT**:
```
📋 Planning & Documentation phase completed!

📄 Documents created:
- [✓] FRD-[feature-name].md
- [✓] TDD-[feature-name].md
- [✓] TEST-[feature-name].md

📊 Ready tasks: `j t ready -P feature/[name]`
   (sorted by priority — highest priority first)

👉 Bạn muốn tiếp tục implement không? (yes/no)
```

**WAIT** for user response.

- **If yes** → Continue to Step 7
- **If no** → Stop. User can resume later with `/develop-feature [name]`

---

### Step 7: Phase 2 - Auto-Implementation

**LOOP**: `j t ready -P feature/[name]` → implement each (highest priority first):

1. **Pick task**: `j t pick` (auto-picks highest-priority ready task, sets in_progress)
2. **Read task notes**: `j t show <id>` → get file list from notes field
3. **Read TDD** to get design for each file in the task
4. **Check existing code** if MODE = UPDATE
5. **Detect project patterns** from existing codebase
6. **Generate/Modify all files** in the task according to TDD design
7. **Done**: `j t done <id>`
8. **Continue** to next task

**IMPLEMENTATION RULES**:
- One task = one component/concern with multiple related files
- Follow project patterns (detect from existing code)
- Import correct dependencies
- Complete error handling
- Comments for complex logic (Vietnamese OK)
- Consistent naming conventions

---

### Step 8: Completion Report

**Verify all tasks done**: `j t list -P feature/[name]` → all should be ✅

**OUTPUT**:
```
✅ Feature Development Complete

📁 Feature: [Feature Name]
📂 Location: docs/features/[feature-name]/

📋 Planning:
- Requirements clarified: [X] points
- Design decisions: [Y] decisions

📄 Documentation:
- [✓] FRD-[feature-name].md
- [✓] TDD-[feature-name].md
- [✓] TEST-[feature-name].md

📦 Implementation:
- [✓] [file1.js] (created)
- [✓] [file2.js] (modified)
- ...

📊 Summary:
- Mode: [NEW/UPDATE]
- Files created: [X]
- Files modified: [Y]
- Total tasks: [Z]
```

---

## ✅ Quality Checklist

- [ ] Requirements fully clarified before design
- [ ] Design overview presented and confirmed
- [ ] Tasks registered via `j t add` with dependencies and priorities
- [ ] FRD has all requirements from user
- [ ] TDD has clear list of implementation files
- [ ] TEST covers Happy Path + Error Cases
- [ ] User confirmed before starting implementation
- [ ] All files implemented according to TDD design
- [ ] Code follows project patterns
- [ ] All tasks marked done: `j t list -P feature/[name]`
