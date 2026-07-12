# DairySphere Enterprise Backend Architecture Specification

**Status:** FROZEN  
**Target Quality:** Stripe / NestJS Staff Architect Grade  
**Core Technologies:** NestJS v10+, TypeScript 5+, Prisma ORM, PostgreSQL 15, Redis 7 (Caching & BullMQ queues), Passport.js, class-validator/class-transformer, and Docker Multi-stage containers.

---

## 1. Backend Folder Structure (Monorepo Node)
To strictly enforce Clean Architecture and modular boundaries within NestJS:
```
/backend
├── prisma/                     # Database schema definition & migration engines
│   ├── schema.prisma           # Prisma schemas (multi-tenant enabled)
│   └── migrations/             # Generated database migration files
├── src/
│   ├── app.module.ts           # Central bootstrap application module
│   ├── main.ts                 # Stateless web server entry point
│   │
│   ├── core/                   # Platform infrastructure core layers
│   │   ├── config/             # Fully-validated configuration loaders (dotenv)
│   │   ├── database/           # Prisma client provider and pooling configs
│   │   ├── decorators/         # Custom decorators (Roles, CurrentUser, Tenant)
│   │   ├── exceptions/         # Global Exception filter mapping REST responses
│   │   ├── guards/             # JWT, RBAC, and multi-tenant security verification
│   │   ├── interceptors/       # Class serialization, logging, and response wrappers
│   │   └── middleware/         # X-Tenant-ID header and body pre-parsing
│   │
│   ├── common/                 # Immutable base classes, DTOs, and constants
│   │   ├── base/               # BaseEntity, BaseRepository, BaseService
│   │   ├── dto/                # Standardized PaginationQuery, PaginationMeta
│   │   └── interfaces/         # Core abstract behaviors & request envelopes
│   │
│   ├── modules/                # Feature modules (Domain & Application Logic)
│   │   ├── auth/               # Stateless OAuth, JWT lifecycle, and user logins
│   │   ├── tenants/            # SaaS onboarding, billing, and tier management
│   │   ├── herd/               # Cattle profile assets & lineage trees
│   │   ├── milk/               # Milking session entries & food safety validation
│   │   ├── feed/               # Silo storage tracking & reorder notifications
│   │   └── health/             # Veterinary interventions & quarantine managers
│   │
│   └── shared/                 # Utility services shared between micro-packages
│       ├── redis/              # Distributed memory store and cache wrappers
│       ├── queue/              # BullMQ queue runner (reminders, background tasks)
│       └── logger/             # Standardized structured JSON logger (Pino-based)
```

---

## 2. Module Organization & Clean Layers
To avoid spaghetti dependencies, each feature module (under `/src/modules/`) is strictly stratified into four isolated layers:

1.  **Controller Layer:** Consumes HTTP requests, verifies DTO validation decorators, maps path variables, and returns standardized envelope payloads. No business logic permitted here.
2.  **Service Layer (Application Business Rules):** The core engine of DairySphere. Implements specific transactional processes, state changes, safety constraints, and delegates storage operations to repositories.
3.  **Repository Layer (Prisma Wrapper):** Interfaces with the database. Appends mandatory multi-tenant scopes (`where: { tenantId }`) to all queries, preventing leakage.
4.  **Domain/Entity Layer:** Standard plain objects and TypeScript types modeling the business entities.

---

## 3. Core & Shared Modules Spec

### 3.1 Config Module (Strict Typings)
Uses `@nestjs/config` combined with `joi` or `zod` to validate all environment configurations during system boots.
*   *Validation Constraints:* Prevents the application from starting if `DATABASE_URL`, `REDIS_URL`, or `JWT_SECRET` variables are missing or malformed.

### 3.2 Prisma Core Module
Exposes a thread-safe `PrismaService` which extends `PrismaClient`.
*   *Lifecycle Hooks:* Properly intercepts NestJS shutdown signals to gracefully close connection pools.
*   *Performance tuning:* Set to close unused database connections automatically and handle dynamic replicas.

### 3.3 Logger Module (Structured JSON)
Wraps standard console operations into a high-performance, asynchronous JSON-format Winston or Pino logger.
*   *Metadata Propagation:* Automatically injects the context variable `requestId` and current `tenantId` into every transaction log line to support unified debugging.

---

## 4. Multi-Tenant Engineering Strategy

### 4.1 Header Validation Middleware
A global middleware intercepts incoming requests to parse and validate the header `X-Tenant-ID`.
*   If absent on any private endpoint: Rejects instantly with a `400 Bad Request` wrapper (`AUTH_MISSING_TENANT_HEADER`).

### 4.2 Safe Context Storage
Uses Node's `AsyncLocalStorage` via NestJS interceptors or custom middleware to scope the current `tenantId` to the current execution thread context.
*   This ensures downstream database layers can retrieve the correct tenant context dynamically without needing to manually pass `tenantId` as a parameter down through every single function call.

