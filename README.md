# NxtMarket

A multi-vendor e-commerce marketplace built with Node.js, Express, MongoDB, PostgreSQL, Socket.IO, and optional Redis caching. Products and users live in MongoDB; orders are stored in PostgreSQL. The API is secured with JWT-based role-based access control and includes real-time order notifications via WebSockets, server-side-rendered HTML catalog pages, and a separate health/metrics HTTP server.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Setup and Installation](#2-setup-and-installation)
3. [API Endpoints](#3-api-endpoints)
4. [Example Requests and Responses](#4-example-requests-and-responses)
5. [Folder Structure and Architecture](#5-folder-structure-and-architecture)
6. [Health Server and Redis Caching](#6-health-server-and-redis-caching)

---

## 1. Project Overview

NxtMarket is a capstone project demonstrating a production-style REST API for a mini multi-vendor marketplace. Key capabilities:

- **Catalog** – Guests and authenticated users browse and search products stored in MongoDB.
- **Orders** – Logged-in users place orders that are persisted in PostgreSQL; each order snapshots the product price and title at purchase time.
- **Vendors** – Create, update, and delete products; upload product images; bulk-import products via CSV; update order status.
- **Authentication** – JWT-based registration and login with three roles: `user`, `vendor`, and `admin`.
- **Real-time** – Socket.IO notifies users about order-status changes and alerts vendors when a product's stock runs low.
- **Server-side rendering** – Plain HTML templates rendered by replacing `{{tokens}}` (no template engine required).
- **Observability** – Request logs written with Winston/Morgan; a separate health/metrics server (Node core `http`) answers liveness and log-size probes.
- **Caching** – Optional Redis layer caches product-list and product-detail responses.

---

## 2. Setup and Installation

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS |
| npm | 9 |
| MongoDB | 6 |
| PostgreSQL | 14 |
| Redis *(optional)* | 7 |

### 2.1 Clone and install dependencies

```bash
git clone https://github.com/Youssef-Abo-El-Ela/NxtMarket.git
cd NxtMarket
npm install
```

### 2.2 Environment variables

Create a `.env` file in the project root (copy the table below):

```dotenv
# Express
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/nxtmarket

# PostgreSQL
SQL_DB=nxtmarket
SQL_USER=postgres
SQL_PASS=yourpassword
SQL_HOST=localhost
SQL_DIALECT=postgres

# JWT
JWT_SECRET=your_strong_secret_here

# Redis (optional – remove or leave blank to disable caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Health server
HEALTH_PORT=4000
```

> **Security note:** Never commit `.env` to version control. The defaults in `src/config/env.js` are for local development only.

### 2.3 Database setup

**PostgreSQL** – create the database before seeding:

```sql
CREATE DATABASE nxtmarket;
```

**MongoDB** – no manual setup is required; Mongoose creates collections automatically on first use.

### 2.4 Seed the databases

Two independent seed scripts are provided under `scripts/`.

```bash
# Seed MongoDB (users + products)
node scripts/import-mongo.js

# Seed PostgreSQL (orders + order items)
node scripts/import-sql.js
```

Both scripts **drop and recreate** existing data, so they are safe to re-run during development.

Seed-data source files:

| File | Target |
|------|--------|
| `data/seed-mongo.json` | MongoDB users and products |
| `data/seed-sql.json` | PostgreSQL orders and order items |
| `data/productsCSV.csv` | Sample CSV for the bulk-import endpoint |

### 2.5 Start the server

```bash
npm run dev          # nodemon watches for changes
```

The main API server starts on `PORT` (default **3000**) and the health server starts automatically on `HEALTH_PORT` (default **4000**).

Open `http://localhost:3000/api/products/catalog` to see the rendered product catalog.

---

## 3. API Endpoints

All endpoints are prefixed with `/api`.

### 3.1 Authentication — `/api/auth`

| Method | Path | Auth required | Description |
|--------|------|:---:|-------------|
| `POST` | `/auth/register` | ✗ | Register a new account (`name`, `email`, `password`, `role`) |
| `POST` | `/auth/login` | ✗ | Login; returns a signed JWT |
| `POST` | `/auth/reset-password-request` | ✓ | Generate a password-reset token (stored in Redis for 15 min) |
| `PATCH` | `/auth/reset-password` | ✓ | Consume the reset token and set a new password |

### 3.2 Products — `/api/products`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/products` | Public | List products; supports `?title=`, `?category=`, `?page=`, `?limit=` (Redis cached, 1 h TTL) |
| `GET` | `/products/catalog` | Public | Render HTML catalog page |
| `GET` | `/products/:id` | Public | Fetch a product by MongoDB ObjectId |
| `GET` | `/products/sku/:sku` | Public | Fetch a product by SKU (Redis cached, 2 h TTL) |
| `GET` | `/products/sku/:sku/page` | Public | Render HTML product detail page |
| `POST` | `/products` | admin, vendor | Create a new product |
| `PUT` | `/products/:id` | admin, vendor | Update a product (invalidates Redis cache) |
| `DELETE` | `/products/:id` | admin, vendor | Delete a product (invalidates Redis cache) |
| `PATCH` | `/products/:id/images` | admin, vendor | Upload up to 5 product images (max 2 MB each) |
| `PATCH` | `/products/:id/review` | user | Add a rating and review to a product |
| `POST` | `/products/importCSV` | admin, vendor | Bulk-upsert products from a CSV file |

### 3.3 Orders — `/api/orders`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/orders` | user | Place a new order; decrements product stock |
| `GET` | `/orders/user` | user | List all orders for the authenticated user |
| `GET` | `/orders/admin` | admin | List all orders in the system |
| `GET` | `/orders/:id` | user, admin | Get details of a specific order (with items) |
| `PATCH` | `/orders/:id/status` | admin, vendor | Advance order status (`PENDING → PAID → SHIPPED → CANCELLED`) |
| `GET` | `/orders/:id/page` | user, admin | Render HTML order-status page |

### 3.4 Logs — `/api/logs`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/logs/today` | admin | Stream the last *N* lines from `logs/requests.log` |

---

## 4. Example Requests and Responses

Replace `<TOKEN>` with the JWT returned by `/auth/login`.

### 4.1 Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "Secret123!",
    "role": "user"
  }'
```

**Response `201`**

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "user"
  }
}
```

---

### 4.2 Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "Secret123!"}'
```

**Response `200`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4.3 List products (with pagination and filter)

```bash
curl "http://localhost:3000/api/products?category=electronics&page=1&limit=5"
```

**Response `200`**

```json
{
  "total": 24,
  "page": 1,
  "limit": 5,
  "products": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c01",
      "sku": "ELEC-001",
      "title": "Wireless Headphones",
      "price": 79.99,
      "stock": 42,
      "categories": ["electronics"],
      "images": ["/images/headphones.jpg"]
    }
  ]
}
```

---

### 4.4 Get product by SKU

```bash
curl http://localhost:3000/api/products/sku/ELEC-001
```

**Response `200`**

```json
{
  "_id": "665f1a2b3c4d5e6f7a8b9c01",
  "sku": "ELEC-001",
  "title": "Wireless Headphones",
  "description": "Over-ear noise-cancelling headphones.",
  "price": 79.99,
  "stock": 42,
  "categories": ["electronics"],
  "images": ["/images/headphones.jpg"],
  "embeddedReviews": []
}
```

---

### 4.5 Create a product (vendor/admin)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "BOOK-042",
    "title": "Clean Code",
    "description": "A handbook of agile software craftsmanship.",
    "price": 34.99,
    "stock": 100,
    "categories": ["books"]
  }'
```

**Response `201`**

```json
{
  "message": "Product created",
  "product": {
    "_id": "665f1a2b3c4d5e6f7a8b9c99",
    "sku": "BOOK-042",
    "title": "Clean Code",
    "price": 34.99,
    "stock": 100
  }
}
```

---

### 4.6 Upload product images

```bash
curl -X PATCH http://localhost:3000/api/products/665f1a2b3c4d5e6f7a8b9c99/images \
  -H "Authorization: Bearer <TOKEN>" \
  -F "images=@/path/to/cover.jpg"
```

**Response `200`**

```json
{
  "message": "Images uploaded",
  "images": ["/images/cover-1718000000000.jpg"]
}
```

---

### 4.7 Bulk import products via CSV

```bash
curl -X POST http://localhost:3000/api/products/importCSV \
  -H "Authorization: Bearer <TOKEN>" \
  -F "csv=@data/productsCSV.csv"
```

**Response `200`**

```json
{
  "message": "CSV imported",
  "upserted": 12
}
```

---

### 4.8 Place an order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "sku": "ELEC-001", "qty": 2 },
      { "sku": "BOOK-042", "qty": 1 }
    ]
  }'
