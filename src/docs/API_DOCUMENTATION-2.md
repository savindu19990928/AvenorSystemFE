# Avenor Promotional T-Shirt Management System — API Documentation

Comprehensive REST API Specification and Reference Guide for the **Internal Management System Blueprint (SRS Sections 1–24)** of the Promotional T-Shirt Company operating two registered brands (**Premium Brand** & **Standard Brand**) under **Your Company (Pvt) Ltd**.

---

## 📑 Table of Contents
1. [System Blueprint & Architectural Foundation](#-system-blueprint--architectural-foundation)
2. [Authentication & Authorization](#-authentication--authorization)
3. [Global Error & HTTP Status Conventions](#-global-error--http-status-conventions)
4. [Staff Roles & Permissions Matrix (SRS Section 16)](#-staff-roles--permissions-matrix-srs-section-16)
5. [Order Lifecycle & Department Workflow Transitions](#-order-lifecycle--department-workflow-transitions)
6. [API Endpoints Reference](#-api-endpoints-reference)
   - [1. System Root & Discovery](#1-system-root--discovery)
   - [2. Authentication & JWT Tokens](#2-authentication--jwt-tokens)
   - [3. Core Module & User Administration](#3-core-module--user-administration)
   - [4. Public Website Integration](#4-public-website-integration)
   - [5. Customer Management & CRM](#5-customer-management--crm)
   - [6. Product Catalog & Brand Control](#6-product-catalog--brand-control)
   - [7. Inventory & Blank Garment Stock Management](#7-inventory--blank-garment-stock-management)
   - [8. Quotation System](#8-quotation-system)
   - [9. Order Management (Central Hub)](#9-order-management-central-hub)
   - [10. Artwork & Approval Locking](#10-artwork--approval-locking)
   - [11. Production & Quality Control](#11-production--quality-control)
   - [12. Delivery & Dispatch Management](#12-delivery--dispatch-management)
   - [13. Billing, Invoices & Payments](#13-billing-invoices--payments)
   - [14. Analytics, Profit Tracking & Automated Alerts](#14-analytics-profit-tracking--automated-alerts)
7. [Complete End-to-End Workflow Scenario](#-complete-end-to-end-workflow-scenario)

---

## 🏛 System Blueprint & Architectural Foundation

The Avenor Management System is engineered strictly in accordance with the **System Requirements Specification (SRS Sections 1–24)**:

* **Two-Brand Separation (SRS Sections 2 & 3)**:
  - The legal entity **Your Company (Pvt) Ltd** operates two distinct registered commercial apparel brands:
    - **Premium Brand**: High Quality / Premium (220–260 GSM combed compact cotton, luxury hand feel, tailored for high-end corporate clients and tech events).
    - **Standard Brand**: Low Cost / Standard (160–190 GSM cotton/poly blend, economy promotional merchandise, mass event giveaways).
  - Every brand operation (products, inventory blanks, quotations, orders, production batches, delivery notes, invoices) strictly segregates brand identity. Cross-brand mixing is prevented by system validation rules.
* **Central Order Record (SRS Section 8 & Section 24 Key Design Rule)**:
  - The **Order ID** (`ORD-YYYY-XXXXXX`) acts as the single central hub of truth across the company. Customer details, quotation references, artwork approvals, blank stock reservations, production floor jobs, delivery tracking, invoices, advance deposits, final payments, expenses, and net profit calculations all link directly to this record.
* **Enterprise Audit Trail & Soft Deletions (SRS Section 17)**:
  - All critical business modifications automatically record an immutable `AuditLog` entry tracking `Who`, `What`, `When`, `Old Value`, `New Value`, `Order ID`, `Brand Name`, and `IP Address`.
  - Financial and operational records (Orders, Invoices, Customers) enforce soft deletion and cancellation flags to prevent data loss and ensure historical accountability.

---

## 🔒 Authentication & Authorization

The API uses stateless **JSON Web Token (JWT)** authentication implemented via `djangorestframework-simplejwt`.

### Authorization Header
All protected endpoints require the client to transmit the access token in the standard HTTP `Authorization` header:
```http
Authorization: Bearer <your_access_token>
```

### Custom JWT Token Claims
Upon successful authentication, the issued JWT access token encapsulates claims directly readable by frontend applications:
```json
{
  "token_type": "access",
  "exp": 1790510000,
  "iat": 1790474000,
  "jti": "8b9a2c145d8f4e22a61d07c08a911f93",
  "user_id": 2,
  "username": "sales_lead",
  "email": "sales@avenor.com",
  "role": "SALES",
  "user_type": "SALES"
}
```

---

## ⚠️ Global Error & HTTP Status Conventions

The API adheres to standard REST HTTP response status codes:

| Status Code | Name | Meaning |
|---|---|---|
| `200 OK` | Success | The request succeeded and data is returned in the response body. |
| `201 Created` | Created | A new resource was successfully created (e.g., Customer, Order, Payment). |
| `204 No Content` | No Content | The request succeeded with no body returned (e.g., deletion). |
| `400 Bad Request` | Client Error | Input validation failure, malformed payload, or invalid business logic state. |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT access token. |
| `403 Forbidden` | Forbidden | Authenticated user's Role / User Type lacks permission for the requested action. |
| `404 Not Found` | Not Found | Requested resource ID does not exist. |
| `500 Server Error` | Internal Server Error | Unhandled server exception. |

### Error Response Format
When an error occurs, the server responds with a structured JSON error object:
```json
{
  "error": "Role 'Production' is not permitted to transition order to 'INVOICE'. Allowed roles: ['ADMIN', 'ACCOUNTS']."
}
```
Field-level validation errors return a dictionary mapping invalid field names to error messages:
```json
{
  "quantity": ["Ensure this value is greater than or equal to 1."],
  "email": ["Enter a valid email address."]
}
```

---

## 🛡 Staff Roles & Permissions Matrix (SRS Section 16)

The system enforces six designated staff **User Types / Roles** strictly adhering to **SRS Section 16: Staff Roles & Permissions**:

| User Type / Role | Display Title | Recommended Access (SRS Section 16) | Authorized Operations & Functional Scope | Default Modules |
|---|---|---|---|---|
| `ADMIN` | Admin | Full system access and approvals | Unrestricted access across all endpoints; create/edit staff accounts; brand administration; emergency artwork unlocking; full audit log inspection; financial overrides; all order status transitions | All Modules |
| `SALES` | Sales | Customers, inquiries, quotations and orders | Full CRUD on Customers, CRM Inquiries, Quotations, Orders, Artwork uploads; can cancel orders; view catalog, stock levels, production status, delivery notes, and sales reports | `customers`, `quotations`, `orders`, `artworks`, `catalog`, `inventory` (read), `analytics` (reports) |
| `PRODUCTION` | Production | Production stages and quantities | Initialize and progress Production Jobs and 5 manufacturing stages (`Cutting`, `Printing`, `Sewing`, `Quality Check`, `Packing`); log completed/damaged quantities; read approved locked artwork and blank inventory | `production`, `artworks` (read approved), `inventory` (read blanks), `orders` (read & production transitions) |
| `STORE_KEEPER` | Store Keeper | Inventory and stock movements | Manage warehouse blank garments; inward stock receipt (`receive-stock`); log damaged stock; manage manual stock reservations; receive low-stock alerts | `inventory`, `orders` (read & reserve stock) |
| `ACCOUNTS` | Accounts | Invoices, payments and financial reports | Auto-generate and soft-cancel Invoices; record advance deposits and balance payments; manage Order Expenses; view Profit Tracking reports and executive dashboard KPIs; read customer account balances | `billing`, `analytics` (expenses, profit, reports), `orders` (read & financial transitions), `customers` (read balances) |
| `DELIVERY` | Delivery | Delivery status and tracking | Manage deliveries; courier assignment & dispatch (`dispatch`); update tracking numbers; mark deliveries as delivered with recipient sign-off; generate printable delivery notes | `delivery`, `orders` (read destinations & delivery status) |

### Order Status Transition Permissions by Department
Order transitions are guarded by role per department responsibilities:

| Order Status | Allowed Staff Roles / User Types | Operational Department |
|---|---|---|
| `CUSTOMER_INQUIRY` | `ADMIN`, `SALES` | Sales Department |
| `QUOTATION` | `ADMIN`, `SALES` | Sales Department |
| `QUOTATION_APPROVED` | `ADMIN`, `SALES` | Sales Department |
| `DEPOSIT_PENDING` | `ADMIN`, `SALES`, `ACCOUNTS` | Sales / Accounts |
| `DEPOSIT_RECEIVED` | `ADMIN`, `SALES`, `ACCOUNTS` | Accounts Department |
| `ORDER_CONFIRMED` | `ADMIN`, `SALES` | Sales Department |
| `STOCK_RESERVED` | `ADMIN`, `SALES`, `STORE_KEEPER` | Store Keeper / Warehouse |
| `ARTWORK_APPROVED` | `ADMIN`, `SALES` | Sales / Graphic Design |
| `PRODUCTION` | `ADMIN`, `SALES`, `PRODUCTION` | Production Management |
| `QUALITY_CHECK` | `ADMIN`, `PRODUCTION` | Production Floor |
| `PACKING` | `ADMIN`, `PRODUCTION` | Packaging Team |
| `READY_FOR_DELIVERY` | `ADMIN`, `PRODUCTION` | Production Floor |
| `DELIVERY` | `ADMIN`, `DELIVERY` | Logistics & Dispatch |
| `INVOICE` | `ADMIN`, `ACCOUNTS` | Accounts & Billing |
| `PAYMENT_COMPLETED` | `ADMIN`, `ACCOUNTS` | Accounts & Billing |
| `ORDER_CLOSED` | `ADMIN`, `SALES`, `ACCOUNTS` | Management / Accounts |
| `CANCELLED` | `ADMIN`, `SALES` | Sales / Management |

---

## 🔄 Order Lifecycle & Department Workflow Transitions

```
 ┌─────────────────────────────────────────────────────────┐
 │ 1. Customer Inquiry (Web / Walk-In)                     │  [Sales]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 2. Quotation Drafted & Sent (QT-2026-XXXXXX)            │  [Sales]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 3. Quotation Approved by Customer                       │  [Sales]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 4. Advance Deposit Received (50% Payment)               │  [Accounts]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 5. Order Confirmed (ORD-2026-XXXXXX)                    │  [Sales]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 6. Stock Reserved Automatically (Blanks held in store)  │  [Store Keeper]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 7. Artwork Approved & LOCKED (Production floor safety)   │  [Sales / Client]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 8. Production Floor Stages:                             │  [Production]
 │    ├── Cutting (Blanks physically issued from stock)    │
 │    ├── Printing (Screen / Sublimation / DTF)            │
 │    ├── Sewing / Finishing                               │
 │    ├── Quality Check (Damages recorded with reasons)    │
 │    └── Packing                                          │
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 9. Ready for Delivery                                   │  [Production]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 10. Dispatched with Courier / Delivery Note Generated   │  [Delivery]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 11. Delivered & Handover Confirmed                      │  [Delivery]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 12. Invoice Generated & Balance Settled (INV-2026-XXXX) │  [Accounts]
 └────────────────────────────┬────────────────────────────┘
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 13. Order Closed & Net Profit Audited                   │  [Executive]
 └─────────────────────────────────────────────────────────┘
```

---


## 📡 API Endpoints Reference

### 1. System Root & Discovery

#### `GET /api/`
* **Summary**: Returns root system metadata, active registered brands, and absolute URI links to all subsystem endpoints.
* **SRS Blueprint Topic**: SRS Section 1 (System Overview & Brand Architecture)
* **Required User Type / Role**: `AllowAny` (No authentication required)

##### Example Request
```http
GET /api/ HTTP/1.1
Host: api.avenor.com
Accept: application/json
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "system": "Promotional T-Shirt Company — Internal Management System API",
  "blueprint_version": "2026.1",
  "company": "Your Company (Pvt) Ltd",
  "registered_brands": [
    {
      "brand": "Premium Brand",
      "positioning": "High Quality / 220 GSM"
    },
    {
      "brand": "Standard Brand",
      "positioning": "Low Cost / 160 GSM"
    }
  ],
  "endpoints": {
    "authentication": {
      "obtain_token": "https://api.avenor.com/api/auth/token/",
      "refresh_token": "https://api.avenor.com/api/auth/token/refresh/",
      "current_user": "https://api.avenor.com/api/auth/me/",
      "staff_roles": "https://api.avenor.com/api/auth/roles/"
    },
    "website_integration": {
      "public_request_a_quote": "https://api.avenor.com/api/public/request-a-quote/"
    },
    "management_modules": {
      "core": "https://api.avenor.com/api/core/",
      "customers": "https://api.avenor.com/api/customers/",
      "catalog": "https://api.avenor.com/api/catalog/",
      "inventory": "https://api.avenor.com/api/inventory/",
      "quotations": "https://api.avenor.com/api/quotations/",
      "orders": "https://api.avenor.com/api/orders/",
      "artworks": "https://api.avenor.com/api/artworks/",
      "production": "https://api.avenor.com/api/production/",
      "delivery": "https://api.avenor.com/api/delivery/",
      "billing": "https://api.avenor.com/api/billing/",
      "analytics": "https://api.avenor.com/api/analytics/"
    },
    "executive_controls": {
      "dashboard": "https://api.avenor.com/api/analytics/dashboard/",
      "profit_tracking": "https://api.avenor.com/api/analytics/profit/",
      "automatic_alerts": "https://api.avenor.com/api/analytics/alerts/",
      "sales_reports": "https://api.avenor.com/api/analytics/reports/"
    }
  }
}
```

---

### 2. Authentication & JWT Tokens

#### `POST /api/auth/token/`
* **Summary**: Authenticate using staff username and password. Issues a JSON Web Token pair (`access` and `refresh`) along with user profile metadata and granted permissions array.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Roles & Permissions)
* **Required User Type / Role**: `AllowAny` (Public)

##### Example Request
```http
POST /api/auth/token/ HTTP/1.1
Host: api.avenor.com
Content-Type: application/json
```
```json
{
  "username": "sales_lead",
  "password": "SalesSecurePassword2026!"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MDU5NjQwMCwidXNlcl9pZCI6Mn0...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkwNTEwMDAwLCJ1c2VyX2lkIjoyLCJyb2xlIjoiU0FMRVMifQ...",
  "user": {
    "id": 2,
    "username": "sales_lead",
    "email": "sales@avenor.com",
    "first_name": "Ruwan",
    "last_name": "Jayasinghe",
    "role": "SALES",
    "user_type": "SALES",
    "role_display": "Sales",
    "user_type_display": "Sales",
    "department": "Corporate Sales",
    "phone": "+94 77 123 4567",
    "is_staff": false,
    "is_superuser": false,
    "permissions": [
      "manage_customers",
      "manage_inquiries",
      "manage_quotations",
      "manage_orders",
      "manage_artworks",
      "view_catalog",
      "view_inventory",
      "view_production_status",
      "view_delivery_status",
      "view_invoices",
      "view_sales_reports"
    ]
  }
}
```

---

#### `POST /api/auth/token/refresh/`
* **Summary**: Obtain a refreshed JWT access token using a valid, unexpired refresh token without requiring re-authentication.
* **SRS Blueprint Topic**: SRS Section 16 (Authentication Architecture)
* **Required User Type / Role**: `AllowAny` (Public)

##### Example Request
```http
POST /api/auth/token/refresh/ HTTP/1.1
Host: api.avenor.com
Content-Type: application/json
```
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MDU5NjQwMCwidXNlcl9pZCI6Mn0..."
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkwNTEzNjAwLCJ1c2VyX2lkIjoyLCJyb2xlIjoiU0FMRVMifQ..."
}
```

---

#### `GET /api/auth/me/`
* **Summary**: Retrieve detailed identity, assigned user type, department info, and complete permissions summary of the currently authenticated staff user.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Roles & Permissions)
* **Required User Type / Role**: Authenticated (`ADMIN`, `SALES`, `PRODUCTION`, `STORE_KEEPER`, `ACCOUNTS`, `DELIVERY`)

##### Example Request
```http
GET /api/auth/me/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "username": "sales_lead",
  "email": "sales@avenor.com",
  "first_name": "Ruwan",
  "last_name": "Jayasinghe",
  "role": "SALES",
  "user_type": "SALES",
  "role_display": "Sales",
  "user_type_display": "Sales",
  "phone": "+94 77 123 4567",
  "department": "Corporate Sales",
  "is_active": true,
  "permissions": [
    "manage_customers",
    "manage_inquiries",
    "manage_quotations",
    "manage_orders",
    "manage_artworks",
    "view_catalog",
    "view_inventory",
    "view_production_status",
    "view_delivery_status",
    "view_invoices",
    "view_sales_reports"
  ],
  "permissions_summary": {
    "role": "SALES",
    "user_type": "SALES",
    "title": "Sales",
    "recommended_access": "Customers, inquiries, quotations and orders",
    "modules": [
      "customers",
      "inquiries",
      "quotations",
      "orders",
      "artworks",
      "catalog",
      "sales_reports"
    ],
    "permissions": [
      "manage_customers",
      "manage_inquiries",
      "manage_quotations",
      "manage_orders",
      "manage_artworks",
      "view_catalog",
      "view_inventory",
      "view_production_status",
      "view_delivery_status",
      "view_invoices",
      "view_sales_reports"
    ]
  },
  "date_joined": "2026-09-25T07:40:00Z"
}
```

---

#### `GET /api/auth/roles/` (or `/api/auth/user-types/`)
* **Summary**: Public reference endpoint listing all six staff User Types / Roles, titles, recommended access verbatim from SRS Section 16, and authorized functional scopes.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Roles & Permissions)
* **Required User Type / Role**: `AllowAny` (Public)

##### Example Request
```http
GET /api/auth/roles/ HTTP/1.1
Host: api.avenor.com
Accept: application/json
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "topic": "SRS Section 16: Staff Roles & Permissions",
  "user_types": [
    {
      "role": "ADMIN",
      "user_type": "ADMIN",
      "title": "Admin",
      "recommended_access": "Full system access and approvals",
      "modules": ["all"],
      "permissions": ["all"]
    },
    {
      "role": "SALES",
      "user_type": "SALES",
      "title": "Sales",
      "recommended_access": "Customers, inquiries, quotations and orders",
      "modules": ["customers", "inquiries", "quotations", "orders", "artworks", "catalog", "sales_reports"],
      "permissions": ["manage_customers", "manage_inquiries", "manage_quotations", "manage_orders", "manage_artworks", "view_catalog", "view_inventory", "view_production_status", "view_delivery_status", "view_invoices", "view_sales_reports"]
    },
    {
      "role": "PRODUCTION",
      "user_type": "PRODUCTION",
      "title": "Production",
      "recommended_access": "Production stages and quantities",
      "modules": ["production", "artworks", "orders", "inventory"],
      "permissions": ["manage_production", "view_approved_artworks", "view_orders", "view_inventory"]
    },
    {
      "role": "STORE_KEEPER",
      "user_type": "STORE_KEEPER",
      "title": "Store Keeper",
      "recommended_access": "Inventory and stock movements",
      "modules": ["inventory", "orders"],
      "permissions": ["manage_inventory", "receive_stock", "report_damaged_stock", "view_orders", "reserve_stock"]
    },
    {
      "role": "ACCOUNTS",
      "user_type": "ACCOUNTS",
      "title": "Accounts",
      "recommended_access": "Invoices, payments and financial reports",
      "modules": ["billing", "analytics", "orders", "customers"],
      "permissions": ["manage_invoices", "manage_payments", "manage_expenses", "view_profit_reports", "view_financial_dashboard", "view_orders", "view_customer_balances"]
    },
    {
      "role": "DELIVERY",
      "user_type": "DELIVERY",
      "title": "Delivery",
      "recommended_access": "Delivery status and tracking",
      "modules": ["delivery", "orders"],
      "permissions": ["manage_delivery", "dispatch_orders", "confirm_delivery", "view_orders", "print_delivery_notes"]
    }
  ]
}
```

---

### 3. Core Module & User Administration

#### `GET /api/core/users/`
* **Summary**: List staff accounts across the enterprise. Filterable by staff `user_type`, `role`, `department`, or active status.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Roles & Permissions)
* **Required User Type / Role**: `ADMIN`
* **Query Parameters**:
  - `user_type`: Filter by staff user type (`ADMIN`, `SALES`, `PRODUCTION`, `STORE_KEEPER`, `ACCOUNTS`, `DELIVERY`)
  - `department`: Filter by department string
  - `is_active`: Boolean (`true` or `false`)
  - `search`: Keyword search matching username, name, email, or phone

##### Example Request
```http
GET /api/core/users/?user_type=SALES&is_active=true HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 2,
    "username": "sales_lead",
    "email": "sales@avenor.com",
    "first_name": "Ruwan",
    "last_name": "Jayasinghe",
    "role": "SALES",
    "user_type": "SALES",
    "role_display": "Sales",
    "user_type_display": "Sales",
    "phone": "+94 77 123 4567",
    "department": "Corporate Sales",
    "is_active": true,
    "date_joined": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `POST /api/core/users/`
* **Summary**: Create a new staff account with designated user type and departmental assignment. Accepts either `user_type` or `role`.
* **SRS Blueprint Topic**: SRS Section 16 (Staff User Provisioning)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
POST /api/core/users/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
Content-Type: application/json
```
```json
{
  "username": "prod_supervisor",
  "password": "ProdPass2026!Secure",
  "email": "production@avenor.com",
  "first_name": "Sunil",
  "last_name": "Wickramasinghe",
  "user_type": "PRODUCTION",
  "department": "Factory Floor Line 1",
  "phone": "+94 71 444 7890"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 7,
  "username": "prod_supervisor",
  "email": "production@avenor.com",
  "first_name": "Sunil",
  "last_name": "Wickramasinghe",
  "role": "PRODUCTION",
  "user_type": "PRODUCTION",
  "role_display": "Production",
  "user_type_display": "Production",
  "phone": "+94 71 444 7890",
  "department": "Factory Floor Line 1",
  "is_active": true,
  "permissions": [
    "manage_production",
    "view_approved_artworks",
    "view_orders",
    "view_inventory"
  ],
  "date_joined": "2026-09-27T10:15:00Z"
}
```

---

#### `GET /api/core/users/{id}/`
* **Summary**: Retrieve detailed account properties, granted permissions, and department profile for a specific staff member.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Administration)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
GET /api/core/users/7/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 7,
  "username": "prod_supervisor",
  "email": "production@avenor.com",
  "first_name": "Sunil",
  "last_name": "Wickramasinghe",
  "role": "PRODUCTION",
  "user_type": "PRODUCTION",
  "role_display": "Production",
  "user_type_display": "Production",
  "phone": "+94 71 444 7890",
  "department": "Factory Floor Line 1",
  "is_active": true,
  "permissions": [
    "manage_production",
    "view_approved_artworks",
    "view_orders",
    "view_inventory"
  ],
  "date_joined": "2026-09-27T10:15:00Z"
}
```

---

#### `PATCH /api/core/users/{id}/`
* **Summary**: Update staff user attributes such as phone, department, role, or active status.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Administration)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
PATCH /api/core/users/7/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
Content-Type: application/json
```
```json
{
  "department": "Factory Floor Line 2 (Screen Printing)",
  "phone": "+94 71 444 9999"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 7,
  "username": "prod_supervisor",
  "email": "production@avenor.com",
  "first_name": "Sunil",
  "last_name": "Wickramasinghe",
  "role": "PRODUCTION",
  "user_type": "PRODUCTION",
  "role_display": "Production",
  "user_type_display": "Production",
  "phone": "+94 71 444 9999",
  "department": "Factory Floor Line 2 (Screen Printing)",
  "is_active": true,
  "permissions": [
    "manage_production",
    "view_approved_artworks",
    "view_orders",
    "view_inventory"
  ],
  "date_joined": "2026-09-27T10:15:00Z"
}
```

---

#### `DELETE /api/core/users/{id}/`
* **Summary**: Remove a staff account.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Administration)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
DELETE /api/core/users/7/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
```

##### Example Response
```http
HTTP/1.1 204 No Content
```

---

#### `GET /api/core/users/profile/`
* **Summary**: Current staff member views their own profile information and assigned role.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Profile)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/core/users/profile/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "username": "sales_lead",
  "email": "sales@avenor.com",
  "first_name": "Ruwan",
  "last_name": "Jayasinghe",
  "role": "SALES",
  "user_type": "SALES",
  "role_display": "Sales",
  "user_type_display": "Sales",
  "phone": "+94 77 123 4567",
  "department": "Corporate Sales",
  "is_active": true,
  "permissions": [
    "manage_customers",
    "manage_inquiries",
    "manage_quotations",
    "manage_orders",
    "manage_artworks",
    "view_catalog",
    "view_inventory",
    "view_production_status",
    "view_delivery_status",
    "view_invoices",
    "view_sales_reports"
  ],
  "date_joined": "2026-09-25T07:40:00Z"
}
```

---

#### `PATCH /api/core/users/profile/`
* **Summary**: Current staff member updates their own personal details (first name, last name, phone). Role elevation is strictly blocked.
* **SRS Blueprint Topic**: SRS Section 16 (Staff Self-Service)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
PATCH /api/core/users/profile/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "phone": "+94 77 999 1122"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "username": "sales_lead",
  "email": "sales@avenor.com",
  "first_name": "Ruwan",
  "last_name": "Jayasinghe",
  "role": "SALES",
  "user_type": "SALES",
  "phone": "+94 77 999 1122",
  "department": "Corporate Sales",
  "is_active": true
}
```

---

#### `GET /api/core/brands/`
* **Summary**: List the registered brands operated under Your Company (Pvt) Ltd. Enforces two-brand separation between Premium and Standard positioning.
* **SRS Blueprint Topic**: SRS Section 2 (Two-Brand Structure) & Section 3 (Brand Separation)
* **Required User Type / Role**: Authenticated staff (Read-only for all staff; Write for `ADMIN`)

##### Example Request
```http
GET /api/core/brands/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "company_name": "Your Company (Pvt) Ltd",
    "name": "Premium Brand",
    "code": "PREMIUM",
    "positioning": "High Quality / Premium (220 GSM)",
    "description": "High density 220–260 GSM combed compact cotton for high-end corporate merch.",
    "is_active": true,
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  },
  {
    "id": 2,
    "company_name": "Your Company (Pvt) Ltd",
    "name": "Standard Brand",
    "code": "STANDARD",
    "positioning": "Low Cost / Standard (160 GSM)",
    "description": "Economy merchandise 160–190 GSM cotton/poly blend for mass volume events.",
    "is_active": true,
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `GET /api/core/brands/{id}/`
* **Summary**: Retrieve brand profile and positioning guidelines for a specific brand ID.
* **SRS Blueprint Topic**: SRS Section 2 & 3
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/core/brands/1/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "company_name": "Your Company (Pvt) Ltd",
  "name": "Premium Brand",
  "code": "PREMIUM",
  "positioning": "High Quality / Premium (220 GSM)",
  "description": "High density 220–260 GSM combed compact cotton for high-end corporate merch.",
  "is_active": true,
  "created_at": "2026-09-25T07:40:00Z",
  "updated_at": "2026-09-25T07:40:00Z"
}
```

---

#### `GET /api/core/audit-logs/`
* **Summary**: Inspect immutable audit trail recording critical system mutations (Who / What / When / Old Value / New Value / Order ID / IP Address).
* **SRS Blueprint Topic**: SRS Section 17 (Audit Trail & Activity Log) & Section 16 (Admin Role Oversight)
* **Required User Type / Role**: `ADMIN`
* **Query Parameters**:
  - `order_id`: Filter events associated with central Order ID (e.g. `ORD-2026-000125`)
  - `action`: Filter by audit action code (e.g. `ORDER_STATUS_TRANSITION`, `APPROVE_AND_LOCK_ARTWORK`, `RECEIVE_STOCK`)
  - `brand_name`: Filter by brand name string
  - `user`: Filter by user ID

##### Example Request
```http
GET /api/core/audit-logs/?order_id=ORD-2026-000125&action=ORDER_STATUS_TRANSITION HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 18,
    "user": 2,
    "user_name": "sales_lead",
    "user_role": "SALES",
    "action": "ORDER_STATUS_TRANSITION",
    "model_name": "Order",
    "object_id": "1",
    "object_repr": "ORD-2026-000125",
    "order_id": "ORD-2026-000125",
    "brand_name": "Premium Brand",
    "field_name": "status",
    "old_value": "ORDER_CONFIRMED",
    "new_value": "PRODUCTION",
    "details": {
      "notes": "Artwork signed off and locked; released to factory floor."
    },
    "ip_address": "127.0.0.1",
    "timestamp": "2026-09-25T08:15:22Z"
  }
]
```

---

#### `GET /api/core/notifications/`
* **Summary**: Retrieve operational notifications and alerts. Notifications are automatically filtered to the authenticated staff member's target role to eliminate noise across departments.
* **SRS Blueprint Topic**: SRS Section 18 (Automatic Alerts & Notifications)
* **Required User Type / Role**: Authenticated staff (`ADMIN` sees all; other roles see notifications targeted to their department)
* **Query Parameters**:
  - `is_read`: Boolean (`false` for unread only)
  - `severity`: Alert severity (`INFO`, `WARNING`, `CRITICAL`)
  - `order_id`: Filter alerts by associated Order ID

##### Example Request
```http
GET /api/core/notifications/?is_read=false HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 4,
    "title": "Delivery Date Approaching: ORD-2026-000125",
    "message": "Order ORD-2026-000125 expected delivery is tomorrow. Currently in Production.",
    "alert_type": "DELIVERY_APPROACHING",
    "severity": "WARNING",
    "order_id": "ORD-2026-000125",
    "target_role": "DELIVERY",
    "is_read": false,
    "read_by": null,
    "read_at": null,
    "created_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `POST /api/core/notifications/{id}/mark_as_read/`
* **Summary**: Mark a specific notification as read by the current user.
* **SRS Blueprint Topic**: SRS Section 18 (Notification Acknowledgment)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
POST /api/core/notifications/4/mark_as_read/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "status": "Notification marked as read"
}
```

---

#### `POST /api/core/notifications/mark_all_read/`
* **Summary**: Mark all active unread notifications visible to the authenticated user as read in bulk.
* **SRS Blueprint Topic**: SRS Section 18 (Notification Clearing)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
POST /api/core/notifications/mark_all_read/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "status": "All notifications marked as read"
}
```

---

### 4. Public Website Integration

#### `POST /api/public/request-a-quote/`
* **Summary**: External public endpoint accepting prospective customer inquiries from website forms. Automatically creates a `NEW` CRM inquiry assigned to the designated brand.
* **SRS Blueprint Topic**: SRS Section 21 (Website Integration & Contact/Quote Form)
* **Required User Type / Role**: `AllowAny` (No authentication required)
* **Business Rules**: `brand` ID must point to a valid active Brand (1 = Premium Brand, 2 = Standard Brand). Quantity must be $\ge 1$.

##### Example Request
```http
POST /api/public/request-a-quote/ HTTP/1.1
Host: api.avenor.com
Content-Type: application/json
```
```json
{
  "brand": 1,
  "name": "Shenal Fernando",
  "company_name": "Ceylon Digital Media (Pvt) Ltd",
  "email": "shenal@ceylondigital.com",
  "phone": "+94 76 555 1234",
  "whatsapp": "+94 76 555 1234",
  "product_name": "Premium T-Shirt 220 GSM",
  "quantity": 500,
  "fabric_gsm": "220 GSM",
  "printing_method": "3-Color Front Screen Print",
  "requirements": "Need 500 black heavyweight t-shirts for annual tech summit offsite."
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "message": "Quote request received successfully. Our team will contact you shortly.",
  "inquiry_id": 3,
  "brand": "Premium Brand"
}
```

---


### 5. Customer Management & CRM

#### `GET /api/customers/customers/`
* **Summary**: List corporate and individual clients with real-time computed financial metrics: `total_purchases`, `total_paid`, and `outstanding_balance`.
* **SRS Blueprint Topic**: SRS Section 6 (Customer Management) & Section 16 (Sales/Admin write; Accounts/Delivery/Production read)
* **Required User Type / Role**: `SALES`, `ADMIN` (Full CRUD); `ACCOUNTS`, `DELIVERY`, `PRODUCTION` (Read-only)
* **Query Parameters**:
  - `customer_type`: Filter by client classification (`CORPORATE`, `RETAIL`, `EVENT_ORGANIZER`, `GOVERNMENT`)
  - `company_name`: Filter by exact company name
  - `search`: Keyword search across company name, contact person, phone, email, and tax ID

##### Example Request
```http
GET /api/customers/customers/?customer_type=CORPORATE&search=Apex HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "company_name": "Apex Global Technologies (Pvt) Ltd",
    "contact_person": "Kasun Perera",
    "phone": "+94 77 987 6543",
    "whatsapp": "+94 77 987 6543",
    "email": "procurement@apextech.com",
    "customer_type": "CORPORATE",
    "billing_address": "Level 12, World Trade Center, Colombo 01",
    "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
    "tax_number": "VAT-10023498-7000",
    "general_notes": "Annual corporate apparel client.",
    "total_purchases": "750000.00",
    "total_paid": "375000.00",
    "outstanding_balance": "375000.00",
    "total_orders_count": 1,
    "is_deleted": false,
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `POST /api/customers/customers/`
* **Summary**: Register a new client profile in the CRM database. Only customer name (`contact_person` or `name`) is required; all other fields are optional. Logs an audit record and initialises purchase and balance accumulators to zero.
* **SRS Blueprint Topic**: SRS Section 6 (Customer Profile Creation)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/customers/customers/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "company_name": "Venture Builders Ltd",
  "contact_person": "Malik De Silva",
  "phone": "+94 71 888 4321",
  "whatsapp": "+94 71 888 4321",
  "email": "malik@venturebuilders.io",
  "customer_type": "CORPORATE",
  "billing_address": "88 Union Place, Colombo 02",
  "delivery_address": "88 Union Place, Colombo 02",
  "tax_number": "VAT-44910283-7000",
  "general_notes": "Prefers Premium Brand heavyweight cotton for all company merchandise."
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "company_name": "Venture Builders Ltd",
  "contact_person": "Malik De Silva",
  "phone": "+94 71 888 4321",
  "whatsapp": "+94 71 888 4321",
  "email": "malik@venturebuilders.io",
  "customer_type": "CORPORATE",
  "billing_address": "88 Union Place, Colombo 02",
  "delivery_address": "88 Union Place, Colombo 02",
  "tax_number": "VAT-44910283-7000",
  "general_notes": "Prefers Premium Brand heavyweight cotton for all company merchandise.",
  "total_purchases": "0.00",
  "total_paid": "0.00",
  "outstanding_balance": "0.00",
  "total_orders_count": 0,
  "is_deleted": false,
  "created_at": "2026-09-27T10:30:00Z",
  "updated_at": "2026-09-27T10:30:00Z"
}
```

---

#### `GET /api/customers/customers/{id}/`
* **Summary**: Retrieve detailed customer profile including nested interaction history notes and uploaded account documents.
* **SRS Blueprint Topic**: SRS Section 6 (Customer Master View)
* **Required User Type / Role**: `SALES`, `ADMIN`, `ACCOUNTS`, `DELIVERY`, `PRODUCTION`

##### Example Request
```http
GET /api/customers/customers/1/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "company_name": "Apex Global Technologies (Pvt) Ltd",
  "contact_person": "Kasun Perera",
  "phone": "+94 77 987 6543",
  "whatsapp": "+94 77 987 6543",
  "email": "procurement@apextech.com",
  "customer_type": "CORPORATE",
  "billing_address": "Level 12, World Trade Center, Colombo 01",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "tax_number": "VAT-10023498-7000",
  "general_notes": "Annual corporate apparel client.",
  "total_purchases": "750000.00",
  "total_paid": "375000.00",
  "outstanding_balance": "375000.00",
  "total_orders_count": 1,
  "is_deleted": false,
  "notes": [
    {
      "id": 1,
      "customer": 1,
      "user": 2,
      "user_name": "sales_lead",
      "note": "Client requests deliveries strictly on weekday mornings.",
      "created_at": "2026-09-25T07:45:00Z"
    }
  ],
  "documents": []
}
```

---

#### `PATCH /api/customers/customers/{id}/`
* **Summary**: Partial update of customer details (addresses, contact person, phone number).
* **SRS Blueprint Topic**: SRS Section 6 (Customer Updating)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
PATCH /api/customers/customers/1/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "delivery_address": "Apex Tech Campus, 100 Sri Jayawardenepura Kotte"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "company_name": "Apex Global Technologies (Pvt) Ltd",
  "contact_person": "Kasun Perera",
  "phone": "+94 77 987 6543",
  "whatsapp": "+94 77 987 6543",
  "email": "procurement@apextech.com",
  "customer_type": "CORPORATE",
  "billing_address": "Level 12, World Trade Center, Colombo 01",
  "delivery_address": "Apex Tech Campus, 100 Sri Jayawardenepura Kotte",
  "tax_number": "VAT-10023498-7000",
  "total_purchases": "750000.00",
  "total_paid": "375000.00",
  "outstanding_balance": "375000.00",
  "total_orders_count": 1,
  "is_deleted": false,
  "updated_at": "2026-09-27T10:35:00Z"
}
```

---

#### `DELETE /api/customers/customers/{id}/`
* **Summary**: Soft-delete a customer record. Marks `is_deleted = true` to preserve historical integrity in accordance with SRS Section 17.
* **SRS Blueprint Topic**: SRS Section 17 (Soft Delete & Data Protection)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
DELETE /api/customers/customers/2/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 204 No Content
```

---

#### `POST /api/customers/customers/{id}/add-note/`
* **Summary**: Log a dated sales or CRM interaction note to the customer's chronological record.
* **SRS Blueprint Topic**: SRS Section 6 (Customer Interaction Notes)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/customers/customers/1/add-note/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "note": "Spoke with procurement officer; expecting another 1000 polo order next month for regional office."
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "customer": 1,
  "user": 2,
  "user_name": "sales_lead",
  "note": "Spoke with procurement officer; expecting another 1000 polo order next month for regional office.",
  "created_at": "2026-09-27T10:40:00Z"
}
```

---

#### `POST /api/customers/customers/{id}/upload-document/`
* **Summary**: Attach business documents (e.g. VAT certificate, signed credit agreement) to customer profile.
* **SRS Blueprint Topic**: SRS Section 6 & Section 19 (Document Management)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/customers/customers/1/upload-document/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryCustomerDoc
```
```multipart
------WebKitFormBoundaryCustomerDoc
Content-Disposition: form-data; name="document_type"

CREDIT_AGREEMENT
------WebKitFormBoundaryCustomerDoc
Content-Disposition: form-data; name="title"

Signed 30-Day Credit Agreement 2026
------WebKitFormBoundaryCustomerDoc
Content-Disposition: form-data; name="file"; filename="credit_agreement_apex.pdf"
Content-Type: application/pdf

<binary_data>
------WebKitFormBoundaryCustomerDoc--
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 1,
  "customer": 1,
  "document_type": "CREDIT_AGREEMENT",
  "document_type_display": "Credit Agreement",
  "title": "Signed 30-Day Credit Agreement 2026",
  "file": "/media/customer_documents/credit_agreement_apex.pdf",
  "uploaded_by": 2,
  "uploaded_by_name": "sales_lead",
  "created_at": "2026-09-27T10:45:00Z"
}
```

---

#### `GET /api/customers/customers/{id}/orders/`
* **Summary**: Retrieve list of all orders associated with this customer across both brands.
* **SRS Blueprint Topic**: SRS Section 6 & 8
* **Required User Type / Role**: `SALES`, `ADMIN`, `ACCOUNTS`

##### Example Request
```http
GET /api/customers/customers/1/orders/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "order_id": "ORD-2026-000125",
    "brand": 1,
    "brand_name": "Premium Brand",
    "status": "PRODUCTION",
    "total_amount": "750000.00",
    "paid_amount": "375000.00",
    "balance_amount": "375000.00",
    "created_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `GET /api/customers/customers/{id}/payments/`
* **Summary**: Retrieve complete payment history (both deposits and balance settlements) recorded for this customer.
* **SRS Blueprint Topic**: SRS Section 6 & 14
* **Required User Type / Role**: `SALES`, `ADMIN`, `ACCOUNTS`

##### Example Request
```http
GET /api/customers/customers/1/payments/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "payment_id": "PAY-2026-000001",
    "order": 1,
    "order_code": "ORD-2026-000125",
    "amount": "375000.00",
    "payment_type": "DEPOSIT",
    "payment_method": "BANK_TRANSFER",
    "payment_date": "2026-09-25"
  }
]
```

---

#### `GET /api/customers/inquiries/`
* **Summary**: List incoming customer quote requests and website leads. Filterable by status and brand.
* **SRS Blueprint Topic**: SRS Section 21 (CRM Leads Management)
* **Required User Type / Role**: `SALES`, `ADMIN`
* **Query Parameters**:
  - `status`: Filter by lead status (`NEW`, `CONTACTED`, `QUOTATION_SENT`, `CONVERTED`, `LOST`)
  - `brand`: Filter by Brand ID (`1` = Premium, `2` = Standard)
  - `assigned_sales`: Filter by assigned staff User ID

##### Example Request
```http
GET /api/customers/inquiries/?status=NEW&brand=1 HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 3,
    "brand": 1,
    "brand_name": "Premium Brand",
    "customer": null,
    "name": "Shenal Fernando",
    "company_name": "Ceylon Digital Media (Pvt) Ltd",
    "email": "shenal@ceylondigital.com",
    "phone": "+94 76 555 1234",
    "whatsapp": "+94 76 555 1234",
    "product_name": "Premium T-Shirt 220 GSM",
    "quantity": 500,
    "fabric_gsm": "220 GSM",
    "printing_method": "3-Color Front Screen Print",
    "requirements": "Need 500 black heavyweight t-shirts for annual tech summit offsite.",
    "status": "NEW",
    "source": "WEBSITE",
    "assigned_sales": null,
    "created_at": "2026-09-27T10:15:00Z"
  }
]
```

---

#### `POST /api/customers/inquiries/{id}/convert-to-customer/`
* **Summary**: Automatically convert an incoming inquiry lead into a registered customer profile, populating name, company, contact, and requirements without re-entry.
* **SRS Blueprint Topic**: SRS Section 21 & Section 7 (Lead Conversion Workflow)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/customers/inquiries/3/convert-to-customer/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 3,
  "company_name": "Ceylon Digital Media (Pvt) Ltd",
  "contact_person": "Shenal Fernando",
  "phone": "+94 76 555 1234",
  "whatsapp": "+94 76 555 1234",
  "email": "shenal@ceylondigital.com",
  "customer_type": "CORPORATE",
  "billing_address": "Provided via Web Inquiry",
  "delivery_address": "",
  "tax_number": "",
  "general_notes": "Converted from Inquiry #3. Requirements: Need 500 black heavyweight t-shirts for annual tech summit offsite.",
  "total_purchases": "0.00",
  "total_paid": "0.00",
  "outstanding_balance": "0.00",
  "total_orders_count": 0,
  "is_deleted": false,
  "created_at": "2026-09-27T10:50:00Z",
  "updated_at": "2026-09-27T10:50:00Z"
}
```

---

### 6. Product Catalog & Brand Control

#### `GET /api/catalog/products/`
* **Summary**: List products partitioned strictly by Brand. Prevents cross-brand apparel mixing.
* **SRS Blueprint Topic**: SRS Section 4 (Product Catalog & Brand Partitioning)
* **Required User Type / Role**: Authenticated staff (Read-only for all; Write for `ADMIN`)
* **Query Parameters**:
  - `brand`: Filter by Brand ID (`1` = Premium Brand, `2` = Standard Brand)
  - `product_type`: Filter by garment style (`TSHIRT`, `POLO`, `HOODIE`, `CAP`, `TOTE_BAG`)
  - `is_active`: Boolean (`true` or `false`)

##### Example Request
```http
GET /api/catalog/products/?brand=1&product_type=TSHIRT HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "brand": 1,
    "brand_name": "Premium Brand",
    "name": "Premium T-Shirt – 220 GSM",
    "code": "PREM-TSHIRT-220",
    "product_type": "TSHIRT",
    "default_gsm": "220 GSM",
    "fabric_composition": "100% Combed Compact Cotton",
    "base_price": "1500.00",
    "description": "Heavyweight 220 GSM pre-shrunk cotton t-shirt with ribbed collar.",
    "is_active": true,
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `POST /api/catalog/products/`
* **Summary**: Create a new garment product line strictly associated with a Brand.
* **SRS Blueprint Topic**: SRS Section 4 (Product Specifications & Brand Assignment)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
POST /api/catalog/products/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
Content-Type: application/json
```
```json
{
  "brand": 1,
  "name": "Premium Heavyweight Hoodie",
  "code": "PREM-HOODIE-320",
  "product_type": "HOODIE",
  "default_gsm": "320 GSM",
  "fabric_composition": "100% Cotton Brushed Fleece",
  "base_price": "3800.00",
  "description": "Double lined hood with kangaroo pocket and custom drawstring.",
  "is_active": true
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 4,
  "brand": 1,
  "brand_name": "Premium Brand",
  "name": "Premium Heavyweight Hoodie",
  "code": "PREM-HOODIE-320",
  "product_type": "HOODIE",
  "default_gsm": "320 GSM",
  "fabric_composition": "100% Cotton Brushed Fleece",
  "base_price": "3800.00",
  "description": "Double lined hood with kangaroo pocket and custom drawstring.",
  "is_active": true,
  "created_at": "2026-09-27T11:00:00Z",
  "updated_at": "2026-09-27T11:00:00Z",
  "specifications": []
}
```

---

#### `GET /api/catalog/products/{id}/`
* **Summary**: Retrieve complete product details along with all associated variant SKU specifications (Size, Colour, GSM, SKU code).
* **SRS Blueprint Topic**: SRS Section 4 (Product Detail & SKU Specifications)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/catalog/products/1/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "brand": 1,
  "brand_name": "Premium Brand",
  "name": "Premium T-Shirt – 220 GSM",
  "code": "PREM-TSHIRT-220",
  "product_type": "TSHIRT",
  "default_gsm": "220 GSM",
  "fabric_composition": "100% Combed Compact Cotton",
  "base_price": "1500.00",
  "description": "Heavyweight 220 GSM pre-shrunk cotton t-shirt with ribbed collar.",
  "is_active": true,
  "specifications": [
    {
      "id": 1,
      "product": 1,
      "size": "L",
      "colour": "Black",
      "gsm": "220 GSM",
      "additional_price": "0.00",
      "sku": "PREM-TSHIRT-220-BLA-L"
    },
    {
      "id": 2,
      "product": 1,
      "size": "XL",
      "colour": "White",
      "gsm": "220 GSM",
      "additional_price": "0.00",
      "sku": "PREM-TSHIRT-220-WHI-XL"
    }
  ]
}
```

---

#### `POST /api/catalog/products/{id}/specifications/`
* **Summary**: Add a size/colour variant SKU specification to a product. SKU code is automatically generated.
* **SRS Blueprint Topic**: SRS Section 4 (Variant SKU Generation)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
POST /api/catalog/products/1/specifications/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
Content-Type: application/json
```
```json
{
  "size": "M",
  "colour": "Navy Blue",
  "gsm": "220 GSM",
  "additional_price": "0.00"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 3,
  "product": 1,
  "size": "M",
  "colour": "Navy Blue",
  "gsm": "220 GSM",
  "additional_price": "0.00",
  "sku": "PREM-TSHIRT-220-NAV-M"
}
```

---

#### `GET /api/catalog/specifications/`
* **Summary**: List all variant SKU specifications across all products.
* **SRS Blueprint Topic**: SRS Section 4
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/catalog/specifications/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "product": 1,
    "size": "L",
    "colour": "Black",
    "gsm": "220 GSM",
    "additional_price": "0.00",
    "sku": "PREM-TSHIRT-220-BLA-L"
  }
]
```

---

### 7. Inventory & Blank Garment Stock Management

#### `GET /api/inventory/inventory-items/`
* **Summary**: List plain blank garments held in warehouse with physical on hand, reserved, and available counts.
* **SRS Blueprint Topic**: SRS Section 11 (Inventory Management) & Section 16 (Store Keeper/Admin manage; Sales/Production view)
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN` (Full CRUD); `SALES`, `PRODUCTION` (Read-only)
* **Query Parameters**:
  - `brand`: Filter by Brand ID (`1` = Premium Brand, `2` = Standard Brand)
  - `colour`: Filter by garment colour (e.g. `Black`, `White`, `Navy Blue`)
  - `size`: Filter by size (e.g. `S`, `M`, `L`, `XL`, `2XL`)

##### Example Request
```http
GET /api/inventory/inventory-items/?brand=1&colour=Black HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "product": 1,
    "product_name": "Premium T-Shirt – 220 GSM",
    "brand": 1,
    "brand_id": 1,
    "brand_name": "Premium Brand",
    "sku": "PREM-TSHIRT-220-BLA-L",
    "colour": "Black",
    "size": "L",
    "fabric_gsm": "220 GSM",
    "quantity_on_hand": 850,
    "reserved_quantity": 500,
    "available_quantity": 350,
    "reorder_level": 100,
    "is_low_stock": false,
    "unit_cost": "650.00",
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `GET /api/inventory/inventory-items/low-stock/`
* **Summary**: Return inventory blanks where `quantity_on_hand <= reorder_level` triggering automated restocking warnings.
* **SRS Blueprint Topic**: SRS Section 11 & Section 18 (Low Stock Alert Criteria)
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN`, `SALES`, `PRODUCTION`

##### Example Request
```http
GET /api/inventory/inventory-items/low-stock/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 9,
    "product": 1,
    "product_name": "Premium T-Shirt – 220 GSM",
    "brand": 1,
    "brand_name": "Premium Brand",
    "sku": "PREM-TSHIRT-220-NAV-XL",
    "colour": "Navy Blue",
    "size": "XL",
    "quantity_on_hand": 35,
    "reserved_quantity": 0,
    "available_quantity": 35,
    "reorder_level": 100,
    "is_low_stock": true,
    "unit_cost": "650.00"
  }
]
```

---

#### `POST /api/inventory/inventory-items/{id}/receive-stock/`
* **Summary**: Record inward warehouse receipt of plain blank garments from fabric mill or supplier. Automatically increases physical count, updates unit cost, logs a `StockMovement` entry, and writes to `AuditLog`.
* **SRS Blueprint Topic**: SRS Section 11 (Stock Inward / Receiving)
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN`

##### Example Request
```http
POST /api/inventory/inventory-items/1/receive-stock/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "quantity": 500,
  "unit_cost": "640.00",
  "reference": "PO-TEX-4481",
  "notes": "Batch #109 combed cotton blanks received from knitting mill in good condition."
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "product": 1,
  "product_name": "Premium T-Shirt – 220 GSM",
  "brand": 1,
  "sku": "PREM-TSHIRT-220-BLA-L",
  "colour": "Black",
  "size": "L",
  "quantity_on_hand": 1350,
  "reserved_quantity": 500,
  "available_quantity": 850,
  "reorder_level": 100,
  "is_low_stock": false,
  "unit_cost": "640.00"
}
```

---

#### `POST /api/inventory/inventory-items/{id}/report-damaged/`
* **Summary**: Report damaged blanks and deduct them immediately from warehouse on-hand stock. Records damaged record with reason, logs negative stock movement, and writes audit event.
* **SRS Blueprint Topic**: SRS Section 11 & Section 20 (Damaged Stock Auditing)
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN`

##### Example Request
```http
POST /api/inventory/inventory-items/1/report-damaged/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "quantity": 8,
  "reason": "Water moisture stain during transport unloading",
  "order_id": "ORD-2026-000125"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "inventory_item": 1,
  "inventory_sku": "PREM-TSHIRT-220-BLA-L",
  "brand": 1,
  "brand_name": "Premium Brand",
  "quantity": 8,
  "reason": "Water moisture stain during transport unloading",
  "order": 1,
  "logged_by": 4,
  "logged_by_name": "store_keeper",
  "created_at": "2026-09-27T11:15:00Z"
}
```

---

#### `GET /api/inventory/reservations/`
* **Summary**: View stock reservations automatically generated for confirmed orders. Shows held quantities and reservation statuses (`RESERVED`, `ISSUED`, `RELEASED`).
* **SRS Blueprint Topic**: SRS Section 11 (Automatic Stock Reservation)
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN`, `SALES`, `PRODUCTION`

##### Example Request
```http
GET /api/inventory/reservations/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "order": 1,
    "order_id_code": "ORD-2026-000125",
    "inventory_item": 1,
    "inventory_sku": "PREM-TSHIRT-220-BLA-L",
    "quantity": 500,
    "status": "RESERVED",
    "notes": "Auto reserved for ORD-2026-000125",
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `GET /api/inventory/movements/`
* **Summary**: Inspect full stock movements audit log (`INWARD`, `RESERVED`, `ISSUED_PRODUCTION`, `DAMAGED`, `RETURNED`).
* **SRS Blueprint Topic**: SRS Section 11 & Section 17 (Stock Movement History)
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN`

##### Example Request
```http
GET /api/inventory/movements/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "inventory_item": 1,
    "inventory_sku": "PREM-TSHIRT-220-BLA-L",
    "movement_type": "INWARD",
    "movement_type_display": "Stock Received (Inward)",
    "quantity": 500,
    "reference": "PO-TEX-4481",
    "logged_by": 4,
    "logged_by_name": "store_keeper",
    "notes": "Batch #109 combed cotton blanks received from knitting mill",
    "timestamp": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `GET /api/inventory/damaged-stock/`
* **Summary**: List damaged blank garments log across all brands and warehouse items.
* **SRS Blueprint Topic**: SRS Section 11 & 20
* **Required User Type / Role**: `STORE_KEEPER`, `ADMIN`

##### Example Request
```http
GET /api/inventory/damaged-stock/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "inventory_item": 1,
    "inventory_sku": "PREM-TSHIRT-220-BLA-L",
    "brand": 1,
    "brand_name": "Premium Brand",
    "quantity": 8,
    "reason": "Water moisture stain during transport unloading",
    "order": 1,
    "logged_by": 4,
    "logged_by_name": "store_keeper",
    "created_at": "2026-09-25T08:20:00Z"
  }
]
```

---


### 8. Quotation System

#### `GET /api/quotations/quotations/`
* **Summary**: List customer quotations across both brands with subtotal, tax, discounts, and total amounts.
* **SRS Blueprint Topic**: SRS Section 7 (Quotation System) & Section 16 (Sales/Admin manage; Accounts view)
* **Required User Type / Role**: `SALES`, `ADMIN` (Full CRUD); `ACCOUNTS` (Read-only)
* **Query Parameters**:
  - `brand`: Filter by Brand ID (`1` = Premium Brand, `2` = Standard Brand)
  - `customer`: Filter by Customer ID
  - `status`: Filter by quotation status (`DRAFT`, `SENT`, `APPROVED`, `REJECTED`, `EXPIRED`, `CONVERTED`)

##### Example Request
```http
GET /api/quotations/quotations/?brand=1&status=DRAFT HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "quotation_number": "QT-2026-000001",
    "customer": 1,
    "customer_name": "Kasun Perera",
    "customer_company": "Apex Global Technologies (Pvt) Ltd",
    "brand": 1,
    "brand_name": "Premium Brand",
    "inquiry": null,
    "status": "DRAFT",
    "validity_date": "2026-10-31",
    "payment_terms": "50% Advance Deposit on Confirmation, 50% on Delivery",
    "artwork_charges": "10000.00",
    "delivery_charges": "5000.00",
    "discount_amount": "15000.00",
    "tax_rate_percent": "0.00",
    "tax_amount": "0.00",
    "subtotal": "750000.00",
    "total_amount": "750000.00",
    "notes": "Quotation for 500 units Premium 220 GSM screen printed t-shirts",
    "created_by": 2,
    "created_by_name": "sales_lead",
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `POST /api/quotations/quotations/`
* **Summary**: Create a formal quotation proposal with line items, fabric GSM, print method, artwork charges, delivery fees, and discounts. Subtotal and totals are automatically calculated.
* **SRS Blueprint Topic**: SRS Section 7 (Quotation Creation & Automatic Calculation)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/quotations/quotations/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "brand": 1,
  "customer": 1,
  "validity_date": "2026-10-31",
  "payment_terms": "50% Advance Deposit on Confirmation, 50% on Delivery",
  "artwork_charges": "10000.00",
  "delivery_charges": "5000.00",
  "discount_amount": "15000.00",
  "tax_rate_percent": "0.00",
  "notes": "Quotation for 500 units Premium 220 GSM screen printed t-shirts",
  "items": [
    {
      "product_id": 1,
      "quantity": 500,
      "sizes": ["S", "M", "L", "XL", "2XL"],
      "colours": ["Black", "White", "Navy Blue"],
      "fabric_gsm": "220 GSM",
      "printing_method": "3-Colour Screen Printing",
      "unit_price": "1500.00"
    }
  ]
}
```
> **Note**: Each `QuotationItem` can specify multiple sizes (as a list `sizes` or string `size`) and multiple colours (as `colours`/`colors` or string `colour`). The system keeps it as a single line item without splitting it into separate items.

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "quotation_number": "QT-2026-000002",
  "customer": 1,
  "customer_name": "Kasun Perera",
  "customer_company": "Apex Global Technologies (Pvt) Ltd",
  "brand": 1,
  "brand_name": "Premium Brand",
  "inquiry": null,
  "status": "DRAFT",
  "validity_date": "2026-10-31",
  "payment_terms": "50% Advance Deposit on Confirmation, 50% on Delivery",
  "artwork_charges": "10000.00",
  "delivery_charges": "5000.00",
  "discount_amount": "15000.00",
  "tax_rate_percent": "0.00",
  "tax_amount": "0.00",
  "subtotal": "750000.00",
  "total_amount": "750000.00",
  "notes": "Quotation for 500 units Premium 220 GSM screen printed t-shirts",
  "created_by": 2,
  "created_by_name": "sales_lead",
  "created_at": "2026-09-27T11:30:00Z",
  "updated_at": "2026-09-27T11:30:00Z"
}
```

---

#### `GET /api/quotations/quotations/{id}/`
* **Summary**: Retrieve detailed quotation proposal with nested item breakdown.
* **SRS Blueprint Topic**: SRS Section 7
* **Required User Type / Role**: `SALES`, `ADMIN`, `ACCOUNTS`

##### Example Request
```http
GET /api/quotations/quotations/2/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "quotation_number": "QT-2026-000002",
  "customer": 1,
  "customer_name": "Kasun Perera",
  "customer_company": "Apex Global Technologies (Pvt) Ltd",
  "brand": 1,
  "brand_name": "Premium Brand",
  "status": "DRAFT",
  "validity_date": "2026-10-31",
  "payment_terms": "50% Advance Deposit on Confirmation, 50% on Delivery",
  "subtotal": "750000.00",
  "total_amount": "750000.00",
  "items": [
    {
      "id": 2,
      "product": 1,
      "product_name": "Premium T-Shirt – 220 GSM",
      "quantity": 500,
      "size": "L",
      "colour": "Black",
      "fabric_gsm": "220 GSM",
      "printing_method": "3-Colour Screen Printing",
      "unit_price": "1500.00",
      "total_price": "750000.00"
    }
  ]
}
```

---

#### `POST /api/quotations/quotations/{id}/approve/`
* **Summary**: Client formally accepts the proposal; quotation status transitions to `APPROVED`.
* **SRS Blueprint Topic**: SRS Section 7 (Quotation Acceptance)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/quotations/quotations/2/approve/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "quotation_number": "QT-2026-000002",
  "status": "APPROVED",
  "total_amount": "750000.00",
  "items": [
    {
      "id": 2,
      "product": 1,
      "product_name": "Premium T-Shirt – 220 GSM",
      "quantity": 500,
      "size": "L",
      "colour": "Black",
      "unit_price": "1500.00",
      "total_price": "750000.00"
    }
  ]
}
```

---

#### `POST /api/quotations/quotations/{id}/convert-to-order/`
* **Summary**: Convert approved quotation into a live confirmed Order without re-entering data. Copies line items, marks quotation `CONVERTED`, assigns `ORD-YYYY-XXXXXX`, and **automatically reserves blank garments in warehouse stock**.
* **SRS Blueprint Topic**: SRS Section 7 & Section 8 (Seamless Order Conversion)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/quotations/quotations/2/convert-to-order/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "expected_delivery_date": "2026-11-15",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "deposit_required": "375000.00"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "order_id": "ORD-2026-000126",
  "brand": 1,
  "brand_name": "Premium Brand",
  "customer": 1,
  "customer_name": "Kasun Perera",
  "customer_company": "Apex Global Technologies (Pvt) Ltd",
  "status": "ORDER_CONFIRMED",
  "expected_delivery_date": "2026-11-15",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "subtotal": "750000.00",
  "total_amount": "750000.00",
  "deposit_required": "375000.00",
  "paid_amount": "0.00",
  "balance_amount": "750000.00",
  "items": [
    {
      "id": 2,
      "product": 1,
      "product_name": "Premium T-Shirt – 220 GSM",
      "size": "L",
      "colour": "Black",
      "quantity": 500,
      "fabric_gsm": "220 GSM",
      "printing_method": "3-Colour Screen Printing",
      "unit_price": "1500.00",
      "total_price": "750000.00"
    }
  ],
  "stock_reservations": [
    {
      "id": 2,
      "order": 2,
      "order_id_code": "ORD-2026-000126",
      "inventory_item": 1,
      "inventory_sku": "PREM-TSHIRT-220-BLA-L",
      "quantity": 500,
      "status": "RESERVED"
    }
  ]
}
```

---

### 9. Order Management (Central Hub)

#### `GET /api/orders/orders/`
* **Summary**: List orders across both brands with financial balances and current lifecycle stage.
* **SRS Blueprint Topic**: SRS Section 8 (Order Management) & Section 16
* **Required User Type / Role**: Authenticated staff (All staff can view orders relevant to their role)
* **Query Parameters**:
  - `brand`: Filter by Brand ID (`1` = Premium, `2` = Standard)
  - `status`: Filter by order workflow status (e.g. `PRODUCTION`, `READY_FOR_DELIVERY`)
  - `customer`: Filter by Customer ID
  - `search`: Keyword search matching Order ID, customer contact, company name, or address

##### Example Request
```http
GET /api/orders/orders/?brand=1&status=PRODUCTION HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "order_id": "ORD-2026-000125",
    "brand": 1,
    "brand_name": "Premium Brand",
    "customer": 1,
    "customer_name": "Kasun Perera",
    "customer_company": "Apex Global Technologies (Pvt) Ltd",
    "quotation": 1,
    "status": "PRODUCTION",
    "expected_delivery_date": "2026-09-26",
    "total_amount": "750000.00",
    "paid_amount": "375000.00",
    "balance_amount": "375000.00",
    "created_by": 2,
    "created_by_name": "sales_lead",
    "created_at": "2026-09-25T07:40:00Z",
    "updated_at": "2026-09-25T07:40:00Z"
  }
]
```

---

#### `POST /api/orders/orders/`
* **Summary**: Directly create an order with line items without a prior quotation.
* **SRS Blueprint Topic**: SRS Section 8 (Direct Order Entry)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/orders/orders/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "brand": 1,
  "customer": 1,
  "expected_delivery_date": "2026-11-20",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "deposit_required": "200000.00",
  "items": [
    {
      "product_id": 1,
      "size": "XL",
      "colour": "White",
      "fabric_gsm": "220 GSM",
      "quantity": 250,
      "printing_method": "Full Color DTF Print",
      "unit_price": "1600.00"
    }
  ]
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 3,
  "order_id": "ORD-2026-000127",
  "brand": 1,
  "customer": 1,
  "status": "ORDER_CONFIRMED",
  "total_amount": "400000.00",
  "deposit_required": "200000.00",
  "paid_amount": "0.00",
  "balance_amount": "400000.00"
}
```

---

#### `GET /api/orders/orders/{id}/`
* **Summary**: Central Order Master View (SRS Section 24 Key Design Rule). Returns the complete unified order payload including customer, brand, line items, locked artwork, inventory blank reservations, manufacturing job stages, deliveries, invoices, payment history, recorded expenses, and computed net profit.
* **SRS Blueprint Topic**: SRS Section 8 & Section 24 (Central Order Record Architecture)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/orders/orders/1/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "order_id": "ORD-2026-000125",
  "brand": 1,
  "brand_name": "Premium Brand",
  "customer": 1,
  "customer_name": "Kasun Perera",
  "customer_company": "Apex Global Technologies (Pvt) Ltd",
  "customer_phone": "+94 77 987 6543",
  "quotation": 1,
  "status": "PRODUCTION",
  "expected_delivery_date": "2026-09-26",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "printing_embroidery_requirements": "3-Colour Front Chest Screen Print (White, Cyan, Orange)",
  "subtotal": "750000.00",
  "artwork_charges": "10000.00",
  "delivery_charges": "5000.00",
  "discount_amount": "15000.00",
  "tax_amount": "0.00",
  "total_amount": "750000.00",
  "deposit_required": "375000.00",
  "paid_amount": "375000.00",
  "balance_amount": "375000.00",
  "items": [
    {
      "id": 1,
      "product": 1,
      "product_name": "Premium T-Shirt – 220 GSM",
      "size": "L",
      "colour": "Black",
      "quantity": 500,
      "fabric_gsm": "220 GSM",
      "printing_method": "3-Colour Screen Print",
      "unit_price": "1500.00",
      "total_price": "750000.00"
    }
  ],
  "artworks": [
    {
      "id": 1,
      "title": "Apex Tech Summit 2026 - Master Chest Vector",
      "version": 1,
      "status": "APPROVED",
      "is_locked": true
    }
  ],
  "stock_reservations": [
    {
      "id": 1,
      "inventory_sku": "PREM-TSHIRT-220-BLA-L",
      "quantity": 500,
      "status": "RESERVED"
    }
  ],
  "production_job": {
    "id": 1,
    "status": "IN_PROGRESS",
    "stages": [
      {
        "stage_name": "CUTTING",
        "status": "COMPLETED",
        "completed_quantity": 500
      },
      {
        "stage_name": "PRINTING",
        "status": "IN_PROGRESS",
        "completed_quantity": 350,
        "damaged_quantity": 5
      }
    ]
  },
  "invoices": [
    {
      "invoice_number": "INV-2026-000125",
      "total_amount": "750000.00",
      "paid_amount": "375000.00",
      "balance_amount": "375000.00",
      "status": "PARTIALLY_PAID"
    }
  ],
  "payments": [
    {
      "payment_id": "PAY-2026-000125",
      "amount": "375000.00",
      "payment_type": "DEPOSIT",
      "payment_method": "BANK_TRANSFER"
    }
  ],
  "profit_summary": {
    "revenue": "750000.00",
    "total_expenses": "475000.00",
    "estimated_profit": "275000.00",
    "profit_margin_percent": 36.67,
    "expense_count": 6
  }
}
```

---

#### `POST /api/orders/orders/{id}/update-status/`
* **Summary**: Progress order status along the 16-stage workflow. Enforces strict department role validation rules and writes mandatory audit log event.
* **SRS Blueprint Topic**: SRS Section 5 (Order Status Lifecycle), Section 16 & Section 17
* **Required User Type / Role**: Enforced by target status (e.g. `QUALITY_CHECK` permitted only for `PRODUCTION` and `ADMIN`)

##### Example Request
```http
POST /api/orders/orders/1/update-status/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "status": "QUALITY_CHECK",
  "notes": "Printing stage completed, proceeding to quality inspection."
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "order_id": "ORD-2026-000125",
  "status": "QUALITY_CHECK",
  "total_amount": "750000.00"
}
```

---

#### `GET /api/orders/orders/{id}/timeline/`
* **Summary**: Retrieve chronological audit events specifically associated with this Order ID (Who / What / When / Old Value / New Value).
* **SRS Blueprint Topic**: SRS Section 17 (Audit History by Order ID)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/orders/orders/1/timeline/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
[
  {
    "id": 1,
    "user_name": "sales_lead",
    "action": "CREATE_ORDER",
    "order_id": "ORD-2026-000125",
    "field_name": null,
    "old_value": null,
    "new_value": null,
    "timestamp": "2026-09-25T07:40:00Z"
  },
  {
    "id": 2,
    "user_name": "sales_lead",
    "action": "APPROVE_AND_LOCK_ARTWORK",
    "order_id": "ORD-2026-000125",
    "field_name": "is_locked",
    "old_value": "False",
    "new_value": "True",
    "timestamp": "2026-09-25T07:42:00Z"
  },
  {
    "id": 3,
    "user_name": "prod_mgr",
    "action": "ORDER_STATUS_TRANSITION",
    "order_id": "ORD-2026-000125",
    "field_name": "status",
    "old_value": "PRODUCTION",
    "new_value": "QUALITY_CHECK",
    "timestamp": "2026-09-25T11:45:00Z"
  }
]
```

---

#### `POST /api/orders/orders/{id}/upload-document/`
* **Summary**: Attach files to an order (Quotation, PO, Delivery Note, Payment Receipts, Approved Artwork) per SRS Section 19.
* **SRS Blueprint Topic**: SRS Section 19 (Order Document Management)
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
POST /api/orders/orders/1/upload-document/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryOrderDoc
```
```multipart
------WebKitFormBoundaryOrderDoc
Content-Disposition: form-data; name="document_type"

PURCHASE_ORDER
------WebKitFormBoundaryOrderDoc
Content-Disposition: form-data; name="title"

Official Signed PO from Apex Corp
------WebKitFormBoundaryOrderDoc
Content-Disposition: form-data; name="file"; filename="po_apex_2026.pdf"
Content-Type: application/pdf

<binary_data>
------WebKitFormBoundaryOrderDoc
Content-Disposition: form-data; name="notes"

PO #APX-2026-99 authorized by procurement head
------WebKitFormBoundaryOrderDoc--
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 1,
  "order": 1,
  "document_type": "PURCHASE_ORDER",
  "document_type_display": "Purchase Order",
  "title": "Official Signed PO from Apex Corp",
  "file": "/media/order_documents/po_apex_2026.pdf",
  "notes": "PO #APX-2026-99 authorized by procurement head",
  "uploaded_by": 2,
  "uploaded_by_name": "sales_lead",
  "created_at": "2026-09-27T11:45:00Z"
}
```

---

#### `POST /api/orders/orders/{id}/reserve-stock/`
* **Summary**: Explicitly execute automatic warehouse blanks reservation for order line items.
* **SRS Blueprint Topic**: SRS Section 11 (Automatic Stock Reservation)
* **Required User Type / Role**: `STORE_KEEPER`, `SALES`, `ADMIN`

##### Example Request
```http
POST /api/orders/orders/1/reserve-stock/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "status": "Stock reserved for ORD-2026-000125"
}
```

---

#### `POST /api/orders/orders/{id}/cancel/`
* **Summary**: Cancel order, update status to `CANCELLED`, and automatically release all reserved blank garments back to warehouse available pool.
* **SRS Blueprint Topic**: SRS Section 8 & Section 11 (Cancellation & Stock Release)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/orders/orders/3/cancel/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "status": "Order ORD-2026-000127 cancelled and reserved stock released."
}
```

---

### 10. Artwork & Approval Locking

#### `POST /api/artworks/artworks/`
* **Summary**: Upload graphic design file for an order specifying Pantone colour codes, dimensions, and garment placement.
* **SRS Blueprint Topic**: SRS Section 9 (Artwork Approval System) & Section 16
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/artworks/artworks/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryArt
```
```multipart
------WebKitFormBoundaryArt
Content-Disposition: form-data; name="order"

1
------WebKitFormBoundaryArt
Content-Disposition: form-data; name="title"

Apex Tech Summit 2026 Master Chest Vector
------WebKitFormBoundaryArt
Content-Disposition: form-data; name="file"; filename="apex_master_chest.ai"
Content-Type: application/illustrator

<binary_data>
------WebKitFormBoundaryArt
Content-Disposition: form-data; name="color_codes"

Pantone 299 C, Pantone 021 C, Pure White
------WebKitFormBoundaryArt
Content-Disposition: form-data; name="dimensions"

10.5 x 11 inches Front Center
------WebKitFormBoundaryArt
Content-Disposition: form-data; name="placement"

Center Chest
------WebKitFormBoundaryArt--
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "order": 1,
  "order_code": "ORD-2026-000125",
  "title": "Apex Tech Summit 2026 Master Chest Vector",
  "version": 1,
  "file": "/media/artworks/apex_master_chest.ai",
  "color_codes": "Pantone 299 C, Pantone 021 C, Pure White",
  "dimensions": "10.5 x 11 inches Front Center",
  "placement": "Center Chest",
  "status": "DRAFT",
  "is_locked": false,
  "approved_by": null,
  "approved_at": null,
  "created_at": "2026-09-27T11:50:00Z"
}
```

