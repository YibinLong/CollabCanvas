# TDD Workflow Guide

## Why We Reordered the Tasks

Your PRD specifies **Test-Driven Development (TDD)**. The original task list had all testing in Phase 7, which meant:
- ❌ Write code first
- ❌ Write tests later
- ❌ Tests become an afterthought

This is **NOT TDD**. True TDD means:
- ✅ Write tests FIRST (they fail)
- ✅ Write code to make tests pass
- ✅ Tests drive the design

## The New Structure (39 PRs Instead of 28)

### Phase 1: Foundation (PRs 1-3)
1. **PR #1**: Project Setup
2. **PR #2**: Database Schema  
3. **PR #3**: **Testing Infrastructure** ← Moved to Phase 1! 🎯

**Why:** You MUST set up Jest and testing tools BEFORE writing any feature tests.

---

### Phase 2-6: Features with TDD (PRs 4-29)

Each feature now follows this pattern:

#### Example: Canvas Basic UI
- **PR #4**: Canvas Tests - Basic UI ← Write FAILING tests first ✍️
- **PR #5**: Canvas Implementation - Basic UI ← Make tests PASS ✅

#### Example: Shape Manipulation
- **PR #6**: Shape Tests ← Write FAILING tests first ✍️
- **PR #7**: Shape Implementation ← Make tests PASS ✅

This pattern repeats for:
- Canvas features (PRs 4-9)
- Real-time collaboration (PRs 10-15)
- Backend & Persistence (PRs 16-19)
- Authentication (PRs 20-23)
- AI Integration (PRs 24-29)

---

### Phase 7-9: Polish, Deploy, Launch (PRs 30-39)
- Performance optimization
- Security hardening
- UI polish
- Deployment
- Final testing and documentation

## TDD Cycle for Each Feature

```
1. 📝 PR N (Tests): Write failing tests
   └─ Tests describe WHAT the code should do
   └─ Run tests → They should FAIL (red)
   
2. ⏳ Review: Ensure tests are correct and comprehensive

3. 💻 PR N+1 (Implementation): Write code
   └─ Write ONLY enough code to make tests pass
   └─ Run tests → They should PASS (green)
   └─ DO NOT modify tests (unless they were wrong)
   
4. 🔄 Refactor: Clean up code while keeping tests green
```

## Key Rules

1. **Never modify tests to make them pass** (unless the test was incorrect)
2. **Tests must fail first** before writing implementation
3. **Each test PR is paired with an implementation PR**
4. **Focus on core functionality** - test the happy path, not every edge case
5. **Run all tests before merging each PR**

## Test Philosophy: Simplified & Practical

We're following **pragmatic TDD**, not dogmatic TDD:
- ✅ Test core features and main user flows
- ✅ Test that the happy path works
- ❌ Don't test every edge case upfront
- ❌ Don't aim for 100% coverage
- ❌ Don't write tests for trivial getters/setters

**Goal**: Confidence that core functionality works, not exhaustive test suites.

## Example: How to Work Through Canvas Features

### Step 1: PR #4 (Canvas Tests)
```bash
# Create test files
touch frontend/__tests__/Canvas.test.tsx
touch frontend/__tests__/stores/canvasStore.test.ts

# Write tests that describe expected behavior
# Run tests: npm test
# Result: ALL TESTS FAIL ❌ (this is expected!)
```

### Step 2: PR #5 (Canvas Implementation)
```bash
# Now implement the actual Canvas component
# Implement pan/zoom functionality
# Implement shape rendering

# Run tests: npm test  
# Result: ALL TESTS PASS ✅
```

### Step 3: Move to Next Feature
Repeat for Shape Manipulation (PR #6 tests → PR #7 implementation)

## Benefits of This Approach

✅ **Better Design**: Tests force you to think about the API before implementation  
✅ **Confidence**: If tests pass, the feature works  
✅ **Regression Protection**: Tests catch bugs when you change code later  
✅ **Documentation**: Tests serve as examples of how to use the code  
✅ **Faster Debugging**: When a test fails, you know exactly what broke

## What This Means for You as a Beginner

### Traditional Approach (❌ Not TDD):
1. Write canvas component
2. Manually test by clicking around
3. Find bugs
4. Fix bugs
5. Write tests later (maybe)

**Problem**: You might miss edge cases, and changing code later is scary.

### TDD Approach (✅ Proper):
1. Write test: "When user drags on canvas, shape should move"
2. Run test → It fails (no code yet)
3. Write code to make test pass
4. Test passes → Feature done!
5. Tests prevent future bugs

**Benefit**: You know EXACTLY what you're building, and tests protect your work.

## Timeline Impact

- **Original estimate**: 8-12 weeks (28 PRs)
- **New TDD estimate**: 10-14 weeks (39 PRs)
- **Why longer**: Writing tests takes time upfront
- **Why worth it**: Saves MUCH more time debugging and fixing bugs later

## Getting Started

When you're ready to start:
1. Begin with PR #1 (Project Setup)
2. Then PR #2 (Database Schema)
3. **Then PR #3 (Testing Setup)** ← Don't skip this!
4. Then PR #4 (Your FIRST test PR) ← This is where TDD truly begins

## Questions to Ask Yourself Before Each PR

### Before a Test PR:
- [ ] What behavior am I testing?
- [ ] What are the edge cases?
- [ ] How should errors be handled?
- [ ] What should the API look like?

### Before an Implementation PR:
- [ ] Did I run the tests and see them fail?
- [ ] Am I writing only enough code to pass the tests?
- [ ] Do all tests pass now?
- [ ] Is there any refactoring needed?

---

**Remember**: Tests are not a chore—they're your safety net and guide! 🎯