```

**Response `201`**

```json
{
  "order": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userID": "665f1a2b3c4d5e6f7a8b9c0d",
    "status": "PENDING",
    "total": 194.97,
    "items": [
      { "productSKU": "ELEC-001", "qty": 2, "price": 79.99, "title": "Wireless Headphones" },
      { "productSKU": "BOOK-042", "qty": 1, "price": 34.99, "title": "Clean Code" }
    ]
  }
}
```

---

### 4.9 Update order status (vendor/admin)

```bash
curl -X PATCH http://localhost:3000/api/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID"}'
```

**Response `200`**

```json
{
  "message": "Order status updated",
  "order": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "PAID"
  }
}
```

---

### 4.10 Add a product review

```bash
curl -X PATCH http://localhost:3000/api/products/665f1a2b3c4d5e6f7a8b9c01/review \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Excellent sound quality!"}'
```

**Response `200`**

```json
{
  "message": "Review added",
  "review": {
    "userID": "665f1a2b3c4d5e6f7a8b9c0d",
    "rating": 5,
    "comment": "Excellent sound quality!",
    "date": "2024-06-10T12:00:00.000Z"
  }
}
```

---

### 4.11 Request password reset

```bash
curl -X POST http://localhost:3000/api/auth/reset-password-request \
  -H "Authorization: Bearer <TOKEN>"
