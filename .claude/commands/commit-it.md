---
description: Safe commit workflow - Generate detailed commit message, verify security/quality, then commit
---

# Commit-It Workflow

Safe commit workflow with security checks and detailed commit message generation.

## 🚨 STOP - READ THIS FIRST

**When you find keyword matches (token, secret, password, etc.):**

❌ **WRONG**: Stop and ask "I found sensitive patterns, do you want to proceed?"
❌ **WRONG**: Say "I need your confirmation before proceeding"
❌ **WRONG**: Block because you found the word "token" or "secret"

✅ **CORRECT**: Silently analyze each match → Only block if you find REAL secret values

**REAL secrets look like this:**
- `sk-proj-abc123def456ghi789jkl012mno345pqr` (actual API key)
- `ghp_1a2b3c4d5e6f7g8h9i0jklmnopqrstuvwxyz` (actual GitHub token)
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U` (actual JWT)
- `-----BEGIN RSA PRIVATE KEY-----` (actual private key content)

**These are NOT secrets (never block for these):**
- `"Use token authentication"` → just documentation
- `process.env.API_KEY` → just a variable reference
- `token: "<your-token>"` → just a placeholder
- `Authorization: Bearer sk-xxx...` → just an example in docs
- `## Credential Management` → just a heading
- `validateToken()` → just a function name

---

## ⚠️ CRITICAL RULES

1. **COMPLETE ANALYSIS FIRST** - Never stop at "I found matches". Always analyze what the matches contain.
2. **BLOCK ONLY WITH REAL VALUES** - Block only if you find actual API keys, actual passwords, actual tokens (see examples above)
3. **DOCUMENTATION IS ALWAYS SAFE** - `.md` files mentioning "token" or "secret" are documentation, not leaks
4. Use `skill:gen-commit-message` to generate detailed message

## 🔄 WORKFLOW PHASES

### Phase 0: Smart Staging (Auto-detect & Stage)

First, check for staged files:

```bash
git diff --cached --name-only
```

**If staged files exist** → Go to Phase 2 (Security & Quality Verification)

**If NO staged files** → Check for unstaged changes:

```bash
git status --porcelain
```

**Interpreting `git status --porcelain` output:**
- `M  file` (M in first column) → staged modification
- ` M file` (M in second column) → unstaged modification  
- `A  file` → staged new file
- `?? file` → untracked file
- ` D file` → unstaged deletion
- `D  file` → staged deletion

**If unstaged/untracked changes exist:**

1. Display the changes clearly:
   ```
   📋 Found unstaged changes:
   
   Modified files:
     - packages/server/src/modules/components/components.handler.ts
     - scripts/sync-framework.ts
   
   Untracked files (new):
     - src/new-feature.ts
   ```

2. Ask user what to stage:
   ```
   What would you like to commit?
   
   1. All changes (git add -A)
   2. Modified files only (git add -u)  
   3. Let me select specific files
   4. Cancel
   ```

3. Based on user choice:
   - **Option 1**: `git add -A` (stages all: modified, deleted, untracked)
   - **Option 2**: `git add -u` (stages modified and deleted, NOT untracked)
   - **Option 3**: Ask user to list files, then `git add <files>`
   - **Option 4**: Exit workflow

4. After staging, verify files were staged:
   ```bash
   git diff --cached --name-only
   ```

**If still no staged files and no unstaged changes** → Notify user:
```
✅ Working directory is clean. Nothing to commit.
```

### Phase 1: Pre-flight Summary

Display what will be committed:

```bash
git diff --cached --stat
```

```
📦 Files to be committed:
  packages/server/src/modules/components/components.handler.ts | 12 +++++-----
  scripts/sync-framework.ts                                    |  8 ++++---
  
  2 files changed, 11 insertions(+), 9 deletions(-)
```

### Phase 2: Security & Quality Verification

#### 2.1 Sensitive Data Check

```bash
git diff --cached | grep -nE "(password|secret|api_key|apikey|api-key|token|private_key|privatekey|credential|auth_token|access_token|bearer)" || true
```

