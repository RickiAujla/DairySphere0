# Contributing to DairySphere

We are excited that you want to contribute to the DairySphere Enterprise Platform! To keep our delivery channels highly reliable, all contributions must strictly abide by our development pipeline.

---

## 1. Development and Branching Strategy
We adhere to a Trunk-Based Development model supplemented with short-lived feature branches:
*   `main` - Represents the production-ready state of the system.
*   `develop` - Integration branch for release stabilization.
*   `feature/*` - Local feature branches (always branched from `develop`).
*   `hotfix/*` - Patches branched from `main` to address immediate live defects.

---

## 2. Preparing Pull Requests
1.  **Format Code:** Ensure your changes adhere to code style guidelines. Run:
    ```bash
    npm run format
    npm run lint
    ```
2.  **Commit Messages:** Ensure your commit subjects strictly respect Conventional Commits specifications (e.g., `feat(herd): implement cattle status filter`).
3.  **No Merge Commits:** We require a clean commit history. Rebase your feature branch against `develop` before submitting.

---

## 3. Pull Request Review Process
*   Each PR requires approval from at least one Core Engineer.
*   All automated CI pipelines (including lint checks, type checks, and test suites) must successfully pass before a branch can be merged.