```

**Response `200`**

```json
{
  "message": "Reset token generated",
  "resetToken": "eyJhbGci..."
}
```

---

### 4.12 Confirm password reset

```bash
curl -X PATCH http://localhost:3000/api/auth/reset-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"resetToken": "eyJhbGci...", "newPassword": "NewSecret456!"}'
```

**Response `200`**

```json
{ "message": "Password reset successfully" }
```

---

## 5. Folder Structure and Architecture

```
NxtMarket/
├── src/
│   ├── server.js               # Entry point – binds HTTP, health, and sockets
│   ├── app.js                  # Express app factory with Socket.IO
│   ├── config/
│   │   ├── env.js              # Environment variable loader (dotenv)
│   │   ├── db.mongo.js         # Mongoose connection to MongoDB
│   │   ├── db.sql.js           # Sequelize connection to PostgreSQL
│   │   ├── redis.js            # ioredis client (optional)
│   │   └── logger.js           # Winston + Morgan request logger
│   ├── middleware/
│   │   ├── auth.js             # JWT verification → populates req.user
│   │   ├── roleChecker.js      # Role-based access guard
│   │   ├── errorHandler.js     # Centralised error-response formatter
│   │   └── ioMiddleware.js     # Injects Socket.IO instance into req
│   ├── modules/
│   │   ├── router.js           # Top-level router – mounts sub-routers
│   │   ├── users/
│   │   │   ├── usersRoutes.js
│   │   │   ├── usersController.js
│   │   │   └── usersModel.js   # Mongoose schema (User)
│   │   ├── products/
│   │   │   ├── productsRouter.js
│   │   │   ├── productsController.js
│   │   │   └── productsModel.js  # Mongoose schema (Product + Reviews)
│   │   └── orders/
│   │       ├── ordersRoutes.js
│   │       ├── ordersController.js
│   │       └── ordersModel.js    # Sequelize models (Order + OrderItem)
│   ├── utils/
│   │   ├── enums.js            # Role constants (USER, VENDOR, ADMIN)
│   │   ├── catchAsync.js       # Wraps async route handlers
│   │   ├── multer.js           # Multer config for images and CSV
│   │   └── csvParser.js        # CSV → product upsert pipeline
│   ├── core-http/
│   │   └── health.js           # Standalone Node http health/metrics server
│   └── sockets/
│       └── ordersSocket.js     # Socket.IO handlers (order & stock events)
├── public/
│   ├── templates/              # HTML template files (token-replaced at runtime)
│   │   ├── layout.html
│   │   ├── catalog.html
│   │   ├── product.html
│   │   └── order.html
│   ├── images/                 # User-uploaded product images
│   ├── css/
│   └── default/
├── data/
│   ├── seed-mongo.json         # Seed data: users and products
│   ├── seed-sql.json           # Seed data: orders and order items
│   ├── productsCSV.csv         # Sample bulk-import CSV
│   └── csv/                    # Runtime directory for uploaded CSVs
├── scripts/
│   ├── import-mongo.js         # Seed script – MongoDB
│   └── import-sql.js           # Seed script – PostgreSQL
├── logs/                       # Runtime log files (git-ignored)
├── docs/
│   ├── OVERVIEW.md
│   ├── DESCRIPTION.md
│   └── REQUIREMENTS.md
├── package.json
└── .env                        # Local environment variables (not committed)
```

### Architecture layers

```
┌─────────────────────────────────────────────┐
│  Client (browser / curl / Postman)          │
└────────────────────┬────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────┐
│  Express App  (src/app.js)                  │
│  Middleware: morgan · auth · roleChecker    │
│             errorHandler · ioMiddleware     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Routing layer  (src/modules/router.js)     │
│  /auth · /products · /orders · /logs        │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Controller layer  (*Controller.js)         │
│  Business logic · Redis cache read/write    │
└──────────┬──────────────────────┬───────────┘
           │                      │
