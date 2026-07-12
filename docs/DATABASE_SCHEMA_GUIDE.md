# DairySphere Complete Database Schema Guide (Stage 2.1)

This document provides architectural documentation, relational mappings, and database standards for the production-ready DairySphere Prisma database schema.

---

## 1. Naming Standards & Design Principles

All schema models, fields, and constraints adhere strictly to enterprise-grade relational patterns:

### Model & Enum Naming
- **PascalCase** for model and enum identifiers (e.g., `MilkCollection`, `OrderStatus`).
- **Singular Form** for all model identifiers (e.g., `Customer`, not `Customers`).

### Field Naming
- **camelCase** for all attribute fields (e.g., `baseRate`, `salaryAmount`).
- **Suffix conventions**:
  - `Id` suffix for single relation foreign keys (e.g., `businessId`, `customerId`).
  - `At` suffix for timestamp markers (e.g., `createdAt`, `updatedAt`, `deletedAt`).
  - `Date` suffix for calendar dates (e.g., `startDate`, `endDate`, `hireDate`).

### Relational integrity & ACID Compliance
- **UUID Primary Keys**: Every table uses a universally unique identifier (`uuid()`) as its primary key to scale efficiently across distributed databases.
- **Decimal Types**: Precise fixed-point arithmetic (`Decimal @db.Decimal(10,2)`) is enforced for currency, quantity, fat, and SNF measurements to prevent IEEE-754 binary floating-point rounding errors.
- **Indexes**: All foreign keys and high-frequency search fields are explicitly indexed (`@@index`) to guarantee high-performance queries at the target scale (10,000+ users).
- **Cascade Deletes**: Strategic cascaded deletes (`onDelete: Cascade`) exist on dependent items (e.g., `OrderItem`, `UserRole`, `CustomerAddress`), while transactional, core references use protective set-null (`onDelete: SetNull`) to retain analytical integrity.

---

## 2. Complete Model Overview & Relationships

### CORE Module
- **Business**: The sovereign multi-tenant container model. Every module except System-level utilities is scoped under a unique `Business`.
- **User**: Authentication login records containing passwords, linked to a single `Business`.
- **Role**: Job groupings (e.g., Admin, Agent, Driver) associated with specific permissions.
- **Permission**: Granular action markers (e.g., `"milk:collect"`, `"reports:generate"`).
- **UserRole**: Many-to-Many join table mapping users to roles.
- **RolePermission**: Many-to-Many join table mapping roles to permissions.

### CUSTOMERS Module
- **Customer**: Customer profile records containing core details (phone, email) and optionally linked to a system `User` if they have portal access.
- **CustomerAddress**: Geocoded billing and delivery addresses with latitude/longitude details. Supports multiple addresses per customer.
- **CustomerSubscription**: Setups for recurring daily or alternate-day milk/product dispatches.

### DAIRY Module
- **MilkCollection**: Log records for raw milk deposits by farmers. Tracks quantity, FAT, SNF, calculated rate, shift, and collecting employee.
- **MilkSale**: Real-time sales transactions for walk-in buyers or standard customers.
- **MilkRate**: Rule matrix mapping milk types (COW, BUFFALO, MIXED) to FAT/SNF-based pricing formulas.

### PRODUCTS Module
- **Product**: SKUs and inventory identifiers (pricing, descriptions).
- **ProductCategory**: Hierarchical slugs grouping products.
- **ProductStock**: A 1-to-1 extension of products tracking live warehouse quantities.
- **InventoryTransaction**: Log audits tracking items coming in (receive), going out (dispatch), wasted, or adjusted.

### ORDERS Module
- **Order**: Checkout cart transactions containing final prices, discounts, and delivery coordinates.
- **OrderItem**: Individual product lines within a parent Order.

### DELIVERY Module
- **Route**: Logistical delivery runs.
- **Delivery**: Dispatch item assigning an order or subscription shipment to a driver and tracking delivery status.
- **DeliveryAssignment**: Mappings of drivers to specific logistical routes.

### FINANCE Module
- **Invoice**: Financial invoices generated automatically or manually for customer orders/subscriptions.
- **InvoiceItem**: Item lines within invoices.
- **Payment**: Payment transaction register documenting the method (UPI, cash) and completion status.
- **Expense**: Cooperative operating disbursements (feed, fuel, salary) scoped under Categories.

### EMPLOYEES Module
- **Employee**: Worker records containing hiring metrics, linked optionally to a system `User` login.
- **Attendance**: Clock-in and clock-out journals for staff.
- **Salary**: Payroll statements summarizing net salaries, deductions, and pay periods.

### REPORTING Module
- **Notification**: Alerts and event logs dispatched to specific portal users.
- **AuditLog**: Technical database state delta records tracking old vs new values.
- **ActivityLog**: High-level human-readable event feeds.

### SYSTEM Module
- **File**: Secure reference metadata mapping uploaded assets.
- **Setting**: Key-Value configurations per Business.
- **Session**: Active user sessions tracking tokens and user-agents.
- **RefreshToken**: Secure token rotations.

---

## 3. Relational Map Reference

```
+------------+        +----------+        +-------------+
|  Business  |<------|   User   |<------|   Session   |
+------------+        +----------+        +-------------+
      ^                     ^                      
      |                     |                      
      |               +----------+                 
      +--------------| Employee |                 
                      +----------+                 
                            |                      
            +---------------------------------+    
            |               |                 |    
            v               v                 v    
      +------------+  +------------+   +------------+
      | Attendance |  |   Salary   |   |  Delivery  |
      +------------+  +------------+   +------------+
```