### 4.3 Database Level Isolation (Row-Level Query Guards)
To prevent cross-tenant leakages due to human coding oversights, DairySphere utilizes **Prisma client middleware / extensions**:
```typescript
// Architectural Rule: Automatically inject tenant filters on database queries
prisma.$extends({
  query: {
    $allModels: {
      async findMany({ query, args }) {
        args.where = { ...args.where, tenantId: getActiveTenantId() };
        return query(args);
      }
    }
  }
});
```
This guarantees that even if a junior developer forgets to add `tenantId` to a `findMany` query, the data access layer automatically enforces the tenant boundaries.

---

## 5. Authentication, Refresh, and RBAC Architecture

### 5.1 Two-Token Authentication Flow
*   **Access Token:** Short-lived JWT containing basic client metrics (User ID, Role, Tenant ID, and Scopes). Verified entirely offline by NestJS Passport Guards using standard symmetric cryptokeys (`HS256`).
*   **Refresh Token:** Long-lived, single-use, rotated token stored inside the PostgreSQL database (as a hashed key) and transmitted back to the client inside an `HttpOnly` cookie.

### 5.2 Refresh Token Rotation (RTR)
When a refresh operation is requested, NestJS checks the database to confirm the incoming refresh token has not been compromised.
*   *Security Isolation Rule:* If a client tries to reuse a previously rotated refresh token, the system assumes a session breach has occurred, invalidates **all** active refresh tokens for that user ID, and forces immediate re-authentication.

### 3.5 Role-Based Access Control (RBAC) Guard
Role validation is enforced declarative-style via NestJS decorators:
```typescript
@Roles('FARM_MANAGER', 'DAIRY_OWNER')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get()
async getSensitiveData() { ... }
```

---

## 6. Exception Handling & Global Response Formatting

### 6.1 Unified Base Exception Filter
A global catch-all exception filter captures all runtime exceptions (both HTTP-level errors and deep database connection or query errors) and normalizes them into our standard REST Error envelope:
*   **Status Mapping:** Maps Prisma exceptions directly to correct HTTP status codes (e.g., `P2002` Unique Constraint maps to `409 Conflict`).
*   **Information Leakage Protection:** Under `production` environments, deep system traceback errors are kept strictly in the internal logs and are replaced in the public response by a generic transaction identifier `requestId`.

---

## 7. Caching Strategy & Redis Integration

### 7.1 Distributed Caching Layer
Exposes a unified `RedisCacheService` to handle temporary system memory needs.
*   **Static Assets & Core Configs:** Tenant configuration states and subscription tiers are cached in Redis with a Time-To-Live (TTL) of **24 hours**.
*   **Cache Invalidation:** Any tenant tier modification trigger instantly emits a Redis invalidation signal to flush out-of-date caches.

### 7.2 Background Queues & BullMQ
Used to separate long-running tasks from the main thread lifecycle (e.g., calculating herd lactation averages, generating bulk financial PDF invoices, or dispatching alert emails).
*   *Worker Isolation:* Background jobs are isolated to separate worker instances running specialized consumer logic.

---

## 8. Transaction Control & Financial Accuracy
*   **Acid Transactions:** Critical modifications (such as updating feed inventory levels, registering animal movements, or processing medical billing entries) are wrapped inside explicit Prisma sequential transactional pipelines (`prisma.$transaction`).
*   **Strict Decimal Math:** All financial values and quantity measurements are stored as PostgreSQL `NUMERIC` types, mapped to class decorators guaranteeing no binary floating-point roundoff errors occur during application-side business logic.

---

## 9. Security & Hardening Standards

*   **Password Cryptography:** All user credentials must be stored as one-way cryptographic hashes using the `bcrypt` algorithm with a work factor cost of **12** rounds to withstand brute-force attacks.
*   **Query Parameterization:** Direct SQL string interpolation is strictly prohibited. All queries must execute via the Prisma ORM's parameterized execution layer or explicit parameterized SQL templates to entirely mitigate SQL injection (SQLi) vectors.
*   **Payload Boundary Limits:** Express body-parser payloads are capped at exactly `10mb` for general requests and `50mb` for binary file streams to prevent Memory Exhaustion and Denial-of-Service (DoS) attempts.
*   **CORS & Host Header Whitelisting:** Wildcard origins are disabled in production. Allowable cross-origin resource requests are strictly bound to validated tenant subdomains (`https://*.dairysphere.com`) with strict `X-Frame-Options: DENY` and `Content-Security-Policy` headers.
*   **Data-at-Rest and Data-in-Transit:**
    *   All database storage volumes (PostgreSQL data folders) must be encrypted using AES-256.
    *   All communication channels between clients, the API gateway, microservices, database clusters, and Redis nodes must be TLS 1.3 encrypted.
