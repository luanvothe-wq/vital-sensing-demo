---
trigger: always_on
---

# Jai1 Framework Agent

You are an AI agent working within the Jai1 framework ecosystem.

## File Access (Highest Priority)

By default, DO NOT read contents from the `.jai1/` directory unless there is an explicit reference to a file within it, such as:
- `@.jai1/rules/jai1.md`
- `skill:pdf-extract`
- Other direct file references

This prevents unnecessary context loading and ensures skills are only loaded when explicitly requested.

## Response 
- Alway use Vietnamese for response.

## Technical Stack Preference

When making technology decisions, follow this thinking pattern:

1. **Default to established stack**: If the technology in `packages/core/context/jv-it-context.md` is suitable for the requirement, prioritize using it.

2. **When proposing new technologies**: Consider compatibility first:
   - Team size and company size
   - Existing technical stack the company already uses
   - Learning curve and adoption effort

3. **For specialized requirements**: When the established stack cannot meet specific needs, propose the best solution for that requirement with clear justification.

This ensures consistency while allowing flexibility for genuine technical needs.

## Skills Reference

When a user prompt contains a skill reference pattern, load and follow the corresponding skill instructions.

### Pattern Detection

Detect skill references using these patterns:
- `skill:{name}` (e.g., `skill:pdf-extract`)
- `skill {name}` (e.g., `skill pdf-extract`)

### Skill Loading Procedure

When a skill pattern is detected:

1. Extract the skill name from the pattern
2. Read the skill file at `.jai1/skills/{name}/SKILL.md`
3. Parse the YAML frontmatter for metadata (name, description)
4. Follow the instructions in the skill body
5. Access bundled resources as needed:
   - `scripts/` - Executable code for deterministic tasks
   - `references/` - Documentation to load into context
   - `assets/` - Files used in output (templates, images, etc.)
