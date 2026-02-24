---
description: Submit feedback, bug reports, feature requests, or suggestions to jai1 team via CLI
agent: build
---

# Feedback Workflow

> **Goal**: Help users submit feedback (bug reports, feature requests, suggestions) to the jai1 server easily.
> **Tool**: Use `jai1 feedback` CLI command (global npm package `@jvittechs/jai1-cli`) to submit.

## ⚠️ CRITICAL RULES

1. ✅ **Gather required information** - Must have: type, title, message before sending
2. ✅ **Auto-collect context** - Automatically collect useful context for bug reports (no need to ask)
3. ✅ **Confirm before sending** - Always show preview and ask user to confirm
4. ✅ **English** - Output in English
5. ✅ **Clean output** - Do NOT show implementation details, shell escaping notes, or internal workflow steps to user
6. ✅ **CLI binary verification** - Use `which jai1` to verify CLI exists, do NOT grep for "jai1" (to avoid confusion with `.jai1` directory)

---

## 📋 Feedback Types

| Type | Description | When to use |
|------|-------------|-------------|
| `bug` | Bug report | Found a bug, crash, unexpected behavior |
| `feature` | Feature request | Propose a new feature |
| `suggestion` | Improvement suggestion | Suggest UX/UI, performance, docs improvements, etc. |

---

## 🔄 Workflow Steps

### Step 1: Identify Feedback Type

**ACTIONS**:
1. **Ask or analyze user input** to determine type:

```markdown
📝 What type of feedback would you like to submit?

1. 🐛 **Bug** - Report errors, crashes, unexpected behavior
2. ✨ **Feature** - Request a new feature
3. 💡 **Suggestion** - Suggest improvements

Or describe your issue, and I'll categorize it for you.
```

**If user describes directly** → Analyze and suggest appropriate type.

---

### Step 2: Collect Title

**ACTIONS**:
1. **Request a brief title** (max 200 characters):

```markdown
📌 **Feedback title** (max 200 characters):

Examples:
- Bug: "CLI crashes when running sync with large files"
- Feature: "Add --dry-run option for deploy command"
- Suggestion: "Improve indexing speed"
```

2. **Validate**:
   - Cannot be empty
   - Max 200 characters
   - If too long → suggest shortening

---

### Step 3: Collect Message

**ACTIONS**:
1. **Request detailed description** (max 4000 characters):

```markdown
📝 **Detailed description** (max 4000 characters):

Please provide:
```

**Suggest different content based on type:**

#### For Bug:
```markdown
- **Steps to reproduce**: Steps to encounter the bug
- **Expected result**: What should have happened
- **Actual result**: What actually happened
- **Error message** (if any): Copy paste the error
```

#### For Feature:
```markdown
- **Use case**: Why do you need this feature?
- **Feature description**: How should the feature work?
- **Example**: If possible, provide a specific example
```

#### For Suggestion:
```markdown
- **Current problem**: What's not working well?
- **Proposed improvement**: How do you think it should be improved?
- **Benefits**: What benefits would this improvement bring?
```

---

### Step 4: Auto-Collect Context

**ACTIONS**:

1. **Verify CLI exists first** (silent check, do not show to user):

```bash
# Verify jai1 CLI binary exists - use `which` command, NOT grep
which jai1
# Expected: /path/to/node/bin/jai1 (symlink to @jvittechs/jai1-cli)
```

2. **Automatically collect context** for bug reports (no confirmation needed):

```bash
# Get system information
node -v
npm -v
jai1 --version
uname -a
```

2. **Format context as JSON**:

```json
{
  "jai1_version": "1.0.0",
  "node_version": "v20.10.0",
  "os": "darwin",
  "os_version": "24.0.0",
  "project_type": "next.js",
  "additional_info": "..."
}
```

3. **For non-bug feedback**: Collect minimal context (jai1 version, OS) automatically without asking.

---

### Step 5: Preview and Confirm