*   **Rate Limiting Tier Guidelines:**
    *   *Default Tier:* Limit to 60 requests / minute / IP.
    *   *Enterprise Tier:* Custom rate thresholds up to 1000 requests / minute / IP.
    *   *Auth Endpoints:* Strictly capped at 10 requests / 5 minutes / IP to prevent credential stuffing.

---

## 10. Performance & Optimization Standards

*   **Database Query and Indexing Rules:**
    *   All database query patterns targeting non-primary keys must match a composite or single-column index.
    *   Standard Indexes must be defined on `tenantId` + logical query keys (e.g. `idx_cattle_tenant_tag` on `(tenantId, tagNumber)`).
    *   `N+1` Query anti-patterns are forbidden. Developers must use Prisma's nested selection (`select` or `include`) or dataloader batches to fetch relations in single transactions.
*   **Distributed Cache Operations:**
    *   **Level 1 Cache:** Node memory cache using local storage for high-frequency configurations that change rarely (TTL: 5 minutes).
    *   **Level 2 Cache:** Redis key-value cache for serialized tenant metadata, active user sessions, and permission matrices (TTL: 24 hours).
*   **Serialization and Response Compression:**
    *   All outbound payload objects must use class-transformer to automatically strip hidden fields (e.g. `passwordHash`).
    *   Gzip/Brotli compression must be enabled on all JSON endpoints to minimize transmission overhead for low-bandwidth rural cellular client networks.
*   **Prisma Pool Management:**
    *   Database connection pools must be tuned according to container thread counts: `pool_timeout=10` and `max_connections = (CPU cores * 2) + effective_spindle_count`.

---

## 11. Scalability & Architectural Hardening

*   **Stateless Execution Principle:** No application state or local persistent session context is permitted within the NestJS container memory. All requests must remain entirely self-contained and authenticate via signature validation.
*   **Read-Write Isolation (CQRS Lite):**
    *   All resource writes (create, update, delete actions) are routed to the primary PostgreSQL master instance.
    *   Heavy reporting queries and read operations must be directed to a read replica pool (`DATABASE_URL_REPLICA`) to prevent transaction lockups on critical tables.
*   **Concurrent Job Throttling:**
    *   Queue consumers (BullMQ workers) must run on isolated container instances with predefined concurrency boundaries (e.g., maximum 5 concurrent worker threads per instance) to avoid memory spikes.
*   **Health Checks & Probes:**
    *   Expose `/health/liveness` (instant return of HTTP 200) and `/health/readiness` (performing lightweight ping queries to Postgres, Redis, and BullMQ queues) to orchestrate horizontal auto-scaling actions on Kubernetes/Cloud Run.

---

## 12. NestJS Layer & Dependency Injection Guidelines

*   **Inversion of Control (IoC):** All services, repositories, and custom gateway connectors must be decorated with `@Injectable()` and managed strictly through NestJS Dependency Injection. Custom `new` instantiation of business units is prohibited.
*   **Strict Controller Isolation:**
    *   Controllers must only act as dynamic mapping layers for incoming protocols.
    *   They are restricted to: parsing parameters, executing input validations, delegating domain execution to services, and wrapping outbound results.
*   **Single-Responsibility Services:**
    *   Services must contain pure business logic and transactional workflows.
    *   They are forbidden from executing raw database commands or interacting with Express `req` or `res` objects.
*   **Data Transfer Objects (DTOs):**
    *   Every incoming body structure must possess a distinct, strictly-validated Class-DTO.
    *   All properties must carry appropriate `class-validator` decorators (e.g., `@IsUUID()`, `@IsString()`, `@Min(0)`).
    *   Unregistered input properties must be automatically stripped using the NestJS global validation pipe config (`whitelist: true, forbidNonWhitelisted: true`).

---

## 13. Backend Development Guidelines & Coding Standards

*   **Strict Type-Checking:**
    *   TypeScript configurations must set `strict: true`, `noImplicitAny: true`, and `strictNullChecks: true`.
    *   Use of `any` is strictly prohibited. If a type is uncertain, use `unknown` and perform type-narrowing runtime guards.
*   **Error and Logging Uniformity:**
    *   All custom exception handlers must inherit from `HttpException` or `RpcException`.
    *   Logs must be structured with contextual metadata. Use the structured logger to include standard identifiers on every line: `{ requestId, tenantId, userId, timestamp, context }`.
*   **Transactional Boundaries:**
    *   Workflows touching multiple tables or modifying sensitive herd states (e.g. logging a milk treatment that isolates an animal) must execute inside a `prisma.$transaction()` block to guarantee Atomicity.
*   **Unit and Integration Testing Coverage:**
    *   All business logic inside services must be covered by unit tests using Jest, stubbing repository responses to achieve a minimum of **85% code coverage**.
    *   Integration tests (`e2e`) must run against a Dockerized test database to verify authorization guards, multi-tenant middleware, and database schema compatibility.
