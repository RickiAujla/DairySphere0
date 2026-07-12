# DairySphere Enterprise System

DairySphere is an enterprise-grade multi-tenant dairy management, analytics, and automation system designed for maximum security, extreme reliability, and seamless horizontal scalability.

## 📌 Status & Architecture Bounds
The architectural specifications of this repository have been fully evaluated, approved, and **FROZEN**. No unauthorized changes may be applied to these foundational models.

- **Frontend Architecture:** Frozen in [`/docs/frontend_blueprint.md`](/docs/frontend_blueprint.md)
- **Backend Architecture:** Frozen in [`/docs/backend_blueprint.md`](/docs/backend_blueprint.md)
- **API Contracts:** Frozen in [`/docs/api_blueprint.md`](/docs/api_blueprint.md)

---

## 🛠️ Repository Specifications & Tech Stack
To ensure uniform operational workflows across multi-regional engineering squads, the repository leverages:
*   **Indentation & Files:** Formatted via `.editorconfig` & `.prettierrc` (spaces: 2, line-endings: LF, printWidth: 100).
*   **Static Analysis:** Configured via `.eslintrc.json` enforcing strict typings and disallowing implicit `any` patterns.
*   **Git Hooks:** Automated via **Husky** + **lint-staged** checking staged files for lints and styles on active commit events.
*   **Commit Quality:** Mandated via **commitlint** to ensure strict adherence to the *Conventional Commits* specification.

---

## 🚀 Quickstart & Development Environment

### 1. Prerequisites
Ensure you possess the local node toolings:
*   **NodeJS** (v20+ Recommended)
*   **npm** (v10+ Recommended)

### 2. Setup Dependencies
```bash
npm install
```

### 3. Execution Commands
Available scripts managed within the root manifest:
*   `npm run dev`: Boot up the development engine on port `3000`.
*   `npm run build`: Compile and minify assets into the target production distribution package.
*   `npm run lint`: Execute type checks and check for structural code errors.
*   `npm run format`: Auto-format all codebases according to Prettier specifications.

---

## 📜 Repository Compliance Guidelines
All contributors must read and strictly abide by the following operational standards:
1.  **Code of Conduct:** Set in [`/CODE_OF_CONDUCT.md`](/CODE_OF_CONDUCT.md).
2.  **Contribution Workflow:** Set in [`/CONTRIBUTING.md`](/CONTRIBUTING.md) (requires branching standards, rebase structures, and PR conventions).
3.  **Security Disclosure:** Set in [`/SECURITY.md`](/SECURITY.md) (guarantees confidential reporting of package vulnerabilities).
