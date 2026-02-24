---
description: Generate or update functional documentation (FRD/TDD) for a single feature
agent: build
---

# gen-feature-doc

> Tạo hoặc cập nhật tài liệu chức năng (FRD/TDD) cho một feature cụ thể.

## 🎯 Khi nào sử dụng?

> **Workflow này dành cho DỰ ÁN CÓ SẴN**. Đối với dự án mới, hãy dùng `/develop-feature` (đã bao gồm tạo docs từ đầu).

| Tình huống | Mode | Ghi chú |
|------------|------|---------|
| **Dự án CÓ SẴN** - Tạo docs cho code chưa có docs | CREATE | Verify từ source code thực tế |
| **Dự án CÓ SẴN** - Cập nhật feature đã có docs | UPDATE | Merge requirements mới vào docs có sẵn |
| **Dự án MỚI** - Phát triển feature mới | ❌ | Dùng `/develop-feature` (đã bao gồm docs) |
| Tạo docs cho TOÀN BỘ features cùng lúc | ❌ | Dùng `/gen-all-features-doc` |

## ⚠️ CRITICAL RULES

1. ✅ **User Description First** - Start with user's feature description, then verify with code
2. ✅ **Smart Detection** - Check if feature exists → Update existing docs OR Create new docs
3. ✅ **Code Verification** - All information MUST be verified from actual source code
4. ✅ **Complete but Concise** - Include only verified information, NO suggestions or placeholders
5. ✅ **Auto-Execute** - Complete all steps without stopping for user input

---

## 🎯 Workflow Steps

### Step 1: Analyze & Identify Feature

**INPUT**: User provides feature description (name, purpose, requirements)

**ACTIONS**:
1.  **Analyze User Input**: Extract keywords, intent, and entities (e.g., "login", "payment", "users").
2.  **Search Codebase (Smart Match)**:
    *   Search for files matching keywords (routes, controllers, services).
    *   *Example*: User says "login" → Search for `login`, `auth`, `signin`.
    *   *Goal*: Find if this feature already exists technically.
3.  **Determine Canonical Feature Name**:
    *   **IF Code Found**: Use the existing technical name (e.g., `authentication`, `user-profile`).
    *   **IF New Feature**: Generate a standard English kebab-case name (e.g., `user-management`, `payment-gateway`).
    *   *Rule*: Do NOT use Vietnamese or special characters in folder/file names.
4.  **Extract Requirements**: List specific functional requirements from user text.

**OUTPUT**: Canonical Feature Name (kebab-case), Feature Type, Key Requirements, Matched Code Paths (if any).

---

### Step 2: Check Existing Documentation

**ACTIONS**:
1. Search in `docs/features/` for existing feature folder
2. Check for existing files:
   - `[XX-feature-name]/FRD-[feature-name].md`
   - `[XX-feature-name]/TDD-[feature-name].md`
   - `[XX-feature-name]/TEST-[feature-name].md`

**DECISION**:
- **If EXISTS** → Mode: UPDATE (preserve existing content, add/modify based on user input)
- **If NOT EXISTS** → Mode: CREATE (create new folder and all files)

**OUTPUT**: Mode (CREATE/UPDATE), existing file paths (if any)

---

### Step 3: Analyze Code (Verification Phase)

**ACTIONS**:
1. **Detect Project Type** (same as `/gen-all-features-doc`):
   - **Backend**: routes, controllers, models, services (`composer.json`, `nest-cli.json`)
   - **Frontend**: pages, components, hooks, stores (`next`, `nuxt`, `react`, `vue` in package.json)
   - **Fullstack**: Both indicators found
   - **Monorepo**: `pnpm-workspace.yaml` or `packages/` folder

2. **Search for Feature in Code**:
   - Routes/Endpoints: Search for related paths
   - Controllers/Components: Find handlers for this feature
   - Models/State: Find data structures
   - Services: Find business logic

3. **Extract Information**:
   - Routes and HTTP methods
   - Authentication/Authorization
   - Input/Output data structures
   - Business rules from code logic
   - Error handling
   - Integration points

**FALLBACK**: If code not found → Use user description but mark as "TO BE IMPLEMENTED"

**OUTPUT**: Verified code references, routes, components, models, business rules

---

### Step 4: Create/Update FRD

**Template** (by project type):
- Backend-only: `.jai1/templates/feature-docs/FRD-backend.template.md`
- Frontend-only: `.jai1/templates/feature-docs/FRD-frontend.template.md`
- Fullstack/Mixed: `.jai1/templates/feature-docs/FRD-fullstack.template.md`

