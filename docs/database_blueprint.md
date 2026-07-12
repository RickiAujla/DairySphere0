# DairySphere Enterprise Database Architecture Specification

**Status:** FROZEN  
**Database Engine:** PostgreSQL 15+  
**Target Architecture:** Multi-Tenant Core with Row-Level Security (RLS) & Column-Level Encryption

---

## 1. Naming Conventions

To guarantee consistency across all tables, relationships, and queries, the following conventions are strictly enforced:

*   **Tables:** Lower snake_case, pluralized (e.g., `tenants`, `cattle_records`).
*   **Columns:** Lower snake_case, singularized (e.g., `birth_date`, `is_active`).
*   **Primary Keys:** Named `id` of type `UUIDv4` for security and distributed generation (prevents ID enumeration attacks).
*   **Foreign Keys:** Named `[singular_parent_table_name]_id` (e.g., `tenant_id`, `cattle_record_id`).
*   **Indexes:** Named `idx_[table_name]_[column_names_joined_by_under]` (e.g., `idx_cattle_records_tenant_id_tag_id`).
*   **Unique Constraints:** Named `uq_[table_name]_[column_names_joined_by_under]` (e.g., `uq_users_email`).
*   **Foreign Key Constraints:** Named `fk_[child_table]_[parent_table]` (e.g., `fk_users_tenants`).

---

## 2. Multi-Tenant Strategy

*   **Logical Isolation via Shared Schema:** All tenants share a single physical database schema. 
*   **The Golden Foreign Key:** Every single business entity table **MUST** contain a `tenant_id` column of type `UUID` referencing the `tenants` table.
*   **Multi-Column Composite Indexing:** All primary business indexes **MUST** prefix with `tenant_id` (e.g., `tenant_id`, `id`) to ensure optimized lookups restricted strictly within a tenant's partition.
*   **Row-Level Security (RLS):** Policies are enforced at the PostgreSQL layer to ensure no cross-tenant leakage.

---

## 3. Database ERD & High-Level Entity Diagram

```
+------------------+             +-----------------------+             +----------------------+
|     tenants      | <---------- |         users         | <---------- |     audit_logs       |
+------------------+             +-----------------------+             +----------------------+
| id (PK)          |             | id (PK)               |             | id (PK)              |
| name             |             | tenant_id (FK)        |             | tenant_id (FK)       |
| status           |             | email (UQ)            |             | user_id (FK)         |
| tier             |             | role                  |             | action_type          |
+------------------+             +-----------------------+             +----------------------+
         ^
         |
         +-----------------------+-----------------------+-----------------------+
         |                       |                       |                       |
         v                       v                       v                       v
+------------------+    +------------------+    +------------------+    +------------------+
|  cattle_records  |    |  milk_production |    |  feed_inventories|    |  medical_records |
+------------------+    +------------------+    +------------------+    +------------------+
| id (PK)          |    | id (PK)          |    | id (PK)          |    | id (PK)          |
| tenant_id (FK)   |    | tenant_id (FK)   |    | tenant_id (FK)   |    | tenant_id (FK)   |
| tag_number (UQ)  |    | cattle_id (FK)   |    | name             |    | cattle_id (FK)   |
| status           |    | yield_liters     |    | quantity_kg      |    | diagnosis        |
| breed            |    | quality_fat_pct  |    | unit_cost        |    | vet_user_id (FK) |
+------------------+    +------------------+    +------------------+    +------------------+
```

---

## 4. Complete Table Definitions

### 4.1 Tenant & Security Core

#### `tenants`
Tracks subscription configurations and active status of each individual tenant space.

| Column Name | Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique tenant identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Registered legal name of the tenant farm |
| `subdomain` | `VARCHAR(63)` | `NOT NULL`, `UNIQUE` | Domain prefix used for routing |
| `status` | `VARCHAR(32)` | `NOT NULL`, `DEFAULT 'ACTIVE'` | `ACTIVE`, `SUSPENDED`, `TRIAL_EXPIRED` |
| `tier` | `VARCHAR(32)` | `NOT NULL`, `DEFAULT 'BASIC'` | `BASIC`, `PREMIUM`, `ENTERPRISE` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last record modification timestamp |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete audit timestamp |