---

#### `POST /api/artworks/artworks/{id}/approve/`
* **Summary**: Approve artwork. **Permanently locks the artwork (`is_locked = true`)** so factory staff use strictly the approved version. Automatically updates Order status to `ARTWORK_APPROVED`.
* **SRS Blueprint Topic**: SRS Section 9 (Artwork Approval & Locking)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/artworks/artworks/2/approve/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "title": "Apex Tech Summit 2026 Master Chest Vector",
  "version": 1,
  "status": "APPROVED",
  "status_display": "Approved",
  "is_locked": true,
  "approved_by": 2,
  "approved_by_name": "sales_lead",
  "approved_at": "2026-09-27T11:55:00Z"
}
```

---

#### `POST /api/artworks/artworks/{id}/request-revision/`
* **Summary**: Customer requests design revisions; unlocks artwork, increments version number, and records change notes.
* **SRS Blueprint Topic**: SRS Section 9 (Artwork Revisions)
* **Required User Type / Role**: `SALES`, `ADMIN`

##### Example Request
```http
POST /api/artworks/artworks/2/request-revision/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "notes": "Please increase font size of 'COLOMBO 2026' by 20% and use darker cyan."
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "version": 2,
  "status": "REVISION",
  "is_locked": false,
  "rejection_notes": "Please increase font size of 'COLOMBO 2026' by 20% and use darker cyan."
}
```

---

#### `POST /api/artworks/artworks/{id}/unlock/`
* **Summary**: Emergency override by management to unlock an approved artwork for critical corrections.
* **SRS Blueprint Topic**: SRS Section 9 & Section 16 (Admin Override)
* **Required User Type / Role**: `ADMIN`

##### Example Request
```http
POST /api/artworks/artworks/2/unlock/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "status": "Artwork #2 unlocked by Admin"
}
```

---

### 11. Production & Quality Control

#### `POST /api/production/production-jobs/initialize/`
* **Summary**: Initialize production job and create the standard 5 manufacturing stages (`Cutting`, `Printing`, `Sewing`, `Quality Check`, `Packing`) for an order.
* **SRS Blueprint Topic**: SRS Section 10 (Production Stages)
* **Required User Type / Role**: `PRODUCTION`, `ADMIN`

##### Example Request
```http
POST /api/production/production-jobs/initialize/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "order_id": "ORD-2026-000125"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 1,
  "order": 1,
  "order_code": "ORD-2026-000125",
  "brand": 1,
  "brand_name": "Premium Brand",
  "status": "PENDING",
  "stages": [
    {
      "id": 1,
      "stage_name": "CUTTING",
      "stage_name_display": "Cutting",
      "sequence_order": 1,
      "target_quantity": 500,
      "completed_quantity": 0,
      "damaged_quantity": 0,
      "status": "PENDING"
    },
    {
      "id": 2,
      "stage_name": "PRINTING",
      "stage_name_display": "Printing",
      "sequence_order": 2,
      "target_quantity": 500,
      "completed_quantity": 0,
      "damaged_quantity": 0,
      "status": "PENDING"
    },
    {
      "id": 3,
      "stage_name": "SEWING_FINISHING",
      "stage_name_display": "Sewing/Finishing",
      "sequence_order": 3,
      "target_quantity": 500,
      "completed_quantity": 0,
      "damaged_quantity": 0,
      "status": "PENDING"
    },
    {
      "id": 4,
      "stage_name": "QUALITY_CHECK",
      "stage_name_display": "Quality Check",
      "sequence_order": 4,
      "target_quantity": 500,
      "completed_quantity": 0,
      "damaged_quantity": 0,
      "status": "PENDING"
    },
    {
      "id": 5,
      "stage_name": "PACKING",
      "stage_name_display": "Packing",
      "sequence_order": 5,
      "target_quantity": 500,
      "completed_quantity": 0,
      "damaged_quantity": 0,
      "status": "PENDING"
    }
  ]
}
```

---

#### `POST /api/production/production-stages/{id}/start/`
* **Summary**: Start manufacturing work on a stage. If starting the `CUTTING` stage, **reserved blank garments are automatically physically deducted from warehouse inventory**.
* **SRS Blueprint Topic**: SRS Section 10 & Section 11 (Stock Reduction on Production Issuance)
* **Required User Type / Role**: `PRODUCTION`, `ADMIN`

##### Example Request
```http
POST /api/production/production-stages/1/start/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "staff_id": 3,
  "notes": "Starting cutting and fabric issuing on line A"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "stage_name": "CUTTING",
  "status": "IN_PROGRESS",
  "assigned_staff": 3,
  "assigned_staff_name": "prod_mgr",
  "start_time": "2026-09-25T08:45:00Z"
}
```

---

#### `POST /api/production/production-stages/{id}/complete/`
* **Summary**: Record stage completion, completed quantity, damaged quantity, and reasons. If completing `PACKING`, Order status automatically advances to `READY_FOR_DELIVERY`.
* **SRS Blueprint Topic**: SRS Section 10 (Production Completion & Damage Tracking)
* **Required User Type / Role**: `PRODUCTION`, `ADMIN`

##### Example Request
```http
POST /api/production/production-stages/2/complete/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "completed_quantity": 495,
  "damaged_quantity": 5,
  "damaged_reason": "Screen printing bleed defect during initial squeegee calibration",
  "notes": "495 pcs passed to sewing line"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 2,
  "stage_name": "PRINTING",
  "status": "COMPLETED",
  "completed_quantity": 495,
  "damaged_quantity": 5,
  "damaged_reason": "Screen printing bleed defect during initial squeegee calibration",
  "completion_time": "2026-09-25T11:30:00Z"
}
```

---

### 12. Delivery & Dispatch Management

#### `POST /api/delivery/deliveries/`
* **Summary**: Create a delivery record for a completed order.
* **SRS Blueprint Topic**: SRS Section 12 (Delivery Management) & Section 16
* **Required User Type / Role**: `DELIVERY`, `ADMIN`

##### Example Request
```http
POST /api/delivery/deliveries/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "order": 1,
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "status": "READY"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 1,
  "delivery_number": "DEL-2026-000001",
  "order": 1,
  "order_code": "ORD-2026-000125",
  "brand_name": "Premium Brand",
  "customer_name": "Kasun Perera",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "status": "READY",
  "status_display": "Ready"
}
```

---

#### `POST /api/delivery/deliveries/{id}/dispatch/`
* **Summary**: Dispatch package with courier partner and record tracking number. Advances Order status to `DELIVERY`.
* **SRS Blueprint Topic**: SRS Section 12 (Courier Dispatch)
* **Required User Type / Role**: `DELIVERY`, `ADMIN`

##### Example Request
```http
POST /api/delivery/deliveries/1/dispatch/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "courier_name": "Pronto Logistics Express",
  "tracking_number": "PRN-LK-9948201",
  "estimated_delivery_date": "2026-09-26",
  "delivery_notes": "2 master cartons, contact Kasun Perera on delivery"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "delivery_number": "DEL-2026-000001",
  "status": "DISPATCHED",
  "courier_name": "Pronto Logistics Express",
  "tracking_number": "PRN-LK-9948201",
  "dispatched_date": "2026-09-25T12:00:00Z",
  "estimated_delivery_date": "2026-09-26"
}
```

---

#### `POST /api/delivery/deliveries/{id}/mark-delivered/`
* **Summary**: Confirm successful physical delivery and recipient handover. Advances Order status to `INVOICE`.
* **SRS Blueprint Topic**: SRS Section 12 (Proof of Delivery)
* **Required User Type / Role**: `DELIVERY`, `ADMIN`

##### Example Request
```http
POST /api/delivery/deliveries/1/mark-delivered/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "recipient_name": "Kasun Perera (Head of Procurement)",
  "notes": "Cartons inspected and received in good condition"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "id": 1,
  "delivery_number": "DEL-2026-000001",
  "status": "DELIVERED",
  "actual_delivery_date": "2026-09-26T09:45:00Z",
  "recipient_name": "Kasun Perera (Head of Procurement)"
}
```

---

#### `GET /api/delivery/deliveries/{id}/delivery-note/`
* **Summary**: Generate printable official delivery note displaying brand identity, customer destination, order number, package quantities, and item breakdown.
* **SRS Blueprint Topic**: SRS Section 12 (Printable Delivery Note)
* **Required User Type / Role**: `DELIVERY`, `ADMIN`, `SALES`

##### Example Request
```http
GET /api/delivery/deliveries/1/delivery-note/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "document_title": "OFFICIAL DELIVERY NOTE",
  "delivery_number": "DEL-2026-000001",
  "order_id": "ORD-2026-000125",
  "brand": {
    "name": "Premium Brand",
    "company": "Your Company (Pvt) Ltd",
    "positioning": "High Quality / Premium (220 GSM)"
  },
  "customer": {
    "company_name": "Apex Global Technologies (Pvt) Ltd",
    "contact_person": "Kasun Perera",
    "phone": "+94 77 987 6543",
    "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya"
  },
  "dispatch_details": {
    "courier_name": "Pronto Logistics Express",
    "tracking_number": "PRN-LK-9948201",
    "dispatched_date": "2026-09-25T12:00:00Z",
    "status": "DELIVERED"
  },
  "items": [
    {
      "product_name": "Premium T-Shirt – 220 GSM",
      "colour": "Black",
      "size": "L",
      "fabric_gsm": "220 GSM",
      "quantity": 500,
      "printing_method": "3-Colour Screen Print"
    }
  ],
  "total_packages_or_pieces": 500,
  "special_instructions": "",
  "issued_at": "2026-09-26T10:00:00Z"
}
```

---

### 13. Billing, Invoices & Payments

#### `POST /api/billing/invoices/generate-from-order/`
* **Summary**: Automatically generate an invoice from order line items, discounts, delivery fees, and taxes to prevent manual errors.
* **SRS Blueprint Topic**: SRS Section 13 (Invoicing System) & Section 16 (Accounts/Admin)
* **Required User Type / Role**: `ACCOUNTS`, `ADMIN`

##### Example Request
```http
POST /api/billing/invoices/generate-from-order/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "order_id": "ORD-2026-000125",
  "due_days": 14
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 1,
  "invoice_number": "INV-2026-000125",
  "order": 1,
  "order_code": "ORD-2026-000125",
  "customer": 1,
  "customer_name": "Kasun Perera",
  "customer_company": "Apex Global Technologies (Pvt) Ltd",
  "brand": 1,
  "brand_name": "Premium Brand",
  "invoice_date": "2026-09-25",
  "due_date": "2026-10-09",
  "subtotal": "750000.00",
  "discount_amount": "15000.00",
  "tax_amount": "0.00",
  "delivery_fee": "5000.00",
  "total_amount": "750000.00",
  "paid_amount": "375000.00",
  "balance_amount": "375000.00",
  "status": "PARTIALLY_PAID",
  "items": [
    {
      "id": 1,
      "product_name": "Premium T-Shirt – 220 GSM",
      "description": "Black / L (220 GSM) - 3-Colour Screen Print",
      "quantity": 500,
      "unit_price": "1500.00",
      "total_price": "750000.00"
    }
  ],
  "payments": [
    {
      "payment_id": "PAY-2026-000125",
      "amount": "375000.00",
      "payment_type": "DEPOSIT",
      "payment_method": "BANK_TRANSFER"
    }
  ]
}
```

---

#### `POST /api/billing/invoices/{id}/cancel/`
* **Summary**: Soft-cancellation of an invoice. Marks status as `CANCELLED` per SRS Section 13 rather than permanently deleting.
* **SRS Blueprint Topic**: SRS Section 13 (Invoice Cancellation)
* **Required User Type / Role**: `ACCOUNTS`, `ADMIN`

##### Example Request
```http
POST /api/billing/invoices/1/cancel/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "reason": "Customer requested separate split invoices across 2 business units"
}
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "status": "Invoice INV-2026-000125 marked as CANCELLED."
}
```

---

#### `POST /api/billing/payments/`
* **Summary**: Record customer payment. Handles separate deposit vs. balance payments per SRS Section 14. Automatically updates order and invoice `paid_amount` and `balance_amount`.
* **SRS Blueprint Topic**: SRS Section 14 (Payment Tracking)
* **Required User Type / Role**: `ACCOUNTS`, `ADMIN`

##### Example Request
```http
POST /api/billing/payments/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "order": 1,
  "invoice": 1,
  "amount": "375000.00",
  "payment_type": "BALANCE",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "COMM-WIRE-100293",
  "payment_date": "2026-09-26",
  "notes": "Remaining 50% balance settled upon delivery verification"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 2,
  "payment_id": "PAY-2026-000002",
  "order": 1,
  "order_code": "ORD-2026-000125",
  "invoice": 1,
  "customer": 1,
  "customer_name": "Kasun Perera",
  "amount": "375000.00",
  "payment_type": "BALANCE",
  "payment_type_display": "Balance Payment",
  "payment_method": "BANK_TRANSFER",
  "payment_method_display": "Bank Transfer",
  "reference_number": "COMM-WIRE-100293",
  "payment_date": "2026-09-26",
  "notes": "Remaining 50% balance settled upon delivery verification",
  "recorded_by": 5,
  "recorded_by_name": "accountant",
  "created_at": "2026-09-26T11:00:00Z"
}
```

---

### 14. Analytics, Profit Tracking & Automated Alerts

#### `GET /api/analytics/dashboard/`
* **Summary**: Main Executive KPI Dashboard. Aggregates revenue, collection, outstanding balances, order status breakdown, two-brand comparison, and urgent action summaries.
* **SRS Blueprint Topic**: SRS Section 23 (Executive Dashboard) & Section 16
* **Required User Type / Role**: Authenticated staff

##### Example Request
```http
GET /api/analytics/dashboard/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "financial_kpis": {
    "total_revenue": "1500000.00",
    "total_collected": "750000.00",
    "total_outstanding": "750000.00"
  },
  "order_kpis": {
    "total_orders": 3,
    "active_orders": 2,
    "status_breakdown": {
      "ORDER_CONFIRMED": 1,
      "PRODUCTION": 1,
      "READY_FOR_DELIVERY": 1
    }
  },
  "brand_comparison": [
    {
      "brand_id": 1,
      "brand_name": "Premium Brand",
      "positioning": "High Quality / Premium (220 GSM)",
      "revenue": "1100000.00",
      "orders_count": 2
    },
    {
      "brand_id": 2,
      "brand_name": "Standard Brand",
      "positioning": "Low Cost / Standard (160 GSM)",
      "revenue": "400000.00",
      "orders_count": 1
    }
  ],
  "action_alerts_summary": {
    "pending_artwork_approvals": 1,
    "orders_ready_for_delivery": 1,
    "low_stock_items": 1,
    "overdue_invoices": 0,
    "new_inquiries": 1
  }
}
```

---

#### `GET /api/analytics/profit/`
* **Summary**: Profit Tracking Report implementing SRS formula:
  $$\text{Revenue} - \text{T-shirt cost} - \text{Printing cost} - \text{Labour} - \text{Packaging} - \text{Delivery} - \text{Other expenses} = \text{Profit}$$
* **SRS Blueprint Topic**: SRS Section 15 (Profit Tracking) & Section 16 (Accounts/Admin)
* **Required User Type / Role**: `ACCOUNTS`, `ADMIN`
* **Query Parameters**:
  - `view`: Report aggregation dimension (`by_order`, `by_brand`, `by_month`)
  - `order_id`: Filter profit report for a specific Order ID
  - `brand`: Filter profit report by Brand ID

##### Example Request
```http
GET /api/analytics/profit/?view=by_order&order_id=ORD-2026-000125 HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "profit_by_order": [
    {
      "order_id": "ORD-2026-000125",
      "brand": "Premium Brand",
      "customer": "Apex Global Technologies (Pvt) Ltd",
      "revenue": "750000.00",
      "costs": {
        "TSHIRT_COST": "325000.00",
        "PRINTING_COST": "75000.00",
        "LABOUR": "50000.00",
        "PACKAGING": "15000.00",
        "DELIVERY": "5000.00",
        "OTHER": "5000.00"
      },
      "total_cost": "475000.00",
      "net_profit": "275000.00",
      "profit_margin_percent": 36.67
    }
  ]
}
```

---

#### `GET /api/analytics/alerts/`
* **Summary**: Real-time evaluation of all 6 mandatory automatic alert criteria (Delivery approaching, Payment overdue, Stock below minimum, Artwork approval pending, Deposit pending, Order ready for delivery). Filterable by staff role.
* **SRS Blueprint Topic**: SRS Section 18 (Automatic Alerts & Notifications)
* **Required User Type / Role**: Authenticated staff
* **Query Parameters**:
  - `for_my_role`: Boolean (`true` to filter strictly to the authenticated user's department)

##### Example Request
```http
GET /api/analytics/alerts/?for_my_role=true HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "user_role": "SALES",
  "user_type": "SALES",
  "total_alerts": 1,
  "alerts": [
    {
      "type": "ARTWORK_APPROVAL_PENDING",
      "severity": "WARNING",
      "order_id": "ORD-2026-000126",
      "title": "Artwork Approval Pending: ORD-2026-000126",
      "message": "Order confirmed but awaiting customer design sign-off.",
      "target_role": "Sales"
    }
  ]
}
```

---

#### `GET /api/analytics/reports/`
* **Summary**: Executive sales leaderboard and performance reports including sales by brand, top customers by revenue, best-selling products, and cancellation metrics.
* **SRS Blueprint Topic**: SRS Section 20 (Reports & Analytics) & Section 16 (Sales/Accounts/Admin)
* **Required User Type / Role**: `SALES`, `ACCOUNTS`, `ADMIN`

##### Example Request
```http
GET /api/analytics/reports/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
```

##### Example Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```
```json
{
  "sales_by_brand": [
    {
      "brand": "Premium Brand",
      "positioning": "High Quality / Premium (220 GSM)",
      "orders_count": 2,
      "total_sales": "1100000.00"
    },
    {
      "brand": "Standard Brand",
      "positioning": "Low Cost / Standard (160 GSM)",
      "orders_count": 1,
      "total_sales": "400000.00"
    }
  ],
  "top_customers": [
    {
      "customer_id": 1,
      "customer_name": "Apex Global Technologies (Pvt) Ltd",
      "contact_person": "Kasun Perera",
      "type": "Corporate",
      "total_purchases": "750000.00",
      "orders_count": 1
    }
  ],
  "top_products": [
    {
      "product_name": "Premium T-Shirt – 220 GSM",
      "brand": "Premium Brand",
      "units_sold": 500,
      "revenue": "750000.00"
    }
  ],
  "cancelled_orders_count": 0
}
```

