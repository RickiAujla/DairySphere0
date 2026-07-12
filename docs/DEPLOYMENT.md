# DairySphere - Production Deployment & Operations Manual

This document provides complete production-grade specifications, instructions, and strategies for deploying, orchestrating, and maintaining the **DairySphere Enterprise SaaS** platform.

---

## 1. Production Architecture Overview

DairySphere utilizes a highly modular multi-workspace architecture designed to handle multi-tenant isolation, enterprise-level scale, and high-availability operations:

```
                  +-----------------------------------+
                  |        Client Browser             |
                  +-----------------------------------+
                                    |
                                    v (HTTP/HTTPS)
                  +-----------------------------------+
                  |    Nginx Reverse Proxy / Ingress  |
                  +-----------------------------------+
                   /                                 \
                  v (Serving SPA)                     v (API Requests)
    +---------------------------+       +---------------------------+
    |   Frontend Static Server  |       |   NestJS Backend Service  |
    |      (React / Vite)       |       |      (Node.js v18+)       |
    +---------------------------+       +---------------------------+
                                                      |
                                           +----------+----------+
                                          /                       \
                                         v                         v
                       +---------------------------+     +---------------------------+
                       |    PostgreSQL Database    |     |    Redis Memory Cache     |
                       |       (Prisma ORM)        |     |       (Job Queues)        |
                       +---------------------------+     +---------------------------+
```

---

## 2. Environment Variables & Validation

DairySphere enforces strict environment variable validation on server startup. If a critical variable is missing or malformed, the NestJS kernel raises a bootstrap error and gracefully halts execution, preventing partial-failure states.

### Configuration Schema Reference

| Parameter | Type | Required in Prod | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `production` \| `development` | Yes | Defines the environment behavior (e.g., disables verbose debug loggers). |
| `PORT` | `number` | Yes | Ingress port for the application container. Default: `3000`. |
| `DATABASE_URL` | `string` | Yes | Secure database connection string. Uses PostgreSQL DECIMAL for exact calculations. |
| `REDIS_HOST` | `string` | Yes | Memory cache hostname for rate-limiting and job-queueing. |
| `REDIS_PORT` | `number` | Yes | Ingress port for Redis cache instances (standard: `6379`). |
| `JWT_SECRET` | `string` | Yes | Enterprise security key used for cryptographic signoffs. |
| `JWT_EXPIRES_IN`| `string` | No | Expiration duration for access tokens (default: `15m`). |

### On-Boot Validation Engine

Defined under `/backend/src/config/env.validation.ts`, the boot cycle triggers `class-transformer` and `class-validator` routines to synchronously assert variables:
```typescript
const validatedConfig = plainToInstance(EnvironmentVariables, config);
const errors = validateSync(validatedConfig);
if (errors.length > 0) {
  throw new Error(`Database Environment validation failed: ${errors.toString()}`);
}
```

---

## 3. Production Docker Setup

We pack frontend and backend modules into slim Alpine Linux base images using multistage builds to reduce attack surface and resource usage.

### Multi-Container Orchestration (`docker-compose.yml`)

The primary orchestration descriptor resides in `infrastructure/docker/docker-compose.yml`. For full production clustering, use the following configuration:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: dairysphere-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-dairysphere_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dairysphere_secure_pass}
      POSTGRES_DB: ${POSTGRES_DB:-dairysphere_prod}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: dairysphere-redis
    restart: always
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.backend
    container_name: dairysphere-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-dairysphere_admin}:${POSTGRES_PASSWORD:-dairysphere_secure_pass}@db:5432/${POSTGRES_DB:-dairysphere_prod}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET:-dairysphere_change_this_secret_in_production_env}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  pgdata:
  redisdata:
```

### Docker Commands Lifecycle

- **Start production containers**:
  ```bash
  docker-compose -f infrastructure/docker/docker-compose.yml up -d --build
  ```
- **Stop services and preserve storage**:
  ```bash
  docker-compose -f infrastructure/docker/docker-compose.yml down
  ```

---

## 4. Production Observability & Logging

DairySphere implements structured JSON-like production logging with UTC timestamps for enterprise aggregators (Elasticsearch, Fluentd, Kibana, Datadog, AWS CloudWatch).

### Log Message Structure

Logs are dispatched via `AppLogger` (`/backend/src/common/logger/logger.service.ts`) using the standard format:
```
[TIMESTAMP_UTC] [APPLICATION_NAME] [LEVEL] [CONTEXT] MESSAGE
```

### Sample Log Output
```
[2026-07-12T10:44:15Z] [DairySphere] [INFO] [DatabaseService] Successfully connected to the PostgreSQL database via Prisma
[2026-07-12T10:44:18Z] [DairySphere] [WARN] [TenantMiddleware] No tenant identifier detected in request headers. Falling back to global node.
```

---

## 5. Automated Backup & Disaster Recovery Strategy

To support the SaaS scale target (500+ businesses with zero data loss threshold), DairySphere provides production-grade, transaction-consistent backup and restore utilities.

### Backup Strategy (`/scripts/backup.sh`)
The backup script performs:
1. Automated active environment validation.
2. PostgreSQL transaction-consistent snapshot using custom binary archive (`pg_dump -F c`).
3. Redis persistence checkpoint generation and RDB capture.
4. Compilation of dump artifacts into a unified, Gzip-compressed archive.

To execute a backup manually:
```bash
./scripts/backup.sh
```
*Backups are compiled cleanly into the `./backups` directory with the timestamp format `dairysphere_archive_YYYYMMDD_HHMMSS.tar.gz`.*

### Recovery Strategy (`/scripts/restore.sh`)
The restore utility enforces high stability by resetting active target schemas cleanly before loading data, avoiding schema collisions and relational constraints errors:
```bash
./scripts/restore.sh ./backups/dairysphere_archive_20260712_104000.tar.gz
```

### CRON Automation Setup (Automated Backup Plan)
To schedule automatic midnight database snapshots, append this line to your production system's crontab (`crontab -e`):
```cron
0 0 * * * /bin/bash /opt/dairysphere/scripts/backup.sh >> /var/log/dairysphere_cron_backup.log 2>&1
```

---

## 6. System Health Checks

DairySphere includes a complete system observability route mapped to `/api/health`.

### Verification Endpoint

```http
GET /api/health
```

### Sample Response payload (Health Status: UP)
```json
{
  "status": "UP",
  "uptimeSeconds": 1420,
  "timestamp": "2026-07-12T10:44:15.000Z",
  "database": {
    "connected": true,
    "status": "UP"
  },
  "system": {
    "memory": {
      "rss": "52.34 MB",
      "heapTotal": "31.12 MB",
      "heapUsed": "18.67 MB"
    },
    "nodeVersion": "v18.18.0"
  },
  "metadata": {
    "appName": "DairySphere",
    "version": "1.0.0",
    "stage": "STAGE_6_PROD"
  }
}
```

If the database link is broken, the service returns status `DEGRADED` (or `DOWN`) with an appropriate HTTP status code to trigger container level restarts or ingress failovers.

---

## 7. Verification Checklist for Release

Prior to starting Stage 7.1, ensure the following checklist is completed:

- [x] Application compiles cleanly: `npm run build` executes without errors.
- [x] No TypeScript compilation errors exist in `/frontend` or `/backend`.
- [x] On-boot environment validation succeeds.
- [x] Database schema is updated to matches Prisma structures.
- [x] Docker orchestration container starts successfully.
- [x] Observability Logging yields valid UTC formats.
- [x] Backup script and restore scripts verified on test environment.