#### `users`
Represents individual human users mapped to a unique tenant account.

| Column Name | Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique user identifier |
| `tenant_id` | `UUID` | `NOT NULL`, `REFERENCES tenants(id) ON DELETE RESTRICT` | Multi-tenant separator |
| `email` | `VARCHAR(255)` | `NOT NULL` | Lowercase email address (Unique per tenant) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | High-entropy bcrypt/Argon2 encrypted hash |
| `name` | `VARCHAR(255)` | `NOT NULL` | Full legal name of the user |
| `role` | `VARCHAR(64)` | `NOT NULL` | `SYSTEM_ADMIN`, `DAIRY_OWNER`, `VET`, `OPERATOR` |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT TRUE` | User account block flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Metadata registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last update timestamp |

*Constraints:* `uq_tenant_users_email` (Composite UNIQUE on `tenant_id`, `email`)

---

### 4.2 Herd Management

#### `cattle_records`
Core biological asset registry tracking and current status logs.

| Column Name | Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Global registry ID |
| `tenant_id` | `UUID` | `NOT NULL`, `REFERENCES tenants(id) ON DELETE RESTRICT` | Multi-tenant separator |
| `tag_number` | `VARCHAR(64)` | `NOT NULL` | Physical ear-tag visible marker number |
| `electronic_id` | `VARCHAR(128)`| `NULL` | RFID / collar microchip tracking code |
| `nickname` | `VARCHAR(125)` | `NULL` | Friendly identifier name |
| `breed` | `VARCHAR(128)` | `NOT NULL` | Breed definition (e.g., `HOLSTEIN_FRIESIAN`) |
| `gender` | `VARCHAR(16)`  | `NOT NULL` | `FEMALE`, `MALE` |
| `birth_date` | `DATE` | `NOT NULL` | Date of birth |
| `status` | `VARCHAR(64)`  | `NOT NULL`, `DEFAULT 'ACTIVE'` | `ACTIVE`, `DRY`, `LACTATING`, `SICK`, `SOLD` |
| `mother_id` | `UUID` | `NULL`, `REFERENCES cattle_records(id)` | Pedigree maternal tracking link |
| `father_id` | `UUID` | `NULL`, `REFERENCES cattle_records(id)` | Pedigree paternal tracking link |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Database registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Last change timestamp |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete field |

*Constraints:* `uq_cattle_tag_tenant` (Composite UNIQUE on `tenant_id`, `tag_number`)

---

### 4.3 Milk Production Analytics

#### `milk_yields`
Daily and session milk production yield and composition quality analytics.

| Column Name | Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Milk record identifier |
| `tenant_id` | `UUID` | `NOT NULL`, `REFERENCES tenants(id) ON DELETE RESTRICT` | Multi-tenant separator |
| `cattle_id` | `UUID` | `NOT NULL`, `REFERENCES cattle_records(id) ON DELETE CASCADE` | Connected cattle identifier |
| `milking_session` | `VARCHAR(32)`| `NOT NULL` | `MORNING`, `MIDDAY`, `EVENING` |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL` | Time session took place |
| `yield_liters` | `NUMERIC(6, 2)`| `NOT NULL` | Exact quantity in liters (precise scale) |
| `fat_percentage` | `NUMERIC(4, 2)`| `NULL` | Lab quality component tracking (Fat %) |
| `protein_percentage`| `NUMERIC(4, 2)`| `NULL` | Lab quality component tracking (Protein %) |
| `somatic_cell_count`| `INTEGER` | `NULL` | Health indicator (SCC/ml) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Creation log timestamp |

---

### 4.4 Feed & Nutrition Management