---

#### `POST /api/analytics/expenses/`
* **Summary**: Log an expense against an order for profit formula tracking (SRS Section 15).
* **SRS Blueprint Topic**: SRS Section 15 (Expense Logging & Profit Formula)
* **Required User Type / Role**: `ACCOUNTS`, `ADMIN`

##### Example Request
```http
POST /api/analytics/expenses/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "order": 1,
  "expense_type": "PRINTING_COST",
  "amount": "75000.00",
  "description": "Special metallic ink pigments and screen preparation fee",
  "is_actual": true,
  "expense_date": "2026-09-25"
}
```

##### Example Response
```http
HTTP/1.1 201 Created
Content-Type: application/json
```
```json
{
  "id": 7,
  "order": 1,
  "order_code": "ORD-2026-000125",
  "expense_type": "PRINTING_COST",
  "expense_type_display": "Printing / Ink Cost",
  "amount": "75000.00",
  "description": "Special metallic ink pigments and screen preparation fee",
  "is_actual": true,
  "expense_date": "2026-09-25",
  "recorded_by": 5,
  "recorded_by_name": "accountant",
  "created_at": "2026-09-27T12:00:00Z"
}
```

---


## 🏃 Complete End-to-End Workflow Scenario

This scenario walks through an entire production run of **500 Premium 220 GSM screen-printed t-shirts** for client **Apex Global Technologies (Pvt) Ltd** under **Premium Brand**.