**Conditional Sections** (check INCLUDE IF / SKIP IF in template):
- Skip sections where SKIP IF condition matches
- Only include sections where INCLUDE IF condition matches

**MODE: CREATE**
- Create folder: `docs/features/[feature-name]/`
- Create file: `FRD-[feature-name].md`
- Use template, **omit [CONDITIONAL] sections not applicable**

**MODE: UPDATE**
- Read existing FRD
- Merge user's new requirements with existing content
- Update sections that changed
- Preserve verified information

**EXECUTION**: Write file → Verify content → Continue to Step 5

---

### Step 5: Create/Update TDD

**Template** (by project type):
- Backend-only: `.jai1/templates/feature-docs/TDD-backend.template.md`
- Frontend-only: `.jai1/templates/feature-docs/TDD-frontend.template.md`
- Fullstack/Mixed: `.jai1/templates/feature-docs/TDD-fullstack.template.md`

**Complexity Determination**:

| Level | Backend Sections | Frontend Sections |
|-------|------------------|-------------------|
| **Simple** | 1, 4, 5, 6 | 1, 5, 6 |
| **Medium** | 1-7 | 1-7 |
| **Complex** | All (1-8) | All (1-8) |

**Conditional Sections** (check INCLUDE IF / SKIP IF in template):
- ERD → Skip if no database changes
- Roles & Permissions → Skip if no auth logic
- Error Handling → Skip if using standard framework errors
- Security & Performance → Skip if Simple/Medium complexity

**MODE: CREATE**
- Create file: `TDD-[feature-name].md`
- **Omit [CONDITIONAL] sections not applicable**

**MODE: UPDATE**
- Read existing TDD
- Update design based on new requirements
- Preserve existing flow diagrams if still valid

**EXECUTION**: Write file → Verify content → Continue to Step 6

---

### Step 6: Create/Update TEST

**Template**: `.jai1/templates/feature-docs/TEST-feature.template.md`

**Default Mode: Simplified**
- Include: Happy Path + Error Handling (REQUIRED)
- Skip: Edge Cases + Integration (OPTIONAL - add later if needed)

**MODE: CREATE**
- Create file: `TEST-[feature-name].md` in same folder
- Use simplified mode by default

**MODE: UPDATE**
- Read existing TEST file
- Add new test cases based on new requirements
- Update existing test cases if requirements changed

**EXECUTION**: Write file → Continue to Step 7

---

### Step 7: Summary Report

**GENERATE REPORT**:

```
✅ Feature Documentation Complete

📁 Feature: [Feature Name]
📂 Location: docs/features/[XX-feature-name]/

📄 Files Created/Updated:
- [✓] FRD-[feature-name].md ([Created/Updated])
- [✓] TDD-[feature-name].md ([Created/Updated])
- [✓] TEST-[feature-name].md ([Created/Updated])

📊 Summary:
- Mode: [CREATE/UPDATE]
- Requirements: [X] functional requirements documented
- Design Steps: [Y] steps documented
- Test Cases: [Z] test scenarios created
- Code Verified: [Yes/Partial/No - TO BE IMPLEMENTED]

🔗 Next Steps:
[If CREATE mode] → Implement feature following FDD design
[If UPDATE mode] → Review changes and update implementation if needed
```

**COMPLETION**: Workflow finished

---

## 📋 Usage Examples

### Example 1: Create New Feature
```
User Input: "I need to create User Login feature with email/password, remember me, and forgot password link"

Workflow will:
1. Create docs/features/02-user-login/
2. Generate FRD with login requirements
3. Generate TDD with login flow diagram
4. Generate TEST with login test scenarios
```

### Example 2: Update Existing Feature
```
User Input: "Update User Login feature: add 2FA authentication"

Workflow will:
1. Find existing docs/features/02-user-login/
2. Update FRD with 2FA requirements
3. Update TDD with new 2FA flow steps
4. Add 2FA test scenarios to TEST file
```

---

## ✅ Requirements

- ✅ Use Vietnamese for documentation content
- ✅ Verify all information from code when available
- ✅ Mark "TO BE IMPLEMENTED" if code not found
- ✅ Keep content complete but concise
- ✅ NO suggestions or recommendations beyond user requirements
- ✅ Support both CREATE and UPDATE modes
- ✅ Auto-detect project type and structure

## 🔄 Execution Guidelines

**CRITICAL**: 
- Start with user description → Verify with code → Generate/Update docs → Report completion
- Never stop for confirmation, execute all steps automatically
- If code not found, use user description and mark for implementation
- Preserve existing content when updating, only modify what changed
