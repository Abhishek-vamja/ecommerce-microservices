# 🛍️ ShopMate - Multi-Vendor E-Commerce Microservices Platform

A modern, scalable multi-vendor E-Commerce microservices ecosystem built with **FastAPI**, **PostgreSQL**, **Redis**, and **React 19 (Vite)**. Features 15-minute quick commerce delivery, email OTP passwordless authentication, merchant catalog management, super admin profit ledger, Razorpay sandbox checkout, and real-time WebSocket order tracking.

---

## 🏛️ System Architecture & Services

```text
                               ┌─────────────────────────────────────────┐
                               │       Client Applications               │
                               │  ├─ Customer Storefront (:5173)         │
                               │  └─ Partner & Admin Hub (:5174)         │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │    API Gateway (:8000)                  │
                               │    FastAPI + HTTPX Pool + WebSockets    │
                               └──────┬─────────┬─────────┬─────────┬────┘
                                      │         │         │         │
               ┌──────────────────────┘         │         │         └──────────────────────┐
               ▼                                ▼         ▼                                ▼
┌──────────────────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│     User Service (:8001)     │ │Product Svc (:8002)│ │ Order Svc (:8003) │ │Payment Svc (:8004)│
│  - Email + 6-digit OTP Auth  │ │ - 56+ Products    │ │ - Multi-Vendor    │ │ - Razorpay Mock   │
│  - Seller Registration & KYC │ │ - Category Trees  │ │ - Cart & Wishlist │ │ - Webhook Capture │
│  - Super Admin Whitelist     │ │ - Redis Caching   │ │ - Live Tracking   │ │ - Settlement Log  │
└──────────────┬───────────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
               │                           │                     │                     │
               ▼                           ▼                     ▼                     ▼
        [PostgreSQL / Redis]         [PostgreSQL / Redis]  [PostgreSQL / Redis]  [PostgreSQL / Redis]
```

### 🔌 Service Registry & Default Ports

| Service / App | Directory | Default Port | Technology Stack | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | `/api-gateway` | `8000` | FastAPI, HTTPX, WebSockets | Central entrypoint, rate limiting, WS fan-out |
| **User Service** | `/user-service` | `8001` | FastAPI, PostgreSQL, Redis | Email OTP Auth, Seller onboarding, Admin KYC |
| **Product Service** | `/product-service` | `8002` | FastAPI, PostgreSQL, Redis | Catalog, multi-vendor products, filters |
| **Order Service** | `/order-service` | `8003` | FastAPI, PostgreSQL, Redis | Cart sync, checkout, order state, tracking |
| **Payment Service** | `/payment-service` | `8004` | FastAPI, PostgreSQL, Redis | Razorpay sandbox orders, signature verify |
| **Customer Storefront** | `/frontend` | `5173` | React 19, Vite, Tailwind CSS | 15-min delivery storefront, customer account |
| **Partner & Admin Hub** | `/portal-frontend` | `5174` | React 19, Vite, Tailwind CSS | Merchant store manager & Admin profit ledger |

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Python**: `3.10` or higher (`3.11` / `3.12` / `3.13` recommended)
- **Node.js**: `18.x` or higher (with `npm`)
- **PostgreSQL**: Running locally on port `5432`
- **Redis**: Running locally on port `6379`

---

## ⚙️ Quick Start Guide

### Step 1: Clone Repository & Database Setup

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

Each service and frontend contains a pre-configured `.env.example` template. Copy the template to `.env` in each directory and update your local PostgreSQL password if needed:

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
copy api-gateway\\.env.example api-gateway\\.env
copy user-service\\.env.example user-service\\.env
copy product-service\\.env.example product-service\\.env
copy order-service\\.env.example order-service\\.env
copy payment-service\\.env.example payment-service\\.env
copy frontend\\.env.example frontend\\.env
copy portal-frontend\\.env.example portal-frontend\\.env
```


---

### Step 3: Start Backend Services

Open separate terminals for each service (or use virtual environments):

#### 1. API Gateway (Port 8000)
```bash
cd api-gateway
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. User Service (Port 8001)
```bash
cd user-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

#### 3. Product Service (Port 8002)
```bash
cd product-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8002 --reload
```

#### 4. Order Service (Port 8003)
```bash
cd order-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8003 --reload
```

#### 5. Payment Service (Port 8004)
```bash
cd payment-service
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --port 8004 --reload
```

---

### Step 4: Start Frontend Portals

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

1. **Passwordless Email OTP Authentication**:
   - Secure OTP generated in Redis with a 5-minute TTL.
   - Background email dispatcher via SMTP (or console fallback for local dev).
2. **Multi-Vendor Architecture**:
   - Distinct vendor catalogs, product inventory control, and per-seller order fulfillment.
   - Automatic 5% platform commission ledger & merchant settlement calculation.
3. **15-Minute Hyperlocal Quick Commerce UI**:
   - Animated category navigation, instant search, dynamic filter sheets.
   - Guest cart to authenticated cart auto-merge on login.
4. **Razorpay Sandbox Integration**:
   - Sandbox payment modal with mock UPI / NetBanking / Cards simulations.
   - Idempotent webhook capture and instant order confirmation.
5. **Real-time WebSockets**:
   - Live order tracking events (`/ws/order/{order_id}`).
   - User live notifications (`/ws/user/{user_id}`).

---

## 📜 License
MIT License. Built for scalable microservices e-commerce applications.
