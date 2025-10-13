# PR Documentation Standard

**Purpose:** High-signal documentation. Be succinct. Avoid fluff.

---

## Structure

```
docs/pr-completions/pr#/
└── PR#_COMPLETION.md  (Required - keep it short)
```

Additional docs **only if critical**:
- `PR#_SETUP.md` - Only if user must do manual setup
- `PR#_ISSUES.md` - Only if significant bugs/blockers encountered

---

## PR#_COMPLETION.md Template

**Keep it under 100 lines unless absolutely necessary.**

```markdown
# PR#X: [Title]

**Status:** ✅ Complete | **Date:** [Date]

## Built
- [Key item 1]
- [Key item 2]
- [Key item 3]

## Files
**Core:**
- path/to/file.ts - [one line description]

**Config:**
- path/to/config - [one line description]

## Tests
```
✅ [Test category] - X passing
✅ [Test category] - Y passing
```

## Issues Fixed
1. **[Problem]** - [Solution in one sentence]
2. **[Problem]** - [Solution in one sentence]

## Verify
```bash
# Command to verify it works
npm run test
```

**Expected:** [What success looks like]

## Next
PR#[X+1]: [Next PR title]
```

---

## Implementation Summary (Optional)

**Create PR#_IMPLEMENTATION.md ONLY if:**
- New architecture pattern introduced
- Complex algorithm needs explanation
- Non-obvious design decisions made

**Max 50 lines.** Focus on WHY, not WHAT.

```markdown
# PR#X Implementation

## Key Decisions
1. **[Decision]** - [Why in 1-2 sentences]
2. **[Decision]** - [Why in 1-2 sentences]

## Architecture
[Diagram or brief explanation if critical]

## For Beginners
[Only if introducing new concepts - keep to 3-4 bullet points]
```

---

## Setup Guide (Optional)

**Create PR#_SETUP.md ONLY if user must:**
- Create external accounts (Supabase, OpenAI, etc.)
- Configure API keys
- Run manual database migrations

**Format:**
```markdown
# PR#X Setup

## Required
1. [Action] - [Why]
2. [Action] - [Why]

## Commands
```bash
[Exact commands to run]
```

## Verify
```bash
[Command to check it worked]
```

**Expected:** [Success criteria]

## Troubleshooting
- **Error X:** [Fix]
- **Error Y:** [Fix]
```

---

## Rules

### ✅ DO:
- Be concise - every word must earn its place
- Use code blocks for commands, not prose
- List files without redundant descriptions
- Combine related information
- Skip obvious explanations

### ❌ DON'T:
- Write walls of text
- Repeat information from PRD or TASK_LIST
- Add motivational fluff (🎉 "Congratulations!")
- Explain common concepts (what TypeScript is, etc.)
- Create separate files for minor troubleshooting
- Add "Tips" or "Best Practices" sections
- Include version numbers or dates in multiple places

---

## File Locations

| Type | Location |
|------|----------|
| PR completions | `docs/pr-completions/pr#/` |
| Architecture | `docs/architecture/` |
| Guides | `docs/guides/` |
| Archive | `docs/archive/` |

**Root folder:** Only `README.md`, `TASK_LIST.md`, `PRD.md`

---

## Checklist

When completing a PR:

1. Create `docs/pr-completions/pr#/PR#_COMPLETION.md`
2. Update `TASK_LIST.md` - mark PR complete
3. Update `docs/README.md` - add to navigation
4. Only add additional docs if truly necessary

---

**Updated:** October 13, 2025

