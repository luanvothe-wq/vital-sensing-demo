# Rule File Templates

Templates and patterns for each rule file type. Remember: these are **guidance patterns**, not full implementations.

## Common Frontmatter

All rule files require this frontmatter:

```yaml
---
trigger: always_on
description: <Brief description of file content>
---
```

---

## 01-project.md

**Purpose**: Project overview, architecture, structure, and commands.
**Target length**: 80-120 lines

### Template

```markdown
---
trigger: always_on
description: <Project name> project overview and architecture
---

# Project Overview

## Architecture

- **Pattern**: <Architecture pattern (REST API, SSR, SPA, etc.)>
- **Key Approach**: <1-2 key architectural decisions>

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | <name + version> |
| Language | <language + version> |
| Database | <if applicable> |
| <Other> | <as needed> |

## Project Structure

```
<simplified tree, max 15 lines>
```

## Development Commands

```bash
# Common commands (5-8 max)
<command>  # <description>
```

## API Format (if applicable)

### Success Response
```json
{ "data": { ... } }
```

### Error Response
```json
{ "message": "...", "errors": { ... } }
```
```

---

## 02-standards.md

**Purpose**: Coding standards, conventions, do's/don'ts.
**Target length**: 60-100 lines

### Template

```markdown
---
trigger: always_on
description: <Project name> coding standards and conventions
---

# Coding Standards

## Terms & Definitions

| Term | Action |
|------|--------|
| `refactor` | Improve structure, no behavior change |
| `optimize` | Improve performance, profile first |
| `fix bug` | Reproduce → test → fix → verify |

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| <type> | <convention> | <example> |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName` |
| Functions | camelCase + verb | `getUserById` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |

## Architecture Layers

| Layer | Responsibility |
|-------|---------------|
| <layer> | <1-line description> |

## Do's

- <bullet point guideline>
- <keep to 5-8 items>

## Don'ts

- <anti-pattern to avoid>
- <keep to 5-8 items>

## Security Checklist

- [ ] <security item>
- [ ] <keep to 4-6 items>
```

---

## 03-frontend.md

**Purpose**: Frontend-specific patterns and guidelines.
**Target length**: 50-80 lines

### Template

```markdown
---
trigger: always_on
description: Frontend development rules
---

# Frontend Guidelines

## Component Patterns

- <Component organization rule>
- <Naming convention>
- <Props pattern>

## State Management

- <State approach>
- <When to use what>

## Styling

- <CSS/Tailwind approach>
- <Naming conventions>
- <Dark mode handling>

## Forms

- <Form library usage>
- <Validation approach>

## Performance

- <Lazy loading rules>
- <Code splitting approach>

## Accessibility

- <Semantic HTML>
- <ARIA usage>
```

---

## 03-workspace.md (Monorepo variant)

**Purpose**: Monorepo workspace management.
**Target length**: 50-80 lines

### Template

```markdown
---
trigger: always_on
description: Monorepo workspace management
---

# Workspace Management

## Workspace Configuration

- <workspace tool config>
- <package structure>

## Package Dependencies

### Cross-Package References
<How to reference between packages>

### Dependency Placement

| Type | Location |
|------|----------|
| Shared dev | Root |
| App-specific | App package |

## TypeScript Configuration

- <tsconfig approach>
- <Project references>

## Common Scripts

| Script | Purpose |
|--------|---------|
| `dev` | <description> |
| `build` | <description> |

## Adding New Packages

1. <Step 1>
2. <Step 2>
```

---

## 04-backend.md

**Purpose**: Backend-specific patterns.
**Target length**: 50-80 lines

### Template

```markdown
---
trigger: always_on
description: Backend development rules
---

# Backend Guidelines

## Controller Pattern

- <Thin controllers rule>
- <Delegation pattern>
- <Response format>

## Service Layer

- <Business logic placement>
- <Transaction handling>
- <Error handling>

## Model/Entity Pattern

- <Data access approach>
- <Relationship handling>

## Validation

- <Validation approach>
- <Error response format>

## Authorization

- <Auth pattern>
- <Policy/Guard usage>

## Caching

- <Cache strategy>
- <Invalidation approach>

## Error Handling

- <Exception pattern>
- <Logging approach>
```

---

## 05-testing.md

**Purpose**: Testing guidelines.
**Target length**: 40-60 lines

### Template

```markdown
---
trigger: always_on
description: Testing standards
---

# Testing Guidelines

## Principles

| Principle | Description |
|-----------|-------------|
| Isolated | Tests don't depend on each other |
| Fast | Unit tests < 100ms |
| Readable | Test name describes behavior |

## Test Structure

```
describe('Component/Feature')
  describe('method/behavior')
    it('should do X when Y')
```

## Coverage Goals

| Type | Target |
|------|--------|
| Unit | 80%+ |
| Integration | Key flows |
| E2E | Critical paths |

## Mocking

- <When to mock>
- <Preferred mocking library>
```

---

## 06-workflow.md

**Purpose**: Git, CI/CD, deployment.
**Target length**: 30-50 lines

### Template

```markdown
---
trigger: always_on
description: Development workflow rules
---

# Workflow Guidelines

## Git Conventions

### Branch Naming
- `feature/<description>`
- `fix/<description>`
- `chore/<description>`