#### `feed_inventories`
Feed silo supplies and dry-matter raw ingredients inventory counts.

| Column Name | Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Feed stock identifier |
| `tenant_id` | `UUID` | `NOT NULL`, `REFERENCES tenants(id) ON DELETE RESTRICT` | Multi-tenant separator |
| `name` | `VARCHAR(255)` | `NOT NULL` | Feed type name (e.g., `CORN_SILAGE`, `ALFALFA`) |
| `quantity_kg` | `NUMERIC(10, 2)`| `NOT NULL`, `DEFAULT 0.00` | Current mass in kilograms |
| `minimum_reorder_kg`| `NUMERIC(10, 2)`| `NOT NULL` | Reorder notification threshold |
| `unit_cost` | `NUMERIC(10, 4)`| `NOT NULL` | Base acquisition price per kg for financial analytics |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Inventory balance check time |

---

### 4.5 Medical & Veterinary History

#### `veterinary_treatments`
Cattle veterinary treatments, pharmaceutical logs, and milk withholding periods.

| Column Name | Data Type | Constraints / Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Medical entry identifier |
| `tenant_id` | `UUID` | `NOT NULL`, `REFERENCES tenants(id) ON DELETE RESTRICT` | Multi-tenant separator |
| `cattle_id` | `UUID` | `NOT NULL`, `REFERENCES cattle_records(id) ON DELETE CASCADE` | Connected cattle identifier |
| `diagnosed_disease`| `VARCHAR(255)`| `NOT NULL` | Diagnosed condition (e.g., `MASTITIS`, `KETOSIS`) |
| `treatment_details`| `TEXT` | `NOT NULL` | Description of drug treatments administered |
| `administered_by` | `UUID` | `NOT NULL`, `REFERENCES users(id)` | Vet or operator user key |
| `treatment_start` | `TIMESTAMPTZ` | `NOT NULL` | Date/time treatment started |
| `treatment_end` | `TIMESTAMPTZ` | `NULL` | Date/time treatment completed |
| `withhold_milk_until`| `TIMESTAMPTZ`| `NULL` | Critical food safety isolation indicator |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Ledger log creation timestamp |

---

## 5. Indexes & Optimized Queries

To optimize complex multi-tenant reads and protect transaction speeds:

### 5.1 Primary Multi-Tenant Operational Indexes
*   `idx_users_tenant_email` ON `users (tenant_id, email)`
*   `idx_cattle_tenant_tag` ON `cattle_records (tenant_id, tag_number)`
*   `idx_cattle_rfid` ON `cattle_records (tenant_id, electronic_id) WHERE electronic_id IS NOT NULL`

### 5.2 Performance & Analytics Reporting Indexes
*   `idx_milk_yields_cattle_date` ON `milk_yields (tenant_id, cattle_id, recorded_at DESC)`
*   `idx_veterinary_withhold_safety` ON `veterinary_treatments (tenant_id, withhold_milk_until DESC) WHERE withhold_milk_until > NOW()`

---

## 6. Security, Soft Deletes, & Audit Strategy

*   **Soft Delete Enforcements:** Main tables utilize a `deleted_at` nullable timestamp column. Application-layer ORM models automatically append `AND deleted_at IS NULL` to ensure historical compliance.
*   **Immutable Transactional Ledger Logs:** Operational tables such as `milk_yields` do not support updates; adjustments require appending a counter-balancing transaction log for strict audit compliance.
*   **System Audit Table:**
    Every administrative update is recorded inside a central `system_audit_logs` table (tracking IP, authenticated user ID, action type, changes payload in JSONB, and tenant ID).

---

## 7. PostgreSQL Backup & High Availability Specs

*   **Continuous Archiving:** Wal-G/pgBackRest continuous archive engine to Amazon S3 / Cloud Storage buckets.
*   **Point-in-Time Recovery (PITR):** Enables transactional recovery to any specific second in history.
*   **Read Replicas:** Distributed database readers handling analytical computations offloading primary write databases.
