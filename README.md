# Deshi Bazar — AI-Powered E-Commerce Marketplace

<div align="center">

**A modern, AI-driven e-commerce marketplace for Bangladesh** — intelligent search, AI-powered price negotiation, personalized recommendations, fraud detection, custom orders, and comprehensive analytics for buyers, sellers, and administrators.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Ordering & Pricing](#ordering--pricing)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Overview

**Deshi Bazar** is a full-stack e-commerce marketplace that blends conventional shopping features with cutting-edge AI. Built on **Next.js 16 (App Router)**, **React 19**, and **PostgreSQL** (via Prisma ORM), it runs AI models server-side and in-browser through **Hugging Face Transformers.js**.

The platform serves three distinct roles — **BUYER**, **SELLER**, and **ADMIN** — each with tailored workflows, from browsing and price bargaining to inventory management and business intelligence.

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.2.3 with Tailwind CSS 4
- **State Management**: React Context API (Auth, Cart, Product)
- **HTTP Client**: Custom API wrapper with interceptors (`src/services/api.js`)
- **Icons**: React Icons
- **Charts**: Recharts
- **Navigation**: Next.js App Router with route groups and dynamic segments

### Backend
- **Runtime**: Next.js API Routes (Server-side)
- **Database**: PostgreSQL via Prisma ORM 6.4.1
- **Authentication**: JWT (jose) with bcrypt password hashing
- **AI Engine**: HuggingFace Transformers.js
- **File Upload**: Custom image upload endpoint
- **Middleware**: Custom authentication and authorization middleware

### DevOps & Tools
- **Package Manager:** npm
- **Database Migrations:** Prisma Migrate
- **Environment Variables:** `.env` (loaded natively by Next.js)

## Key Features

### AI Capabilities

The platform integrates multiple AI capabilities powered by Hugging Face Transformers.js:

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Semantic Search** | Vector embeddings powered search with understanding of user intent | `generateEmbedding()` in `src/lib/ai.js` |
| **AI Search Suggestions** | Intelligent autocomplete with contextual understanding | `getAISearchSuggestions()` in `src/lib/ai.js` |
| **Sentiment Analysis** | Understanding emotional tone of reviews and feedback | `analyzeSentiment()` in `src/lib/ai.js` |
| **Fake Review Detection** | Identifying potentially fraudulent or spam reviews | `detectFakeReview()` in `src/lib/ai.js` |
| **Price Negotiation Engine** | AI-suggested acceptable prices and acceptance predictions | `suggestNegotiationPrice()` & `predictOfferAcceptance()` in `src/lib/ai.js` |
| **Fraud Detection** | Real-time payment fraud scoring and flagging | `detectFraud()` in `src/lib/ai.js` |
| **Delivery Time Prediction** | Estimating delivery dates based on multiple factors | `predictDeliveryTime()` in `src/lib/ai.js` |
| **Personalized Recommendations** | Collaborative filtering based on user behavior | `generateRecommendations()` in `src/lib/ai.js` |
| **Sales Forecasting** | Predicting future sales trends | `forecastSales()` in `src/lib/ai.js` |
| **Customer Churn Prediction** | Identifying at-risk customers for retention efforts | `predictChurn()` in `src/lib/ai.js` |
| **Category Matching** | Zero-shot classification for automatic product categorization | `matchCategoryZeroShot()` in `src/lib/ai.js` |
| **Offensive Content Masking** | Automatic detection and masking of inappropriate language | `maskBadWords()` in `src/lib/ai.js` |

### Buyer Features

- Browse and search products with **AI semantic search** and voice search.
- Add products to **cart** and **wishlist**.
- Negotiate prices through the **offer / counter-offer** system.
- Place **regular orders** (from cart) and **custom orders** (request items by name/quantity from a seller).
- Write reviews (with AI sentiment and fake-review detection).
- Manage profile, addresses, and payment methods (Cash on Delivery, bKash, Nagad).
- Two-factor authentication and password reset.

### Seller Features

- Create and manage products (regular and grocery) with image upload.
- Set a **shipping cost per unit**, applied per item at checkout.
- Manage incoming orders, respond to offers, and handle custom orders.
- View order analytics and delivery details.

### Admin Features

- **User management** — change roles, verify, ban, or delete users.
- **Product management** — create, update, bulk update, and delete products.
- **Order management** — view, edit, and delete both regular and custom orders.
- **Analytics dashboards** — revenue, sales forecasting, trending products, order-status breakdown, and customer churn predictions.
- AI recommendation and category management.

## Project Structure

```
my-app/
├── prisma/                     # Database schema and migrations
│   └── schema.prisma          # Complete database schema with relations
├── public/                     # Static assets (images, icons, etc.)
├── src/                        # Source code
│   ├── app/                    # Next.js App Router (pages and API routes)
│   │   ├── api/                # Backend API routes
│   │   │   ├── admin/          # Admin-only endpoints
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── cart/           # Shopping cart endpoints
│   │   │   ├── categories/     # Category management
│   │   │   ├── custom-orders/  # Custom order processing
│   │   │   ├── offers/         # Price negotiation system
│   │   │   ├── orders/         # Order management
│   │   │   ├── payments/       # Payment processing
│   │   │   ├── products/       # Product catalog
│   │   │   ├── recommendations/# AI recommendations
│   │   │   ├── reviews/        # Product reviews
│   │   │   ├── search/         # Semantic search
│   │   │   ├── stats/          # Platform statistics
│   │   │   ├── upload-image/   # File upload handling
│   │   │   └── users/          # User management
│   │   ├── (frontend pages)    # All user-facing pages
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Payment processing
│   │   │   ├── custom-order/   # Custom order creation
│   │   │   ├── grocery/        # Grocery-specific products
│   │   │   ├── login/          # Authentication
│   │   │   ├── offers/         # Offer management
│   │   │   ├── orders/         # Order history
│   │   │   ├── payments/       # Payment history
│   │   │   ├── profile/        # User profile
│   │   │   ├── products/       # Product browsing
│   │   │   ├── register/       # User registration
│   │   │   ├── seller/         # Seller dashboard
│   │   │   ├── search/         # Search interface
│   │   │   └── wishlist/       # Saved items
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Homepage
│   │   └── middleware.js       # Authentication middleware
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Primitive components (Button, Input, Card)
│   │   ├── layout/             # Structural components (Navbar, Footer)
│   │   ├── product/            # Product-specific components
│   │   └── Providers.js        # Context providers wrapper
│   ├── context/                # React Context providers
│   │   ├── AuthContext.js      # Authentication state
│   │   ├── CartContext.js      # Shopping cart state
│   │   ├── ProductContext.js   # Product catalog state
│   │   └── index.js            # Context exports
│   ├── lib/                    # Core utilities and helpers
│   │   ├── ai.js               # AI/ML functions using HuggingFace
│   │   ├── auth.js             # JWT and password utilities
│   │   └── prisma.js           # Prisma client instance
│   └── services/               # Business logic layer
│       ├── api.js              # HTTP client with request/response interceptors
│       ├── adminService.js     # Admin-specific operations
│       ├── authService.js      # Authentication flows
│       ├── cartService.js      # Cart and wishlist management
│       ├── orderService.js     # Order processing (regular & custom)
│       ├── productService.js   # Product catalog operations
│       ├── recommendationService.js # AI recommendations
│       ├── reviewService.js    # Review management
│       ├── statsService.js     # Platform statistics
│       └── index.js            # Service exports
├── .env                        # Environment variables (not in version control)
├── .gitignore                  # Git ignore rules
├── jsconfig.json               # JavaScript/TypeScript configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── postcss.config.mjs          # PostCSS configuration
└── README.md                   # This file
```

## Database Schema

The platform uses a normalized PostgreSQL schema designed for scalability and data integrity:

### Core Models

1. **User** - Platform users with role-based access control (BUYER, SELLER, ADMIN)
   - Tracks device sessions (max 2 concurrent devices)
   - Location data for distance-based calculations
   - 2FA support for enhanced security

2. **UserProfile** - Extended user information with AI tracking fields
   - Behavioral analytics (avg order value, purchase frequency)
   - Browsing and purchase history for recommendations
   - Interests and preferences for personalization
   - Address fields with Bangladesh-specific divisions/districts

3. **Category** - Hierarchical product categorization
   - Self-referential for unlimited subcategory nesting
   - Active/inactive status for catalog management
   - Image support for visual navigation

4. **Product** - Items available for purchase
   - Dual pricing (original/discounted) for promotions
   - Product type distinction (REGULAR/GROCERY)
   - Grocery-specific attributes (unit, weight, expiry, organic)
   - Negotiable pricing with AI-suggested boundaries
   - AI-generated tags and embeddings for search
   - Stock management and status tracking

5. **Order** - Customer purchases
   - Structured address fields for shipping/billing
   - Distance calculation between buyer and seller
   - Shipping method and cost based on distance
   - AI delivery time predictions and risk scoring
   - Discount and shipping calculations
   - Order number generation for tracking

6. **OrderItem** - Individual products within an order
   - Price snapshot at time of purchase
   - Offer discount tracking
   - Quantity and final price

7. **Payment** - Financial transactions
   - Multiple payment method support (Bkash, COD, etc.)
   - Fraud detection scoring and flagging
   - Transaction ID tracking for reconciliation
   - Refund and dispute handling

8. **Review** - Product feedback
   - Rating system (1-5 stars)
   - Sentiment analysis scoring
   - Fake review detection with confidence scores
   - Helpful/reported voting system
   - Verification status for authenticity

9. **Wishlist** - Saved products for future purchase
   - Unique constraint per user/product combination
   - Simple many-to-many relationship

10. **Cart** - Temporary purchase collection
    - One cart per user with item aggregation
    - Price calculation including discounts
    - Integration with order creation flow

11. **Offer** - Price negotiation system
    - Initial offer, counter-offer, and final price tracking
    - AI-suggested acceptable price and confidence
    - Expiration and status management
    - Negotiation message history

12. **ProductRecommendation** - AI-generated suggestions
    - Recommendation scoring algorithm
    - Reason explanation for transparency
    - Bidirectional relationship tracking

13. **SearchHistory** - User search behavior tracking
    - Query storage with applied filters
    - Results count for analytics
    - AI-generated suggestions storage

14. **SalesAnalytics** - Business intelligence data
    - Daily revenue and order aggregation
    - Category breakdown and top products
    - Trend analysis foundation

15. **TrendingProduct** - Popularity tracking
    - AI-calculated trend scores
    - View and purchase counting
    - Search ranking integration
    - Time-period based analysis (daily/weekly/monthly)

16. **ChurnPrediction** - Customer retention analytics
    - Churn probability scoring
    - Risk level categorization (low/medium/high)
    - Contributing factors storage
    - Prediction timestamp for freshness

17. **CustomOrder** - Bespoke product requests
    - Buyer-to-seller custom order workflow
    - Structured address fields like regular orders
    - Shipping method and distance calculation
    - Multi-stage status workflow
    - Item-level verification and pricing

18. **CustomOrderItem** - Individual items in custom orders
    - Requested vs. verified quantities and prices
    - Unit specification (kg, liters, pieces, etc.)
    - Status tracking through verification process
    - Seller notes for communication

### Enumerations

- **Role**: BUYER, SELLER, ADMIN
- **OfferStatus**: PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED, CANCELLED
- **OrderStatus**: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED
- **PaymentStatus**: PENDING, COMPLETED, FAILED, REFUNDED, FLAGGED
- **ProductType**: REGULAR, GROCERY
- **ProductStatus**: ACTIVE, INACTIVE, OUT_OF_STOCK, DELETED, EXPIRED
- **CustomOrderStatus**: PENDING, VERIFIED, CONFIRMED, PROCESSING, OUT_FOR_DELIVERY, SHIPPED, DELIVERED, CANCELLED
- **CustomItemStatus**: REQUESTED, AVAILABLE, UNAVAILABLE, ADJUSTED

## API Documentation

All API routes follow RESTful conventions and are prefixed with `/api`. Authentication is required for most endpoints via JWT Bearer tokens.

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user (buyer/seller) | No |
| POST | `/api/auth/login` | Login user, returns JWT + user data | No |
| POST | `/api/auth/2fa/send` | Send 2FA verification code | No |
| POST | `/api/auth/2fa/verify` | Verify 2FA code | No |
| POST | `/api/auth/forgot-password` | Request a password-reset link by email | No |
| POST | `/api/auth/reset-password` | Reset password using a token | No |

### Product Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | List products with filters (category, price, type, search, sort, pagination) | No |
| POST | `/api/products` | Create product (generates AI embedding & price suggestions) | Seller/Admin |
| GET | `/api/products/[id]` | Get single product with seller, category, reviews | No |
| PUT | `/api/products/[id]` | Update product | Seller/Admin |
| DELETE | `/api/products/[id]` | Delete product | Seller/Admin |

**Filters**: `categoryId`, `sellerId`, `minPrice`, `maxPrice`, `isNegotiable`, `productType` (REGULAR/GROCERY), `isOrganic`, `freshness`, `search`, `status`, `sortBy`, `sortOrder`, `page`, `limit`

### Category Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | List categories (top-level by default, `parentId`, `name`, `all` filters) | No |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories` | Update category | Admin |
| DELETE | `/api/categories` | Delete category (deactivates if has products) | Admin |

### Cart Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart?type=cart\|wishlist` | Get cart or wishlist with suggested products | Yes |
| POST | `/api/cart` | Add item to cart or wishlist (`type=wishlist` for wishlist) | Yes |
| PUT | `/api/cart` | Update cart item quantity | Yes |
| DELETE | `/api/cart?itemId=X\|clearAll=true` | Remove item or clear cart | Yes |

### Order Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders?type=buyer\|seller\|all&status=X` | Get orders (filters by role and status) | Yes |
| POST | `/api/orders` | Create order from cart (validates stock, calculates shipping by distance, AI delivery prediction) | Buyer only |
| PUT | `/api/orders` | Update order status (`cancel`, `confirm`, `ship`, `deliver`, `return`) | Based on role/action |
| PUT | `/api/orders/[id]` | Update order details (shipping address, notes, etc.) | Seller/Admin |
| DELETE | `/api/orders/[id]` | Delete order | Admin |

**Order Status Flow**: PENDING → CONFIRMED → SHIPPED → DELIVERED → RETURNED / CANCELLED

### Custom Order Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/custom-orders?type=buyer\|seller&status=X` | Get custom orders | Yes |
| POST | `/api/custom-orders` | Create custom order with items (calculates distance-based shipping) | Buyer |
| PUT | `/api/custom-orders/[id]` | Update custom order status (verify, confirm, process, ship, deliver, cancel) | Seller/Admin |
| POST | `/api/custom-orders/[id]/confirm` | Seller confirms items/prices | Seller |
| DELETE | `/api/custom-orders/[id]` | Delete custom order | Buyer/Admin |

**Custom Order Status Flow**: PENDING → VERIFIED → CONFIRMED → PROCESSING → OUT_FOR_DELIVERY → DELIVERED / CANCELLED

### Offer Routes (Price Negotiation)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/offers?type=sent\|received&status=X` | Get offers (sent/received by user) | Yes |
| POST | `/api/offers` | Create offer with AI price suggestion & acceptance prediction | Buyer |
| PUT | `/api/offers` | Respond to offer (`accept`, `reject`, `counter`, `accept_counter`) | Buyer/Seller |
| DELETE | `/api/offers/[id]` | Delete offer | Buyer/Admin |

### Payment Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payments` | Get payments (all for admin, own products for seller, own for buyer) | Yes |
| POST | `/api/payments` | Process payment (Bkash/COD, fraud detection, updates order status) | Buyer |
| PUT | `/api/payments` | Update payment (`refund`, `approve`) | Seller/Admin |
| DELETE | `/api/payments/[id]` | Delete payment | Seller/Admin |

**Payment Methods**: `bkash` (requires transactionId & mobileNumber), `cod`

### Review Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reviews?productId=X` | Get reviews with stats (avg rating, distribution) | No |
| POST | `/api/reviews` | Create review with AI sentiment analysis & fake detection | Buyer |
| PUT | `/api/reviews` | Update review | Buyer |
| DELETE | `/api/reviews?reviewId=X` | Delete review | Buyer/Admin |

### Search Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/search?q=X&categoryId=X&minPrice=X&maxPrice=X&ai=true` | Semantic search with embedding-based re-ranking | No |
| GET | `/api/search?suggestions=true&q=X` | AI-powered autocomplete suggestions | No |

### Recommendation Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/recommendations?userId=X&limit=20` | Get personalized recommendations | Yes (optional) |
| POST | `/api/recommendations` | Generate AI recommendations for user | Admin |
| PUT | `/api/recommendations` | Update recommendation score/reason | Admin |
| DELETE | `/api/recommendations` | Delete recommendation | Admin |

### Admin Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/orders` | Get all regular + custom orders | Admin |
| GET | `/api/admin/users` | Get users with churn predictions | Admin |
| PUT | `/api/admin/users` | Update user (role, verify, ban, delete) | Admin |
| DELETE | `/api/admin/users` | Delete user (hard delete) | Admin |
| GET | `/api/admin/products` | Get all products | Admin |
| POST | `/api/admin/products` | Create product | Admin |
| PUT | `/api/admin/products/[id]` | Update product | Admin |
| DELETE | `/api/admin/products/[id]` | Delete product | Admin |
| GET | `/api/admin/analytics` | Full analytics (revenue, sales forecast, trending, top products) | Admin |
| GET | `/api/admin/churn-predictions` | Churn predictions with filtering | Admin |

### Stats & Users Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stats` | Public platform stats (sellers, products, satisfaction) | No |
| GET | `/api/users?role=X` | List users (public sellers, optional auth) | No |
| GET/PUT | `/api/users/profile` | Get/update user profile | Yes |
| POST | `/api/upload-image` | Upload product image | Yes |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Environment variables configured (see below)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd my-app

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the `my-app/` directory:

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Optional: Two Factor Authentication
TWO_FACTOR_TEMP_EXPIRES_IN=5m
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Optional: Seed database with initial data
# npx prisma db seed
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm run start
```

## User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **BUYER** | Browse products, add to cart/wishlist, create orders, make offers, write reviews, track orders, manage profile |
| **SELLER** | Create/manage products, manage orders, respond to offers, handle custom orders, view analytics, manage profile |
| **ADMIN** | Full platform management, user management, category management, analytics dashboard, AI recommendation control, churn prediction oversight, system configuration |

### Permission Matrix

| Action | Buyer | Seller | Admin |
|--------|-------|--------|-------|
| View Products | ✓ | ✓ | ✓ |
| Create Products | ✗ | ✓ | ✓ |
| Edit Own Products | ✗ | ✓ | ✓ |
| Edit Any Products | ✗ | ✗ | ✓ |
| Delete Products | ✗ | ✗ | ✓ |
| View Orders | Own | Own/Seller's | All |
| Create Orders | ✓ | ✗ | ✗ |
| Cancel Orders | Own (Pending/Confirmed) | ✗ | Any |
| Confirm Orders | ✗ | Own Products | Any |
| Ship Orders | ✗ | Own Products | Any |
| Deliver/Return Orders | Own (Delivered) | Own Products | Any |
| View Payments | Own | Own Products | All |
| Process Payments | ✓ (Own) | ✗ | Any |
| Refund Payments | ✗ | Own Products | Any |
| View Reviews | ✓ | ✓ | ✓ |
| Create Reviews | ✓ (Purchased) | ✗ | ✗ |
| Edit Own Reviews | ✓ | ✗ | ✗ |
| Delete Reviews | Own/Admin | Own/Admin | Any |
| Make Offers | ✓ | ✗ | ✗ |
| Respond to Offers | ✗ | Own Products | Any |
| View Wishlist | ✓ | ✓ | ✓ |
| Manage Wishlist | ✓ | ✓ | ✓ |
| View Analytics | Limited | Own Products | Full |
| Manage Categories | ✗ | ✗ | ✓ |
| Manage Users | ✗ | ✗ | ✓ |
| Generate AI Recommendations | ✗ | ✗ | ✓ |
| View Churn Predictions | ✗ | ✗ | ✓ |

## Ordering & Pricing

### Who Can Place Orders

Only **BUYER (customer)** accounts can place orders — both regular orders (from the cart) and custom orders. Sellers and admins **cannot** place orders; this restriction is enforced server-side:

- `POST /api/orders` → returns `403` unless `user.role === "BUYER"`.
- `POST /api/custom-orders` → returns `403` unless `user.role === "BUYER"`.

### Regular Order Status Flow

`PENDING → CONFIRMED → SHIPPED → DELIVERED → RETURNED / CANCELLED`

### Custom Order Status Flow

`PENDING → VERIFIED → CONFIRMED → PROCESSING → OUT_FOR_DELIVERY → DELIVERED / CANCELLED`

### Pricing

- **Subtotal** — sum of item prices (`price × quantity`).
- **Per-item shipping** — each product can define a `shippingCostPerUnit` (default `0` = free), applied as `shippingCostPerUnit × quantity` at checkout.
- **Distance-based shipping** — custom orders calculate shipping from buyer–seller distance (`distance × ratePerKm`) based on the selected shipping method.
- **Discounts** — applied from cart-level discounts.

> **Note:** Tax is not applied. Order totals are `subtotal + shipping − discount` (regular) or `subtotal + shipping` (custom).

## Authentication & Security

- **JWT authentication** — stateless tokens signed with `HS256` (`jose`), passwords hashed with **bcrypt**.
- **Two-factor authentication (2FA)** — optional 6-digit email codes (5-minute expiry).
- **Password reset** — tokenized reset links emailed to the user (1-hour expiry).
- **Role-based access control (RBAC)** — `BUYER`, `SELLER`, `ADMIN` roles enforced in API routes and middleware.
- **Device limiting** — max 2 concurrent devices per user.

## Core E-Commerce Functionality

1. **Product Catalog**
   - Regular and grocery product types
   - Attribute-based filtering (organic, freshness, etc.)
   - Image galleries and detailed descriptions
   - Stock management and availability tracking

2. **Shopping Experience**
   - Intuitive product browsing and filtering
   - Advanced search with multiple criteria
   - Wishlist and saved items
   - Price comparison and sorting options

3. **Cart & Checkout**
   - Persistent cart across sessions
   - Multiple address management
   - Per-item shipping cost calculation
   - Order review before purchase

4. **Payment Processing**
   - Multiple payment methods (Bkash, Cash on Delivery)
   - Secure transaction handling
   - Payment status tracking
   - Refund and dispute resolution

5. **Order Management**
   - Real-time order status updates
   - Shipping tracking and notifications
   - Return and refund processing
   - Order history and invoicing

6. **User Accounts**
   - Profile management and preferences
   - Order history and tracking
   - Saved addresses and payment methods
   - Notification preferences

### Specialized Features

1. **Custom Orders**
   - Buyer-seller bespoke product requests
   - Item verification and pricing workflow
   - Custom order negotiation
   - Specialized shipping and handling

2. **Multi-Vendor Marketplace**
   - Seller dashboard and product management
   - Order fulfillment tools
   - Performance analytics
   - Commission and fee structures

3. **Administrative Controls**
   - Comprehensive user management
   - Content moderation tools
   - Analytics and reporting dashboard
   - System configuration and maintenance

4. **Mobile-First Design**
   - Responsive layout for all devices
   - Touch-optimized interface
   - Progressive web app capabilities
   - Offline support for browsing

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with hot reload |
| `build` | `npm run build` | Build application for production |
| `start` | `npm run start` | Start production server |
| `db:generate` | `npm run db:generate` | Generate Prisma client from schema |
| `db:migrate` | `npm run db:migrate` | Run database migrations |
| `db:push` | `npm run db:push` | Push schema changes to database |

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/deshi_bazar` | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-super-secret-key` | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` | No (defaults to `7d`) |
| `GMAIL_USER` | Gmail address used to send 2FA / password-reset emails | `you@gmail.com` | No (email features) |
| `GMAIL_APP_PASSWORD` | Gmail App Password for SMTP auth | `xxxxxxxxxxxx` | No (email features) |
| `GMAIL_FROM_NAME` | Display name for outgoing emails | `Deshi Bazar` | No (defaults to `Deshi Bazar`) |
| `NEXT_PUBLIC_API_URL` | Base URL of the API (client-side) | `http://localhost:3000` | No (defaults to `http://localhost:3000`) |

## Architecture Overview

### Data Flow

```
Component → Service Layer → API Route → Prisma ORM → PostgreSQL
                                    ↓
                             AI Processing Layer (src/lib/ai.js)
```

### Key Architectural Patterns

1. **Layered Architecture**
   - Presentation Layer (React Components)
   - Application Layer (Services & Context)
   - API Layer (Next.js Routes)
   - Data Access Layer (Prisma ORM)
   - AI Processing Layer (HuggingFace Transformers)

2. **Separation of Concerns**
   - UI components handle presentation only
   - Services contain business logic
   - API routes handle HTTP concerns
   - Prisma handles data persistence
   - AI library handles machine learning

3. **Context-Based State Management**
   - AuthContext for user authentication state
   - CartContext for shopping cart state
   - ProductContext for catalog state (planned expansion)

4. **Middleware-Based Security**
   - Centralized authentication verification
   - Role-based access control
   - Request/response logging and monitoring
   - CORS and security header management

### Performance Optimizations

1. **Client-Side**
   - React Server Components where applicable
   - Selective hydration for interactive elements
   - Image optimization with Next.js Image
   - Code splitting and dynamic imports
   - Client-side caching with SWR/react-query patterns

2. **Server-Side**
   - Database connection pooling
   - Query optimization with Prisma
   - AI model caching and lazy loading
   - HTTP caching headers
   - Compression and minification

3. **Database**
   - Proper indexing on query fields
   - Connection pooling configuration
   - Read replica support (configurable)
   - Migration-based schema evolution

### Security Features

1. **Authentication & Authorization**
   - JWT-based stateless authentication
   - HTTP-only cookie protection (where applicable)
   - Role-based access control (RBAC)
   - Session device limiting (max 2 devices)
   - Two-factor authentication support

2. **Data Protection**
   - Parameterized queries to prevent SQL injection
   - Input validation and sanitization
   - Password hashing with bcrypt
   - Environment variable separation
   - CORS policy enforcement

3. **API Security**
   - Rate limiting (planned enhancement)
   - Input validation on all endpoints
   - Output encoding where applicable
   - Secure headers implementation
   - API versioning strategy (planned)

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the development server to verify your changes (`npm run dev`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- Follow existing code style and patterns
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Include tests for new functionality
- Update documentation as needed
- Keep dependencies up to date

### Reporting Issues

Please use the GitHub issue tracker to report bugs or request features. Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment information (Node.js version, browser, etc.)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Hugging Face for Transformers.js library
- Next.js team for the React framework
- Prisma team for the ORM solution
- Tailwind CSS for the utility-first CSS framework
- All open-source contributors whose work made this project possible

---

*Last updated: September 2026*
*Version: 1.0.0*