### Commit Messages
- Use conventional commits
- Format: `type(scope): message`

## Code Review Checklist

- [ ] Tests pass
- [ ] No console.logs
- [ ] Types are correct
- [ ] No security issues

## Deployment

- <Environment info>
- <Deploy command>
```

---

## 09-custom.md

**Purpose**: Template for user customizations.
**Target length**: 40-60 lines

### Template

```markdown
---
trigger: always_on
description: Project-specific customizations
---

# Project Customizations

This file is for team-specific rules that won't be overwritten by preset updates.

## Team Conventions

<!-- Add team-specific conventions here -->

## Project-Specific Patterns

<!-- Add project-specific patterns here -->

## External Integrations

<!-- Document external service integrations -->

## Notes

<!-- Other important notes -->
```

---

## Monorepo App/Package Files (04-08)

**Purpose**: Per-app/package technical stack and code standards.
**Target length**: 40-70 lines per file

**QUAN TRỌNG**: Mỗi app/package PHẢI có đủ 3 phần:
1. Technical Stack (table)
2. Structure (directory tree)
3. Coding Standards & Conventions (naming table + patterns + do's/don'ts)

### Template for 04-{app}.md, 05-{app}.md, 06-{app}.md

```markdown
---
trigger: always_on
description: <App name> (<apps/path>) development rules
---

# <App Name> (<apps/path>)

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | <framework + version> |
| Language | <language + version> |
| Runtime | <runtime + version> |
| Database | <if applicable> |
| Auth | <auth approach> |
| Key Deps | <important dependencies> |

## Structure

```
src/
├── <dir1>/        # <purpose>
├── <dir2>/        # <purpose>
├── <dir3>/        # <purpose>
└── index.ts       # Entry point
```

**Key directories:**
- `<dir1>`: <detailed description>
- `<dir2>`: <detailed description>

## Coding Standards & Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | <convention> | <example> |
| Classes | <convention> | <example> |
| Functions | <convention> | <example> |
| Variables | <convention> | <example> |

### Patterns

- <Pattern 1>: <how to use>
- <Pattern 2>: <how to use>
- <Pattern 3>: <how to use>

### Do's / Don'ts

- ✅ <good practice 1>
- ✅ <good practice 2>
- ❌ <anti-pattern 1>
- ❌ <anti-pattern 2>
```

### Template for 07-shared.md

**QUAN TRỌNG**: Mỗi package PHẢI có đủ 3 phần: Technical Stack, Structure, Coding Standards & Conventions

```markdown
---
trigger: always_on
description: Shared packages conventions
---

# Shared Packages

## Package Overview

| Package | Path | Purpose |
|---------|------|---------|
| @project/ui | packages/ui | Shared UI components |
| @project/utils | packages/utils | Shared utilities |
| @project/types | packages/types | Shared TypeScript types |

---

## @project/ui

### Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Styling | Tailwind CSS v4 |
| Build | tsup |

### Structure

```
src/
├── components/    # UI components
├── hooks/         # Shared hooks
└── index.ts       # Public exports
```

### Coding Standards & Conventions

#### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx` |
| Hooks | use + camelCase | `useDialog.ts` |
| Props | ComponentNameProps | `ButtonProps` |

#### Patterns

- Export all from `src/index.ts`
- One component per file
- Co-locate tests: `Button.test.tsx`

#### Do's / Don'ts

- ✅ Use Radix primitives for accessibility
- ✅ Support dark mode via CSS variables
- ❌ Don't use inline styles
- ❌ Don't import from other packages directly

---

## @project/utils

### Technical Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.x |
| Build | tsup |
| Testing | Vitest |

### Structure

```
src/
├── date/          # Date utilities
├── string/        # String utilities
├── validation/    # Validation helpers
└── index.ts       # Public exports
```

### Coding Standards & Conventions

#### Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `format-date.ts` |
| Functions | camelCase + verb | `formatDate()` |
| Constants | UPPER_SNAKE | `DEFAULT_FORMAT` |

#### Patterns

- Pure functions only (no side effects)
- Full TypeScript types (no `any`)
- Unit tests required for each function

#### Do's / Don'ts

- ✅ Document with JSDoc
- ✅ Handle edge cases
- ❌ Don't use external dependencies unless necessary
- ❌ Don't throw errors (return Result type)
```

### Template for 08-testing.md (Monorepo)

```markdown
---
trigger: always_on
description: Monorepo testing strategy
---

# Testing Strategy

## Test Types by Package

| Package | Unit | Integration | E2E |
|---------|------|-------------|-----|
| apps/api | ✓ | ✓ | - |
| apps/web | ✓ | - | ✓ |
| packages/ui | ✓ | - | - |
| packages/utils | ✓ | - | - |

## Running Tests

| Command | Scope |
|---------|-------|
| `pnpm test` | All packages |
| `pnpm --filter @project/api test` | API only |
| `pnpm --filter @project/web test` | Web only |

## Shared Test Utilities

- Location: `packages/test-utils/`
- Mocks: Shared mock factories
- Fixtures: Shared test data
```

---

## Writing Tips

1. **Use tables** for conventions and comparisons
2. **Use bullets** for pattern descriptions
3. **Avoid full code** - use pattern names and 2-3 line examples max
4. **No duplication** - each info in one file only
5. **Be concise** - every line should add value