---

### Step 1: Customer Submits Website Quote Request
* **Department / Actor**: External Prospective Customer
* **Action**: Submits online request-a-quote form.
```http
POST /api/public/request-a-quote/ HTTP/1.1
Host: api.avenor.com
Content-Type: application/json

{
  "brand": 1,
  "name": "Kasun Perera",
  "company_name": "Apex Global Technologies (Pvt) Ltd",
  "email": "procurement@apextech.com",
  "phone": "+94 77 987 6543",
  "product_name": "Premium T-Shirt 220 GSM",
  "quantity": 500,
  "fabric_gsm": "220 GSM",
  "printing_method": "3-Colour Front Screen Print",
  "requirements": "500 black t-shirts size L for annual tech summit."
}
```
* **Result**: Generates Inquiry `#1` with status `NEW`.

---

### Step 2: Sales Converts Inquiry & Drafts Quotation
* **Department / Actor**: Sales Department (`SALES`)
* **Action**: Converts inquiry into a registered customer profile and prepares formal quotation proposal `QT-2026-000001`.
```http
POST /api/quotations/quotations/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <sales_token>
Content-Type: application/json

{
  "brand": 1,
  "customer": 1,
  "validity_date": "2026-10-31",
  "payment_terms": "50% Advance Deposit on Confirmation, 50% on Delivery",
  "artwork_charges": "10000.00",
  "delivery_charges": "5000.00",
  "discount_amount": "15000.00",
  "notes": "500 units Premium 220 GSM Screen Printed T-Shirts",
  "items": [
    {
      "product_id": 1,
      "quantity": 500,
      "size": "L",
      "colour": "Black",
      "fabric_gsm": "220 GSM",
      "printing_method": "3-Colour Screen Printing",
      "unit_price": "1500.00"
    }
  ]
}
```
* **Result**: Quotation `#1` created with total amount `Rs. 750,000.00`.

