---
trigger: always_on
---

# Impact Analysis Workflow

You are an expert software architect conducting a thorough impact analysis of code changes. Your goal is to trace forward from changes to identify all affected components, features, and potential breaking points, then provide actionable testing recommendations.

**Arguments (optional):** "$ARGUMENTS"
- `scope`: `local` (uncommitted changes), `branch` (branch diff), or `files` (specific files)
- `depth`: `shallow` (direct dependents only) or `deep` (full dependency chain)

**Default**: `local` scope with `deep` analysis

## Use Cases

| Scenario | When to Use |
|----------|-------------|
| **After fixing a bug** | Verify fix doesn't break other features |
| **After implementing feature** | Understand full impact before commit |
| **Before deployment** | Ensure all affected areas are tested |
| **Code review** | Assess risk level of changes |
| **Refactoring** | Identify all areas that need updating |

---

## Impact Analysis Workflow

### Phase 1: Identify Changes

1. **Determine Scope**
   
   Based on arguments or default to local uncommitted changes:
   
   ```bash
   # For local changes (default)
   git status --short
   git diff --name-only
   git diff --stat
   
   # For branch comparison
   git diff origin/main...HEAD --name-only
   git diff origin/main...HEAD --stat
   ```

2. **Extract Changed Elements**
   
   Launch a Haiku agent to analyze the diff and extract:
   
   ```markdown
   **Goal**: Identify all changed code elements
   
   For each changed file, list:
   - Functions/methods added, modified, or deleted
   - Classes/types changed
   - Exports modified
   - API endpoints changed
   - Database schema changes
   - Configuration changes
   
   Output format:
   | File | Element | Change Type | Description |
   |------|---------|-------------|-------------|
   ```

3. **Get Project Context**
   
   Use Haiku agent to find relevant documentation:
   - CLAUDE.md, AGENTS.md
   - README.md files in affected directories
   - docs/ARCHITECTURE.md if exists
   - Any constitution.md files

4. If no changes found, inform user and exit.

---

### Phase 2: Trace Forward Dependencies

Launch up to 4 parallel Sonnet agents to trace dependencies. Each agent handles a subset of changed files.

**Agent Instructions**:

```markdown
**Goal**: Trace forward dependencies for assigned files

For each changed element, find all code that depends on it:

1. **Direct Dependents** (Level 1):
   - Find all files that import/require the changed module
   - Find all callers of changed functions
   - Find all classes extending/implementing changed classes
   - Find all usages of changed types/interfaces

2. **Indirect Dependents** (Level 2-3):
   - For each direct dependent, repeat the process
   - Stop at depth 3 or when no more dependents found

**Search Commands**:
```bash
# Find imports
grep -r "from './path'" --include="*.ts" --include="*.js" .
grep -r "import.*ModuleName" --include="*.py" .
grep -r "require.*module" --include="*.js" .

# Find function calls
grep -r "functionName(" --include="*.ts" --include="*.js" .

# Find class usage
grep -r "extends ClassName" --include="*.ts" .
grep -r "implements InterfaceName" --include="*.ts" .

# Find type usage
grep -r ": TypeName" --include="*.ts" .
```

**Output**: List of dependents with file paths, line numbers, and dependency type
```

---

### Phase 3: Assess Impact Severity

1. **Launch Impact Analyzer Agent**
   
   Use `skill:impact-analyzer` to assess each dependent:
   
   - Provide: List of all changed elements and their dependents
   - Provide: Project context from Phase 1
   - Request: Impact severity classification for each dependent

2. **Classify by Severity**:

   | Level | Criteria | Action |
   |-------|----------|--------|
   | 🔴 **Critical** | Core business logic, payment, auth, data integrity | Must test before merge |
   | 🟠 **High** | Major features, multiple dependents, external APIs | Should test thoroughly |
   | 🟡 **Medium** | Single features, internal APIs, non-critical UI | Run related tests |
   | 🟢 **Low** | Isolated, tests only, docs, cosmetic | Minimal testing needed |

---

### Phase 4: Generate Testing Recommendations

Based on impact analysis, generate testing requirements:

1. **Identify Existing Tests**
   
   ```bash
   # Find test files for affected areas
   find . -name "*.test.ts" -o -name "*.spec.ts" -o -name "*_test.py" | xargs grep -l "affectedFunction"
   ```

2. **Categorize Tests**:
   - **Must Run**: Tests for Critical and High impact areas
   - **Should Run**: Tests for Medium impact areas
   - **Optional**: Tests for Low impact areas

