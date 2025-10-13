# Documentation Index

This folder contains all project documentation organized by category.

## 📁 Folder Structure

### `/architecture` - System Architecture & Design
- **ARCHITECTURE.md** - High-level system architecture overview
- **PROJECT_STRUCTURE.txt** - Detailed file/folder structure

### `/guides` - General Development Guides
- **SETUP_GUIDE.md** - Initial project setup instructions
- **TDD_WORKFLOW.md** - Test-Driven Development workflow guide

### `/pr-completions` - Pull Request Documentation
Each PR gets its own subfolder with completion reports and guides:
- **pr1/** - Project Setup & Initial Configuration
- **pr2/** - Database Schema & Prisma Setup
- **pr3+/** - Future PRs will be added here

#### PR Documentation Format:
Each PR folder should contain:
- `PR#_COMPLETION.md` - Final completion report with test results
- `PR#_IMPLEMENTATION_SUMMARY.md` - Technical details of what was built
- `PR#_SETUP_GUIDE.md` - Step-by-step setup instructions (if needed)
- `PR#_QUICK_START.md` - Quick reference guide (if needed)
- Additional troubleshooting or fix guides as needed

### `/archive` - Historical Documents
- **REORDERING_SUMMARY.md** - Early project organization notes
- Other deprecated or historical documentation

---

## 📖 Key Documents (in root)

The following essential documents remain in the project root:
- **README.md** - Main project readme
- **TASK_LIST.md** - Complete task list for all PRs
- **PRD.md** - Product Requirements Document

---

## 🎯 For Contributors

When completing a PR, **always**:

1. Create a folder: `docs/pr-completions/pr#/`
2. Add your completion documentation there
3. Update this README if needed
4. Keep the root folder clean - only essential docs stay there

---

## 📚 Quick Navigation

**Getting Started:**
- [Setup Guide](./guides/SETUP_GUIDE.md)
- [TDD Workflow](./guides/TDD_WORKFLOW.md)

**Architecture:**
- [System Architecture](./architecture/ARCHITECTURE.md)
- [Project Structure](./architecture/PROJECT_STRUCTURE.txt)

**PR History:**
- [PR1: Project Setup](./pr-completions/pr1/PR1_COMPLETION.md)
- [PR2: Database Schema](./pr-completions/pr2/PR2_COMPLETION.md)

---

## 📋 Meta Documentation

- **[PR Documentation Standard](./PR_DOCUMENTATION_STANDARD.md)** - How to document PRs
- **[Organization Summary](./ORGANIZATION_SUMMARY.md)** - What was moved where
- **[Cleanup Complete](./CLEANUP_COMPLETE.md)** - Before/after visual summary

---

**Last Updated:** October 13, 2025