---

### Step 3: Customer Approves Proposal & Order is Confirmed
* **Department / Actor**: Sales Department (`SALES`)
* **Action**: Approves quotation and converts it into live Order `ORD-2026-000125`.
```http
POST /api/quotations/quotations/1/convert-to-order/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <sales_token>
Content-Type: application/json

{
  "expected_delivery_date": "2026-09-26",
  "delivery_address": "Apex Tech Park, Nawala Road, Rajagiriya",
  "deposit_required": "375000.00"
}
```
* **Result**:
  - Order `ORD-2026-000125` confirmed (`status="ORDER_CONFIRMED"`).
  - 500 Black L blanks **automatically reserved** in warehouse stock (`status="RESERVED"`).

---

### Step 4: Advance Deposit Settled (50%)
* **Department / Actor**: Accounts Department (`ACCOUNTS`)
* **Action**: Records client's advance wire transfer.
```http
POST /api/billing/payments/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <accounts_token>
Content-Type: application/json

{
  "order": 1,
  "amount": "375000.00",
  "payment_type": "DEPOSIT",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "WIRE-ADV-88910",
  "payment_date": "2026-09-25",
  "notes": "50% advance deposit for ORD-2026-000125"
}
```
* **Result**: Order status automatically advances to `DEPOSIT_RECEIVED`. Paid amount becomes `375,000.00`.

