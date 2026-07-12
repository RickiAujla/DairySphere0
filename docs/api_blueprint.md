# DairySphere Enterprise API Specification

**Status:** FROZEN  
**API Type:** RESTful v1 Stateless JSON-API  
**Target Architecture:** Multi-Tenant Core with JWT-based RBAC and Header-Driven Tenant Isolation

---

## 1. Global API Standards & Protocols

To guarantee absolute consistency across all microservices and frontend integrations, the following protocols are strictly enforced:

### 1.1 Base URL Design & Versioning
All API endpoints must be prefixed with the major version identifier:
`https://api.dairysphere.com/v1`

**Guidelines:**
- All endpoints must use lowercase nouns in plural form (e.g., `/herd/cattle`, `/production/yields`).
- Trailing slashes must be ignored or redirected automatically.
- Always use standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to represent resource actions.

### 1.2 Multi-Tenant Header Isolation
To access any business resource, client requests **MUST** supply the following headers:
*   `X-Tenant-ID`: The UUIDv4 corresponding to the target tenant workspace.
*   `Authorization`: `Bearer <JWT_ACCESS_TOKEN>`

The API Gateway automatically matches the `X-Tenant-ID` header against the claims embedded within the verified JWT token. If they do not match, the gateway aborts the request immediately with a `403 Forbidden` response prior to reaching the backend services.

### 1.3 Standard Response Format
All responses must adhere to the standardized wrapper format:

#### Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-07-11T01:15:00Z",
    "requestId": "req-9c884cf1-78ef-4682-beec-c49b049b1a53",
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "pageSize": 50,
      "totalRecords": 724
    }
  }
}
```

#### Error Envelope (`4xx`, `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "VAL_INVALID_INPUT",
    "message": "The provided fields failed server-side validation checks.",
    "details": [
      {
        "field": "tagNumber",
        "issue": "tagNumber cannot contain trailing spaces or special symbols."
      }
    ],
    "requestId": "req-9c884cf1-78ef-4682-beec-c49b049b1a53"
  }
}
```

---

## 2. API Security, Authentication Flow & Role Matrix

### 2.1 Authentication Flow
DairySphere employs stateless token-based authorization via JWT (JSON Web Tokens).

```
[ Client ] --- (1) POST /auth/login ---> [ Gateway / Auth Service ]
[ Client ] <--- (2) Access Token & Cookie - [ Gateway / Auth Service ]

For subsequent actions:
[ Client ] --- (3) Request with Bearer & X-Tenant-ID ---> [ Gateway ] --- (4) Verified OK ---> [ Service Engine ]
```

1.  **Session Initiation:** The client sends credentials via `POST /auth/login`.
2.  **Token Issuance:** On verification, the server issues:
    *   `accessToken` (JSON body): Expire time **15 minutes**. Standard HMAC-SHA256 signature containing user UUID, email, assigned role, and Authorized tenant UUID.
    *   `refreshToken` (HttpOnly Secure Cookie): Expire time **7 days**. Reusable only once; automatic rotation is triggered on subsequent refresh actions.
3.  **Authentication Guarding:** Every private endpoint verifies the incoming token's digital signature and checks whether the embedded `tenant_id` matches the request's `X-Tenant-ID` header.

### 2.2 Global Role Authorization Matrix (RBAC)

The system restricts resource execution via the following authorization rules:

| API Module & Endpoint Pattern | SYSTEM_ADMIN | DAIRY_OWNER | FARM_MANAGER | VETERINARIAN | FIELD_OPERATOR |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/auth/login` & `/auth/refresh` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| `GET /tenants/*` (Admin only) | **ALLOW** | Denied | Denied | Denied | Denied |
| `POST /tenants/*` (Admin only) | **ALLOW** | Denied | Denied | Denied | Denied |
| `GET /herd/cattle` | Denied | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| `POST /herd/cattle` (Creation) | Denied | **ALLOW** | **ALLOW** | Denied | Denied |
| `PATCH /herd/cattle/*` (Edits) | Denied | **ALLOW** | **ALLOW** | **ALLOW** | Denied |
| `DELETE /herd/cattle/*` | Denied | **ALLOW** | Denied | Denied | Denied |
| `POST /production/yields` | Denied | **ALLOW** | **ALLOW** | Denied | **ALLOW** |
| `GET /production/yields/*` | Denied | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| `GET /feed/inventory` | Denied | **ALLOW** | **ALLOW** | Denied | **ALLOW** |
| `POST /feed/inventory` (Updates)| Denied | **ALLOW** | **ALLOW** | Denied | Denied |
| `POST /health/treatments` | Denied | **ALLOW** | **ALLOW** | **ALLOW** | Denied |
| `GET /health/treatments/*` | Denied | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |

---

## 3. Pagination, Filtering & Sorting Standards

### 3.1 Pagination
All bulk `GET` queries must paginate records to guarantee database responsiveness.
*   **Query Parameters:**
    *   `page`: The target page integer index (1-indexed, Default: `1`).
    *   `limit`: Number of records per batch (Default: `50`, Maximum: `250`).
*   **Response Metadata:** Appended to the root `meta.pagination` node.

### 3.2 Filtering
Advanced filtering parameters must be passed directly inside query params matching snake_case naming structures:
*   *Exact Matches:* `?status=LACTATING` or `?breed=JERSEY`
*   *Range Parameters:* Appended with suffix bounds (e.g., `?recorded_after=2026-07-01T00:00:00Z&recorded_before=2026-07-11T00:00:00Z`).
*   *Search Term:* `?search=Bessie` executes low-latency wildcard lookups against pre-indexed text fields (`nickname`, `tag_number`).

### 3.3 Sorting
Explicit sorting uses the `sort` query parameter containing the target field and direction:
*   *Syntax:* `?sort=field:direction` (e.g., `?sort=birthDate:desc` or `?sort=tagNumber:asc`).
*   *Multiple Fields:* Supported via comma-separated listings (e.g., `?sort=status:asc,birthDate:desc`).

---

## 4. Comprehensive Endpoint Definitions

### 4.1 Module 1: Authentication & Multi-Tenant Core

#### `POST /auth/login`
Authenticates user credentials, registers access token and cookie-bound refresh token.

*   **Auth Required:** `None`
*   **Request Payload:**
    ```json
    {
      "email": "user@dairysphere.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": "usr-531bf36d-bc1b-4b13-87bb-7008ca110298",
          "name": "Alex Mercer",
          "email": "user@dairysphere.com",
          "role": "FARM_MANAGER",
          "tenantId": "ten-9a2c34d4-28ab-41c1-bf63-8a9d18728d11"
        }
      }
    }
    ```

#### `POST /auth/refresh`
Rotates active access token using the user's secure cookie.

*   **Auth Required:** `None (Cookie Verified)`
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

---

### 4.2 Module 2: Herd Management (Cattle Records)

#### `GET /herd/cattle`
Lists, filters, searches, and paginates tenant cattle profiles.

