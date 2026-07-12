# DairySphere Local Development Guide

Welcome to the **DairySphere** Stage 1.6 Development Environment. This guide provides comprehensive instructions for spinning up dependencies, generating the database engine, and working with local services.

---

## Prerequisites

Before starting, ensure your machine has the following tools installed:

- **Node.js**: `v18.x` or higher (LTS recommended)
- **Docker & Docker Compose**: For local PostgreSQL and Redis orchestration
- **VS Code**: Recommended IDE with the workspace setting guidelines configured in `.vscode/`

---

## 1. Local Environment Configuration

Copy the template environment configuration file to create your active local configuration:

```bash
cp .env.example .env
```

### Essential Parameters Defined

| Environment Variable | Description | Default Local Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for PostgreSQL via Prisma Client | `postgresql://dairysphere_admin:dairysphere_secure_pass@localhost:5432/dairysphere_prod?schema=public` |
| `REDIS_HOST` | Host address of the local Redis memory cache | `localhost` |
| `REDIS_PORT` | Bound port of the local Redis memory cache | `6379` |
| `REDIS_PASSWORD` | Password for the Redis layer (empty for local dev) | `""` |
| `NODE_ENV` | Application environment phase flag | `development` |
| `PORT` | Local dev server ingress port | `3000` |

---

## 2. Infrastructure Setup (Docker Compose)

DairySphere requires **PostgreSQL** and **Redis** to operate. Standard orchestration parameters and container health checks are defined inside `infrastructure/docker/docker-compose.yml`.

### Docker Control Commands

Run these convenient scripts defined in the root workspace `package.json`:

* **Start Infrastructure Containers**:
  ```bash
  npm run docker:up
  ```
  *Spins up PostgreSQL on port `5432` and Redis on port `6379` in detached background mode.*

* **Check Container Statuses**:
  ```bash
  npm run docker:status
  ```

* **Tail Container Logs**:
  ```bash
  npm run docker:logs
  ```

* **Stop Infrastructure Containers**:
  ```bash
  npm run docker:down
  ```

---

## 3. Database Initialisation (Prisma)

Once the local PostgreSQL container is running:

1. **Generate the Prisma Database Client**:
   ```bash
   npx prisma generate --schema=backend/prisma/schema.prisma
   ```

2. **Verify Environment Variables Validation**:
   The NestJS app automatically validates that your `.env` contains valid database credentials and integer-based port schemas on boot using class-validator schemas.

---

## 4. Run commands

Execute development and compilation pipelines directly from the workspace root:

```bash
# Run local Type Checking & Linting
npm run lint

# Build all monorepo bundles (Frontend, Backend, and Shared)
npm run build
```

---

## 5. IDE Guidelines (VS Code)

To ensure styling consistency across all engineering teams, the workspace has pre-configured rules located in:
- `.vscode/settings.json` (auto-formatting on save, Prettier integration)
- `.vscode/extensions.json` (recommended syntax support for Tailwind, Prettier, and Prisma)
