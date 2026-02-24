---
name: gen-commit-message
description: Generates detailed, comprehensive commit messages based on staged git changes. Use when user wants to create a commit message, needs help writing commit descriptions, or before committing code. Analyzes file changes, detects change types (feat/fix/refactor/docs/chore), and produces structured messages following Conventional Commits format.
---

# Generate Commit Message

## Overview

Generates comprehensive commit messages by analyzing staged changes. Produces structured messages that capture all meaningful changes, not just a generic summary.

## Workflow

### 1. Gather Changes

Run these commands to analyze staged changes:

```bash
# Get list of staged files with status
git diff --cached --name-status

# Get detailed diff for content analysis
git diff --cached --stat

# Get full diff for deep analysis (if needed)
git diff --cached
```

### 2. Analyze Changes

For each changed file, identify:
- **Change type**: Added (A), Modified (M), Deleted (D), Renamed (R)
- **File category**: code, config, docs, test, asset
- **Change scope**: feature name, module, component

### 3. Determine Commit Type

Use Conventional Commits prefix based on primary change:

| Type | Description |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or updating tests |
| `chore` | Build, config, maintenance tasks |
| `perf` | Performance improvements |

### 4. Generate Message Structure

```
<type>(<scope>): <short summary - max 72 chars>

<body - grouped by feature/functionality>

- [Feature/Functionality 1]: <what was achieved>
  - Sub-detail if needed
- [Feature/Functionality 2]: <what was achieved>
...

<footer - optional: breaking changes, issues>
```

### 5. Message Guidelines

**Title line (required)**:
- Max 72 characters
- Imperative mood ("Add feature" not "Added feature")
- No period at end

**Body (recommended for multiple changes)**:
- Blank line after title
- Wrap at 72 characters
- **Group by FEATURE/FUNCTIONALITY**, not by files
- Describe WHAT the feature does, not just which files changed
- Use bullet points for clarity
- Explain WHAT and WHY, not HOW

**Feature-focused grouping**:
- Group related file changes under one feature bullet
- Focus on user-facing or developer-facing impact
- Example: "Authentication flow" instead of listing auth.js, login.vue, etc.

**Footer (optional)**:
- Breaking changes: `BREAKING CHANGE: <description>`
- Issue references: `Closes #123`, `Fixes #456`
- ⛔ **DO NOT include**: `Generated with...`, `Co-Authored-By...`, or any AI attribution

## Example Output

For input with multiple file changes across features:

```
feat(jai1): Add commit message generation and safe commit workflow

- Commit Message Generation: Implement skill to analyze staged changes
  and generate detailed messages following Conventional Commits format
- Safe Commit Workflow: Create verification pipeline with security checks
  for sensitive data, large files, and common mistakes
- Deployment Skills: Add Netlify and Cloudflare deployment automation
  with configuration detection and initialization support
```

**❌ Avoid file-focused messages**:
```
# BAD - Lists files instead of features
- Modified auth.js: Added login function
- Modified login.vue: Added form
- Modified api.js: Added endpoint
```

**✅ Prefer feature-focused messages**:
```
# GOOD - Groups by feature
- User Authentication: Implement login flow with form validation
  and API integration
```

## Usage Notes

- Always analyze actual diff content, not just filenames
- Group logically related changes in the body
- Highlight breaking changes prominently
- For single-file changes, body may be omitted if title is sufficient
