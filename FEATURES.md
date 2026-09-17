# 🚀 ShopMate Platform - Complete Feature Specification

A detailed breakdown of all user-facing features, merchant tools, admin controls, and engineering capabilities available in the **ShopMate Multi-Vendor Microservices Ecosystem**.

---

## 📑 Table of Contents
1. [🛒 Customer Storefront Features](#1--customer-storefront-features)
2. [🏪 Multi-Vendor Merchant Hub](#2--multi-vendor-merchant-hub)
3. [👑 Super Admin & Platform Ledger](#3--super-admin--platform-ledger)
4. [💳 Checkout & Payment Gateway](#4--checkout--payment-gateway)
5. [⚡ Real-Time WebSockets & Live Tracking](#5--real-time-websockets--live-tracking)
6. [🛡️ Microservices & Security Architecture](#6--microservices--security-architecture)

---

## 1. 🛒 Customer Storefront Features (`http://localhost:5173`)

### ⚡ 15-Minute Hyperlocal Quick Commerce
- **Dynamic Hero Banners & Promotional Sliders**: Auto-playing interactive promotional banners with instant category deep-links.
- **Categorized Category Bar**: Handpicked category shortcuts (Mobiles, Laptops, Fashion, Groceries, Beauty, Home Decor, Books) with responsive touch scrolling.
- **Delivery Pincode Selector**: Live delivery availability check based on customer's city and pincode (e.g. *Ahmedabad 380001*).

### 🔍 Search, Filters & Catalog Discovery
- **Live Search Bar**: Search products across titles, descriptions, and categories.
- **Multi-Faceted Filtering**:
  - Filter by **Price Range Slider** (₹0 to ₹1,00,000+)
  - Filter by **Brand Names** (Apple, Samsung, Nike, Sony, boAt, etc.)
  - Filter by **In-Stock Availability** and **Discount Percentages**
  - Sort by *Popularity*, *Price: Low to High*, *Price: High to Low*, and *Customer Ratings*.

### 🛍️ Cart & Wishlist Lifecycle
- **Guest Cart Storage**: Unauthenticated shoppers can browse, add items, and adjust quantities locally in `localStorage`.
- **Guest-to-User Auto-Merge**: When a guest logs in, their entire temporary cart is automatically synced and merged with their cloud database cart.
- **One-Click Wishlist**: Save favorite items with instant visual heart animation and persistent user association.
- **Instant Coupon Discounts**: Apply promotional coupons (e.g. `SHOPMATE10` for an instant 10% discount).

---

## 2. 🏪 Multi-Vendor Merchant Hub (`http://localhost:5174/seller`)

### 📝 Self-Service Seller Onboarding
- Dedicated merchant registration portal (`/seller/register`) collecting:
  - Store Name, Store Description, Business Email & Phone
  - GSTIN Identification, PAN Number, and Bank Account details for automated payouts.

### 📦 Product & Inventory Management
- **Store Catalog**: View all active products listed under the seller's specific store ID.
- **Create & Edit Products**: Add new inventory items with high-resolution image URLs, pricing, category classification, and stock quantities.
- **Stock Depletion Warnings**: Real-time visual alerts when stock levels fall below critical thresholds.

### 🚚 Order Fulfillment Pipeline
- **Dedicated Orders Dashboard** (`/seller/orders`): View customer orders containing items from the merchant's store.
- **Status Lifecycle Control**: Progress orders through fulfillment stages:
  $$\text{Placed} \longrightarrow \text{Confirmed} \longrightarrow \text{Shipped} \longrightarrow \text{Delivered}$$
- **Customer Shipping Details**: Clear recipient address, phone contact, and tracking information.

---

## 3. 👑 Super Admin & Platform Ledger (`http://localhost:5174/admin`)

### 🔐 Owner-Only Whitelisted Security
- Public admin registration is strictly disabled.
- Only authorized platform administrators (`admin@shopmate.com`) can request a secure 6-digit access OTP.

### 📊 5% Platform Profit Engine & Settlements
- **Automated Commission Split**: Calculates 5% platform service revenue on every successful transaction.
- **Merchant Payout Ledger**: Tracks gross sales, net seller earnings (95%), platform profits (5%), and settlement readiness.
- **Platform Analytics**: Gross Merchandise Value (GMV), Total Completed Orders, Active Store Counts, and Platform-wide inventory health.

### 🏢 Merchant KYC Governance
- Review pending seller applications, GSTIN compliance, and merchant store verifications.

---

## 4. 💳 Checkout & Payment Gateway

### 🔄 Multi-Mode Checkout Flow
- **Razorpay Sandbox Gateway Simulation**:
  - Interactive test modal simulating Razorpay UPI (`success@razorpay`), Credit/Debit Cards (`4111 2222 3333 4444`), and NetBanking.
  - Server-side signature hashing & cryptographic verification.
- **Cash on Delivery (COD)**:
  - Zero-friction checkout with instant order ID generation.
- **Multi-Address Book**: Save, edit, and select delivery addresses directly during checkout.

---

## 5. ⚡ Real-Time WebSockets & Live Tracking

- **Live Order Timeline** (`/ws/order/{order_id}`):
  - Bi-directional WebSocket connection streaming order status transitions (Payment Received $\to$ Preparing $\to$ Out for Delivery $\to$ Delivered).
- **User Activity Broadcasts** (`/ws/user/{user_id}`):
  - Push notifications on cart sync, discounts, and dispatch updates.

---

## 6. 🛡️ Microservices & Security Architecture

| Capability | Implementation Detail |
| :--- | :--- |
| **Database-per-Service** | 4 independent PostgreSQL databases (`user_service_db`, `product_service_db`, `order_service_db`, `payment_service_db`) ensuring zero tight-coupling. |
| **Passwordless Auth** | 6-digit cryptographic OTP generated in Redis with strict 300-second TTL and background email workers. |
| **Rate Limiting** | Redis sliding window rate limiter on API Gateway preventing brute-force and DDoS attempts on auth endpoints. |
| **HTTP Keep-Alive Pooling** | Shared asynchronous `httpx.AsyncClient` connection pool in API Gateway for sub-millisecond inter-service latency. |
| **Cross-Origin Security** | Fine-grained CORS regex matching local development ports, production domains, and ngrok tunnel endpoints. |

---

## 🚀 Experience the Platform Live
- **Customer Storefront**: [http://localhost:5173](http://localhost:5173)
- **Partner & Admin Hub**: [http://localhost:5174](http://localhost:5174)
- **API Gateway Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
