# 🛍️ ShopMate - Multi-Vendor E-Commerce Microservices Platform

A modern, high-speed multi-vendor E-Commerce microservices ecosystem built with **FastAPI**, **gRPC (HTTP/2 + Protobuf)**, **PostgreSQL**, **Redis**, and **React 19 (Vite)**. Features end-to-end binary gRPC internal communications, 15-minute quick commerce delivery, email OTP passwordless authentication, merchant catalog management, super admin profit ledger, Razorpay sandbox checkout, and real-time WebSocket order tracking.

---

<div align="center">

[![Features](https://img.shields.io/badge/✨_Explore-All_Features_(FEATURES.md)-orange?style=for-the-badge)](FEATURES.md)
[![gRPC](https://img.shields.io/badge/gRPC-HTTP%2F2_Binary-244c5a?style=for-the-badge&logo=grpc&logoColor=white)](https://grpc.io)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)

**[📖 Complete Feature Specification (FEATURES.md)](FEATURES.md)** • **[🏛️ Architecture](#️-system-architecture--services)** • **[⚡ gRPC Pipeline](#-high-speed-grpc-pipeline)** • **[⚙️ Quick Start](#️-quick-start-guide)** • **[🔑 Seed Logins](#-default-roles--access)**

</div>

---

## 🏛️ System Architecture & Services

```text
                               ┌─────────────────────────────────────────┐
                               │       Client Applications               │
                               │  ├─ Customer Storefront (:5173)         │
                               │  └─ Partner & Admin Hub (:5174)         │
                               └────────────────────┬────────────────────┘
                                                    │ HTTP REST (JSON)
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │    API Gateway (:8000)                  │
                               │  FastAPI + gRPC Transcoder + WebSockets │
                               └──────┬─────────┬─────────┬─────────┬────┘
                                      │         │         │         │
               ┌──────────────────────┘         │         │         └──────────────────────┐
               │ gRPC HTTP/2                    │ gRPC    │ gRPC                           │ gRPC
               ▼ :50052                         ▼ :50051  ▼ :50053                         ▼ :50054
┌──────────────────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│     User Service (:8001)     │ │Product Svc (:8002)│ │ Order Svc (:8003) │ │Payment Svc (:8004)│
│  - Email + 6-digit OTP Auth  │ │ - 56+ Products    │ │ - Multi-Vendor    │ │ - Razorpay Mock   │
│  - Seller Registration & KYC │ │ - Category Trees  │ │ - Cart & Wishlist │ │ - Webhook Capture │
│  - Super Admin Whitelist     │ │ - Redis Caching   │ │ - Live Tracking   │ │ - Settlement Log  │
└──────────────┬───────────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
               │                           ▲                     │                     │
               │                           └─────────────────────┘                     │
               │                             Inter-Service gRPC                        │
               │                            (`DeductStock` :50051)                     │
               ▼                                   ▼                     ▼             ▼
        [PostgreSQL / Redis]             [PostgreSQL / Redis]  [PostgreSQL / Redis]  [PostgreSQL / Redis]
```

### 🔌 Service Registry & Port Mapping

| Service / App | Directory | gRPC Port | REST Port | Technology Stack | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | `/api-gateway` | — | `8000` | FastAPI, gRPC Client, WebSockets | Central entrypoint, HTTP-to-gRPC transcoder, rate limiter |
| **Product Service** | `/product-service` | **`50051`** | `8002` | gRPC, FastAPI, PostgreSQL, Redis | Catalog, multi-vendor products, category trees, stock control |
| **User Service** | `/user-service` | **`50052`** | `8001` | gRPC, FastAPI, PostgreSQL, Redis | Email OTP Auth, Seller onboarding, Admin KYC & RBAC |
| **Order Service** | `/order-service` | **`50053`** | `8003` | gRPC, FastAPI, PostgreSQL, Redis | Cart sync, checkout, order state, tracking, 5% Profit Engine |
| **Payment Service** | `/payment-service` | **`50054`** | `8004` | gRPC, FastAPI, PostgreSQL, Redis | Razorpay sandbox orders, signature verification, webhooks |
| **Customer Storefront** | `/frontend` | — | `5173` | React 19, Vite, Tailwind CSS | 15-min delivery storefront, cart/wishlist, customer account |
| **Partner & Admin Hub** | `/portal-frontend` | — | `5174` | React 19, Vite, Tailwind CSS | Merchant store manager & Admin profit ledger |

---

## ⚡ High-Speed gRPC Pipeline

All internal microservice-to-microservice calls and API Gateway routing are powered by binary **gRPC over HTTP/2**:

1. **Protocol Buffers Schemas** (`protos/`):
   - `protos/product.proto`: Products, categories, filter meta, and stock deduction.
   - `protos/user.proto`: Authentication, OTP verification, user profiles, address book, seller/admin auth.
   - `protos/order.proto`: Cart, wishlist, checkout, tracking, order history, and 5% admin profit ledger.
   - `protos/payment.proto`: Razorpay order creation, signature verification, and webhook handling.

2. **Inter-Service Real-Time Stock Deduction**:
   - When an order is confirmed, `order-service` invokes `ProductGrpcService.DeductStock` directly over binary gRPC (`localhost:50051`), bypassing HTTP overhead.

3. **API Gateway Auto-Transcoding**:
   - The Gateway accepts standard REST JSON requests from React frontends and seamlessly transcodes them to binary Protobuf messages, returning parsed JSON responses with automatic HTTP fallback.

4. **Compiling Protocol Buffers**:
   ```bash
   python -m grpc_tools.protoc -Iprotos --python_out=api-gateway/app/grpc_gen --grpc_python_out=api-gateway/app/grpc_gen protos/*.proto
   ```

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Python**: `3.10` or higher (`3.11` / `3.12` / `3.13` recommended)
- **Node.js**: `18.x` or higher (with `npm`)
- **PostgreSQL**: Running locally on port `5432`
- **Redis**: Running locally on port `6379`

---

## ⚙️ Quick Start Guide

### Step 1: Database & Redis Setup

1. Create the PostgreSQL databases:
```sql
CREATE DATABASE user_service_db;
CREATE DATABASE product_service_db;
CREATE DATABASE order_service_db;
CREATE DATABASE payment_service_db;
```

2. Make sure your local Redis server is running:
```bash
redis-server
```

---

### Step 2: Environment Variables Setup

Each service and frontend contains a pre-configured `.env.example` template:

#### Linux / macOS:
```bash
cp api-gateway/.env.example api-gateway/.env
cp user-service/.env.example user-service/.env
cp product-service/.env.example product-service/.env
cp order-service/.env.example order-service/.env
cp payment-service/.env.example payment-service/.env
cp frontend/.env.example frontend/.env
cp portal-frontend/.env.example portal-frontend/.env
```

#### Windows PowerShell:
```powershell
copy api-gateway\.env.example api-gateway\.env
copy user-service\.env.example user-service\.env
copy product-service\.env.example product-service\.env
copy order-service\.env.example order-service\.env
copy payment-service\.env.example payment-service\.env
copy frontend\.env.example frontend\.env
copy portal-frontend\.env.example portal-frontend\.env
```

---

### Step 3: Start Backend Microservices

Each backend service starts both its FastAPI REST endpoints and its high-speed gRPC server concurrently:

#### 1. Product Service (REST :8002 | gRPC :50051)
```bash
cd product-service
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8002 --reload
```

#### 2. User Service (REST :8001 | gRPC :50052)
```bash
cd user-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

#### 3. Order Service (REST :8003 | gRPC :50053)
```bash
cd order-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8003 --reload
```

#### 4. Payment Service (REST :8004 | gRPC :50054)
```bash
cd payment-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8004 --reload
```

#### 5. API Gateway (REST :8000 | gRPC Router)
```bash
cd api-gateway
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

---

### Step 4: Start Frontend Applications

#### 1. Customer Storefront (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

#### 2. Partner & Super Admin Portal (Port 5174)
```bash
cd portal-frontend
npm install
npm run dev
```
Open **[http://localhost:5174](http://localhost:5174)** in your browser.

---

## 🔑 Default Roles & Access

| Role | Access URL | Credentials / Login Flow |
| :--- | :--- | :--- |
| **Customer** | `http://localhost:5173` | Any email (e.g. `customer@shopmate.com`) $\to$ 6-digit OTP sent to email. |
| **Seller (TechNova)** | `http://localhost:5174/seller/login` | `seller@technova.com` $\to$ 6-digit OTP sent to email. |
| **Seller (FreshBasket)** | `http://localhost:5174/seller/login` | `seller@freshbasket.com` $\to$ 6-digit OTP sent to email. |
| **Seller (UrbanStyle)** | `http://localhost:5174/seller/login` | `seller@urbanstyle.com` $\to$ 6-digit OTP sent to email. |
| **Super Admin (Owner)** | `http://localhost:5174/admin/login` | `admin@shopmate.com` $\to$ 6-digit OTP sent to email. |

---

## ⚡ Key Features

1. **End-to-End Binary gRPC Architecture**:
   - HTTP/2 multiplexing and Protocol Buffers serialization across all 4 microservices.
   - Inter-service `order-service` $\to$ `product-service` atomic stock deduction.
2. **Passwordless Email OTP Authentication**:
   - Secure OTP generated in Redis with a 5-minute TTL.
   - Background email dispatcher via SMTP (with console fallback for local dev).
3. **Multi-Vendor Architecture**:
   - Distinct vendor catalogs, product inventory control, and per-seller order fulfillment.
   - Automatic 5% platform commission ledger & merchant settlement calculation.
4. **15-Minute Hyperlocal Quick Commerce UI**:
   - Animated category navigation, instant search, dynamic filter sheets.
   - Guest cart to authenticated cart auto-merge on login.
5. **Razorpay Sandbox Integration**:
   - Sandbox payment modal with mock UPI / NetBanking / Cards simulations.
   - Idempotent webhook capture and instant order confirmation.
6. **Real-time WebSockets**:
   - Live order tracking events (`/ws/order/{order_id}`).
   - User live notifications (`/ws/user/{user_id}`).

---

## 📜 License
MIT License. Built for scalable microservices e-commerce applications.