┌──────────▼───────┐   ┌──────────▼──────────┐
│  Mongoose Models │   │  Sequelize Models    │
│  (MongoDB)       │   │  (PostgreSQL)        │
│  User, Product   │   │  Order, OrderItem    │
└──────────────────┘   └─────────────────────┘
```

**Layer responsibilities**

| Layer | Files | Responsibility |
|-------|-------|----------------|
| Entry | `src/server.js` | Bootstrap – connects DB, starts Express + health server + sockets |
| App | `src/app.js` | Express instance, global middleware, static files, main router mount |
| Middleware | `src/middleware/` | Auth, RBAC, error formatting, Socket.IO injection |
| Routes | `src/modules/*/routes.js` | URL-to-controller mapping, role guards applied |
| Controllers | `src/modules/*/controller.js` | Request validation, cache lookup, model calls, response |
| Models | `src/modules/*/model.js` | Schema definition and DB queries (Mongoose / Sequelize) |
| Config | `src/config/` | DB connections, Redis client, logger, env loading |
| Utils | `src/utils/` | Shared helpers (async wrapper, multer, CSV parser, enums) |
| Sockets | `src/sockets/` | Real-time event handling (order status, low-stock alerts) |
| Core HTTP | `src/core-http/` | Health and metrics server (separate port, no Express) |

---

## 6. Health Server and Redis Caching

### 6.1 Health server

The health server is a plain Node.js `http` server started automatically inside `src/server.js` via `createHealthServer()`. It listens on `HEALTH_PORT` (default **4000**) independently of the main Express server.

**Endpoints**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe – returns `{ ok, uptime, memory }` |
| `GET` | `/metrics` | Returns the byte size of `logs/requests.log` |

```bash
# Liveness probe
curl http://localhost:4000/health
# {"ok":true,"uptime":123.45,"memory":{"rss":45056000,...}}

# Log-size metric
curl http://localhost:4000/metrics
# {"requestsLogSize":20480}
```

**Deployment notes**

- The health server always starts with the main process; no extra command is needed.
- In containerised environments, point your liveness/readiness probe at `:4000/health`.
- If you run the app behind a firewall, expose port 4000 internally only (not to the public internet).
- To change the port, set `HEALTH_PORT` in your environment before starting the server.

### 6.2 Redis caching (optional)

Redis caching is entirely optional. If no Redis server is reachable, the app falls back to querying the databases directly on every request.

**What is cached**

| Cache key pattern | TTL | Invalidated by |
|-------------------|-----|----------------|
| `product_{sku}` | 2 hours | Product update or delete |
| `products_{title}_{category}_{page}_{limit}` | 1 hour | Product create, update, or delete |
| `password_reset_{userID}` | 15 minutes | Consumed on successful password reset |

**Configuration**

Set these variables in `.env`:

```dotenv
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # leave blank if no auth
```

**Deployment notes**

- Redis is connected lazily; missing or unreachable Redis will not crash the server (errors are caught in the controller layer).
- For production, use a managed Redis service (e.g., Redis Cloud, AWS ElastiCache) and set `REDIS_PASSWORD` to a strong value.
- Cache invalidation uses a Lua script (`EVAL`) to atomically delete all keys matching `products_*` or `product_*`, preventing stale data after writes.
- To disable caching entirely, simply do not set `REDIS_HOST` / `REDIS_PORT`, or remove the Redis client initialisation from `src/config/redis.js`.