**If NO matches** → Log `✅ No sensitive patterns` → Go to 2.2

**If matches found** → Analyze each match:

```
FOR each matched line:
  Extract the VALUE (not the keyword)
  
  Is the value a REAL secret? Check for:
  - Real API key prefix: sk-proj-, sk-, ghp_, xoxb-, AKIA
  - High entropy: 20+ random alphanumeric characters  
  - JWT format: eyJ...base64...base64
  - Private key: -----BEGIN...KEY-----
  - Connection string with password: postgres://user:actualpass@host
  
  If YES → Add to dangerous_list with specific reason
  If NO → It's safe, continue checking
```

**After analyzing ALL matches:**

```
IF dangerous_list is EMPTY:
  Log: "✅ Sensitive-pattern scan: PASSED (analyzed N matches, all safe)"
  → CONTINUE TO NEXT CHECK (2.2)
  → DO NOT ASK USER ANYTHING

IF dangerous_list has items:
  Log: "⛔ POTENTIAL SECRETS DETECTED"
  Show each: "{file}:{line}: {content}" + "{reason}"
  → ASK user to confirm or fix
```

#### 2.2 Large File Check

```bash
git diff --cached --name-only | while read file; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file" 2>/dev/null || echo 0)
    if [ "$size" -gt 1048576 ]; then
      echo "LARGE FILE: $file ($(($size / 1024 / 1024))MB)"
    fi
  fi
done
```

**If large files found**: Ask user about Git LFS.

#### 2.3 Common Mistake Check

```bash
git diff --cached --name-only | grep -iE "(\.env$|\.env\.local|\.env\.production|node_modules|\.DS_Store|Thumbs\.db|\.log$|\.tmp$|\.bak$|\.swp$|__pycache__|\.pyc$|\.idea/|\.vscode/settings\.json)" || true
```

**Warning only** - do not block.

#### 2.4 Debug/Console Check

```bash
git diff --cached | grep -E "(console\.log|debugger|print\(|var_dump|dd\(|dump\(|TODO:|FIXME:|XXX:|HACK:)" || true
```

**Warning only** - do not block.

#### 2.5 Conflict Markers Check

```bash
git diff --cached | grep -E "^(\+.*)?(<<<<<<<|=======|>>>>>>>)" || true
```

**If found**: STOP - conflict markers must be resolved.

#### 2.6 Package Directories Check

```bash
git diff --cached --name-only | grep -E "^(node_modules/|vendor/|packages/node_modules/|.pnpm/)" || true
```

**If found**: STOP - offer to create .gitignore.

### Phase 3: Generate Commit Message

Use `skill:gen-commit-message` to analyze and generate message.

### Phase 4: User Confirmation

Display:
1. Summary of staged files
2. Verification results (only show warnings if any)
3. Generated commit message

Ask: "Proceed with this commit? (y/n/edit)"

### Phase 5: Execute Commit

```bash
git commit -m "<commit_message>"
git log -1 --oneline
```

## 📋 VERIFICATION SUMMARY

| Check | Severity | Action |
|-------|----------|--------|
| Real secrets (actual API keys/tokens) | 🔴 HIGH | STOP - Show specific lines |
| Large files (>1MB) | 🔴 HIGH | STOP - Suggest Git LFS |
| Conflict markers | 🔴 HIGH | STOP - Must resolve |
| Package directories | 🔴 HIGH | STOP - Offer .gitignore |
| .env files | 🟡 MEDIUM | WARN only |
| Debug code | 🟢 LOW | WARN only |
| Keyword mentions in docs | ⚪ NONE | IGNORE - Not a secret |

## 🔄 QUICK COMMIT MODE

If user says `/commit-it all` or `/commit-it -a`:
- Skip the staging menu
- Automatically run `git add -A`
- Proceed directly to security checks

If user says `/commit-it .` or specifies paths:
- Stage only the specified paths
- Proceed to security checks

## ✅ SUCCESS OUTPUT

```
✅ Commit successful!

Commit: abc1234
Message: feat(module): Add new feature

Files changed: 3
Insertions: +45
Deletions: -12
```