---

### Step 5: Artwork Uploaded, Approved & Locked
* **Department / Actor**: Sales / Graphic Design (`SALES`)
* **Action**: Client reviews and signs off on digital print proof. Artwork is approved and locked.
```http
POST /api/artworks/artworks/1/approve/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <sales_token>
```
* **Result**:
  - Artwork `is_locked = true` (factory floor safe; cannot be modified by staff).
  - Order status automatically updates to `ARTWORK_APPROVED`.

---

### Step 6: Manufacturing Floor Execution
* **Department / Actor**: Production Department (`PRODUCTION`)
* **Action 1**: Initialize production job and 5 manufacturing stages:
```http
POST /api/production/production-jobs/initialize/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <production_token>
Content-Type: application/json

{
  "order_id": "ORD-2026-000125"
}
```
* **Action 2**: Start `Cutting` stage:
```http
POST /api/production/production-stages/1/start/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <production_token>
Content-Type: application/json

{
  "staff_id": 3,
  "notes": "Issued 500 blanks from warehouse to cutting line."
}
```
* **Automatic Consequence**: Reserved warehouse blanks are physically deducted from inventory on-hand count and movement type `ISSUED_PRODUCTION` is logged.
* **Action 3**: Progress through stages and complete `Packing`:
```http
POST /api/production/production-stages/5/complete/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <production_token>
Content-Type: application/json

{
  "completed_quantity": 495,
  "damaged_quantity": 5,
  "damaged_reason": "Screen printing bleed during setup squeegee calibration",
  "notes": "Packed into 2 master cartons. Ready for dispatch."
}
```
* **Automatic Consequence**: Order status automatically updates to `READY_FOR_DELIVERY`.