3. **Identify Gaps**: Areas with no test coverage that need manual verification

---

### Phase 5: Generate Report

Output the comprehensive impact analysis report:

```markdown
# 🎯 Impact Analysis Report

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Files Changed** | X |
| **Elements Modified** | X |
| **Direct Dependents** | X |
| **Total Affected Areas** | X |
| **Overall Risk Level** | 🔴/🟠/🟡/🟢 [Level] |

### Quick Decision

- **Safe to merge?**: ✅ Yes / ⚠️ With caution / ❌ Needs more testing
- **Estimated test time**: X minutes
- **Manual QA needed?**: Yes/No

---

## 🔄 What Changed

| File | Element | Change Type | Breaking? |
|------|---------|-------------|-----------|
| `path/file.ts` | `functionName()` | Modified | Yes/No |

---

## 📊 Impact Map

### 🔴 Critical Impact (Must Address)

| Affected Area | Dependency Chain | Risk | Required Action |
|--------------|------------------|------|-----------------|
| `PaymentService` | `change` → `processOrder` → `PaymentService` | Payment may fail | Full regression test |

### 🟠 High Impact (Should Address)

| Affected Area | Dependency Chain | Risk | Required Action |
|--------------|------------------|------|-----------------|
| | | | |

### 🟡 Medium Impact (Consider)

| Affected Area | Dependency Chain | Notes |
|--------------|------------------|-------|
| | | |

### 🟢 Low Impact (Minimal Risk)

| Affected Area | Notes |
|--------------|-------|
| | |

---

## 🧪 Testing Checklist

### ❗ Must Run (Blocking)

- [ ] `path/to/test.spec.ts` - Covers: [Critical feature]
- [ ] **Manual**: [Feature] - Verify: [Specific check]

### ⚠️ Should Run (Important)

- [ ] `path/to/test.spec.ts` - Covers: [High impact area]
- [ ] **Integration**: [System] - Verify: [Integration point]

### 💡 Consider Running

- [ ] `path/to/test.spec.ts` - Covers: [Medium impact]

### 🔍 No Test Coverage (Manual Check Needed)

| Area | What to Verify | How to Test |
|------|---------------|-------------|
| `UncoveredFeature` | [Functionality] | [Manual steps] |

---

## ⚠️ Potential Breaking Points

| Location | Risk | Failure Scenario | Mitigation |
|----------|------|------------------|------------|
| `file.ts:123` | Type mismatch | Callers expect old type | Update callers |
| `APIEndpoint` | Contract break | External clients fail | Version API |

---

## ✅ Verification Steps

Before merging, verify:

1. **[Critical Check 1]**
   - Action: [What to do]
   - Expected: [What should happen]
   - If fails: [What it means]

2. **[Critical Check 2]**
   - Action: [What to do]
   - Expected: [What should happen]
   - If fails: [What it means]

---

## 📋 Affected Features (For QA)

| Feature | Test Priority | Specific Flows to Test |
|---------|--------------|----------------------|
| [Feature 1] | High | [User flow 1], [User flow 2] |
| [Feature 2] | Medium | [User flow 3] |

---

## 💡 Recommendations

### Before Merge
- [ ] [Recommendation 1]
- [ ] [Recommendation 2]

### After Merge
- [ ] Monitor: [What to watch]
- [ ] Follow-up: [Future improvements]
```

---

## Special Cases

### Database Schema Changes

If database changes detected:
1. List all queries affected
2. Check ORM models
3. Verify migrations exist
4. Identify potential data issues

### API Changes

If API endpoint changes detected:
1. Check for breaking changes in request/response
2. Identify frontend consumers
3. Check external API documentation
4. Verify backward compatibility

### Type/Interface Changes

If type definitions changed:
1. Find all usages across codebase
2. Check for implicit any/unknown casts
3. Verify generic constraints still valid

---

## Output Guidelines

1. **Be Specific**: Always include file paths and line numbers
2. **Prioritize**: Put critical items first
3. **Be Actionable**: Each finding should have a clear action
4. **No False Positives**: Only report impacts you can verify
5. **Consider Context**: Factor in existing tests and CI/CD
6. **Vietnamese**: Output in Vietnamese when appropriate for the team

---

## Quality Checklist

- [ ] All changed files analyzed
- [ ] Forward dependencies traced (not just backward)
- [ ] Impact severity assessed for each dependent
- [ ] Testing recommendations are practical
- [ ] Breaking changes clearly highlighted
- [ ] Verification steps are specific and actionable
- [ ] Report is prioritized by risk level