**ACTIONS**:
1. **Display full preview**:

```markdown
## 📋 Feedback Preview

| Field | Value |
|-------|-------|
| **Type** | 🐛 Bug |
| **Title** | CLI crashes when running sync with large files |

**Message**:
> When running `jai1 sync` with a project containing over 1000 files, CLI crashes with error...
> 
> Steps to reproduce:
> 1. Create a project with many files
> 2. Run `jai1 sync`
> 3. Crashes after 30 seconds

**Context** (auto-collected):
```json
{
  "jai1_version": "1.0.0",
  "node_version": "v20.10.0",
  "os": "darwin"
}
```

---

✅ **Submit this feedback?**
- [Y] Submit now
- [E] Edit
- [C] Cancel
```

---

### Step 6: Submit Feedback

**ACTIONS**:

1. **Build command** (internal - do NOT show these implementation details to user):

> **INTERNAL NOTE** (do NOT display to user):
> - Escape double quotes inside double-quoted arguments: `\"`
> - For JSON context, use single quotes outside and double quotes inside
> - Never show shell escaping notes or warnings to user

```bash
jai1 feedback \
  --type "<type>" \
  --title "<title>" \
  --message "<message>" \
  --context '<json_context>'
```

2. **Execute and handle response** (silently execute, only show result to user):

```bash
# Run command - execute silently, only report success/failure
jai1 feedback --type "bug" --title "CLI crashes..." --message "..." --context '{"jai1_version":"1.0.0"}'
```

3. **Handle results**:

| Response | Action |
|----------|--------|
| Success | Display success message |
| Network Error | Suggest trying again later |
| Validation Error | Display error and suggest fix |

---

### Step 7: Completion

**SUCCESS**:
```markdown
## ✅ Feedback submitted successfully!

Thank you for your contribution. The jai1 team will review and respond as soon as possible.

**Summary**:
- Type: Bug
- Title: CLI crashes when running sync with large files
- ID: fb_abc123 (if returned by server)

💡 You can track your feedback at: https://jai1.dev/feedback (if available)
```

**ERROR**:
```markdown
## ❌ Failed to submit feedback

**Error**: [Error message from CLI]

**Suggestions**:
- Check your internet connection
- Try again in a few minutes
- Or send directly via: support@jai1.dev
```

---

## 🚀 Quick Commands

This workflow also supports quick commands with complete information:

```
/feedback bug "Title here" "Message here"
/feedback feature "Title" "Detailed message"
/feedback suggestion "Title" "Message"
```

**If user uses quick command**:
1. Parse type, title, message from command
2. Skip collection steps
3. Go directly to Step 4 (Context) or Step 5 (Preview)

---

## ⚙️ CLI Reference

```bash
jai1 feedback -h
Usage: jai1 feedback|report [options]

Submit bug reports, feature requests, or suggestions

Options:
  --type <type>        Feedback type: bug, feature, suggestion
  --title <title>      Feedback title (max 200 chars)
  --message <message>  Feedback message (max 4000 chars)
  --context <json>     Additional context as JSON
  --no-context         Do not include automatic context
  --json               Output JSON format
  -h, --help           display help for command
```

---

## ✅ Quality Checklist

- [ ] Type identified (bug/feature/suggestion)
- [ ] Title is clear and concise (≤200 chars)
- [ ] Message is detailed enough (≤4000 chars)
- [ ] Context collected automatically
- [ ] User confirmed preview
- [ ] Feedback submitted successfully
- [ ] User notified of result
- [ ] No internal implementation details shown to user (no shell escaping notes, no "Modified File" messages)

---

## 🚫 DO NOT Show to User

The following should NEVER appear in user-facing output:
- Shell escaping instructions or warnings
- "Modified File: @.jai1/workflows/..." messages
- Internal command building details
- Technical notes about quote escaping
- `which jai1` or CLI verification output

Only show: Preview → Confirmation → Success/Error result