*   **Auth Required:** `Yes (Bearer JWT)`
*   **Authorization:** `DAIRY_OWNER`, `FARM_MANAGER`, `VETERINARIAN`, `FIELD_OPERATOR`
*   **Query Parameters:** `page`, `limit`, `status`, `search`, `sort`
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "cat-8e3b5e40-a39c-493e-afbd-329b139556bb",
          "tagNumber": "DS-4091",
          "electronicId": "RFID-8291039",
          "nickname": "Bessie",
          "breed": "HOLSTEIN_FRIESIAN",
          "gender": "FEMALE",
          "status": "LACTATING",
          "birthDate": "2024-03-12"
        }
      ],
      "meta": {
        "timestamp": "2026-07-11T01:15:00Z",
        "pagination": {
          "currentPage": 1,
          "totalPages": 1,
          "pageSize": 50,
          "totalRecords": 1
        }
      }
    }
    ```

#### `POST /herd/cattle`
Registers a new biological animal record inside the tenant's namespace.

*   **Auth Required:** `Yes (Bearer JWT)`
*   **Authorization:** `DAIRY_OWNER`, `FARM_MANAGER`
*   **Request Payload:**
    ```json
    {
      "tagNumber": "DS-4092",
      "electronicId": "RFID-8291040",
      "nickname": "Daisy",
      "breed": "JERSEY",
      "gender": "FEMALE",
      "birthDate": "2025-01-10",
      "status": "ACTIVE"
    }
    ```
*   **Response Payload (`201 Created`):**
    ```json
    {
      "success": true,
      "data": {
        "id": "cat-3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
        "tagNumber": "DS-4092",
        "electronicId": "RFID-8291040",
        "nickname": "Daisy",
        "breed": "JERSEY",
        "gender": "FEMALE",
        "birthDate": "2025-01-10",
        "status": "ACTIVE"
      }
    }
    ```

---

### 4.3 Module 3: Milk Production & Quality Analytics

#### `POST /production/yields`
Logs a new milking session yield, including food-safety alerts processing.

*   **Auth Required:** `Yes (Bearer JWT)`
*   **Authorization:** `DAIRY_OWNER`, `FARM_MANAGER`, `FIELD_OPERATOR`
*   **Request Payload:**
    ```json
    {
      "cattleId": "cat-8e3b5e40-a39c-493e-afbd-329b139556bb",
      "milkingSession": "MORNING",
      "recordedAt": "2026-07-11T06:30:00Z",
      "yieldLiters": 34.25,
      "fatPercentage": 4.12,
      "proteinPercentage": 3.45,
      "somaticCellCount": 180000
    }
    ```
*   **Response Payload (`201 Created`):**
    ```json
    {
      "success": true,
      "data": {
        "id": "yld-11aa22bb-33cc-44dd-55ee-66ff77aa88bb",
        "cattleId": "cat-8e3b5e40-a39c-493e-afbd-329b139556bb",
        "milkingSession": "MORNING",
        "yieldLiters": 34.25,
        "isSafetyApproved": true
      }
    }
    ```

---

### 4.4 Module 4: Feed & Nutrition Management

#### `GET /feed/inventory`
Retrieves nutritional stocks, dry-matter feeds, and reorder metrics.

*   **Auth Required:** `Yes (Bearer JWT)`
*   **Authorization:** `DAIRY_OWNER`, `FARM_MANAGER`
*   **Response Payload (`200 OK`):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "fd-e2c317db-e95e-4b2a-89a1-77b3df4dfa51",
          "name": "Corn Silage Extra-Dry",
          "quantityKg": 25400.50,
          "minimumReorderKg": 5000.00,
          "unitCost": 0.4520,
          "requiresReorder": false
        }
      ]
    }
    ```

---

### 4.5 Module 5: Health & Veterinary Tracking

#### `POST /health/treatments`
Enters veterinary treatment with milk isolation safety calculations.

*   **Auth Required:** `Yes (Bearer JWT)`
*   **Authorization:** `VETERINARIAN`, `DAIRY_OWNER`
*   **Request Payload:**
    ```json
    {
      "cattleId": "cat-8e3b5e40-a39c-493e-afbd-329b139556bb",
      "diagnosedDisease": "MASTITIS",
      "treatmentDetails": "Administered Penicillin 300mg",
      "treatmentStart": "2026-07-11T01:00:00Z",
      "withholdMilkUntil": "2026-07-15T01:00:00Z"
    }
    ```
*   **Response Payload (`201 Created`):**
    ```json
    {
      "success": true,
      "data": {
        "id": "trt-99bb88cc-77dd-66ee-55ff-44aa33bb22cc",
        "cattleId": "cat-8e3b5e40-a39c-493e-afbd-329b139556bb",
        "withholdingPeriodActive": true,
        "withholdMilkUntil": "2026-07-15T01:00:00Z"
      }
    }
    ```

---

## 5. Global Error Coding Standards

DairySphere employs distinct, high-accuracy application error codes to bypass linguistic ambiguities.

| HTTP Status | Error Code | Common Cause / Remediation Strategy |
| :--- | :--- | :--- |
| `400 Bad Request` | `VAL_INVALID_INPUT` | Payload fields failed type checking or boundary validation rules. |
| `401 Unauthorized` | `AUTH_MISSING_TOKEN` | Bearer authorization header is missing or blank. |
| `401 Unauthorized` | `AUTH_EXPIRED_TOKEN` | JWT timestamp expiry has passed; trigger `/auth/refresh`. |
| `403 Forbidden` | `AUTH_ROLE_RESTRICTED` | The user's role lacks the capability to write or execute this route. |
| `403 Forbidden` | `TENANT_CROSS_LEAK` | Header `X-Tenant-ID` does not match the active user's partition ID. |
| `404 Not Found` | `RES_NOT_FOUND` | No database entity matches the specified resource UUID. |
| `409 Conflict` | `RES_DUPLICATE_KEY` | Violates a unique field index constraint (e.g., duplicated `tag_number`). |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Request rate exceeded the designated tenant subscription threshold. |
| `500 Internal Error` | `SYS_SERVER_ERROR` | An unhandled exception was captured; review target tracing `requestId`. |