---

### Step 7: Dispatch & Proof of Delivery
* **Department / Actor**: Delivery Department (`DELIVERY`)
* **Action 1**: Create delivery and print delivery note:
```http
GET /api/delivery/deliveries/1/delivery-note/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <delivery_token>
```
* **Action 2**: Dispatch with logistics courier:
```http
POST /api/delivery/deliveries/1/dispatch/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <delivery_token>
Content-Type: application/json

{
  "courier_name": "Pronto Logistics Express",
  "tracking_number": "PRN-LK-9948201",
  "estimated_delivery_date": "2026-09-26"
}
```
* **Action 3**: Mark delivered upon client signature:
```http
POST /api/delivery/deliveries/1/mark-delivered/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <delivery_token>
Content-Type: application/json

{
  "recipient_name": "Kasun Perera (Head of Procurement)",
  "notes": "Goods inspected and accepted in good order."
}
```
* **Automatic Consequence**: Order status automatically transitions to `INVOICE`.

---

### Step 8: Final Invoicing & Balance Settlement
* **Department / Actor**: Accounts Department (`ACCOUNTS`)
* **Action 1**: Auto-generate invoice from order:
```http
POST /api/billing/invoices/generate-from-order/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <accounts_token>
Content-Type: application/json

{
  "order_id": "ORD-2026-000125",
  "due_days": 14
}
```
* **Action 2**: Record final balance settlement:
```http
POST /api/billing/payments/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <accounts_token>
Content-Type: application/json

{
  "order": 1,
  "invoice": 1,
  "amount": "375000.00",
  "payment_type": "BALANCE",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "WIRE-BAL-99102",
  "payment_date": "2026-09-26"
}
```
* **Result**:
  - Order balance becomes `Rs. 0.00`.
  - Order status advances to `PAYMENT_COMPLETED` and `ORDER_CLOSED`.

---

### Step 9: Net Profit Audit & Activity History
* **Department / Actor**: Management & Accounts (`ADMIN`, `ACCOUNTS`)
* **Action 1**: Check audited profit:
```http
GET /api/analytics/profit/?view=by_order&order_id=ORD-2026-000125 HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <accounts_token>
```
* **Calculation**:
  $$\text{Revenue (Rs. 750,000)} - \text{Expenses (Rs. 475,000)} = \text{Net Profit (Rs. 275,000.00)}$$
  **Net Profit Margin**: $36.67\%$
* **Action 2**: Verify complete chronological audit history:
```http
GET /api/orders/orders/1/timeline/ HTTP/1.1
Host: api.avenor.com
Authorization: Bearer <admin_token>
```
* **Result**: Shows every timestamped status progression and staff action from inquiry to closure.

