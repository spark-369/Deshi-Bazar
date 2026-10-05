# Deshi Bazar — Bangladeshi E-Commerce Marketplace

**Deshi Bazar** (দেশী বাজার, *"Local Market"*) is a comprehensive multi-vendor e-commerce marketplace built for Bangladesh. It offers price negotiation ("bhada-bhadi"), recommendations, search, fraud protection, and full analytics — combined with Bangladesh-specific payments (bKash, cash on delivery), locations (divisions & districts), and grocery/fresh-market features for buyers, sellers, and administrators.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Smart Features](#smart-features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Features](#key-features)
- [Search](#search)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Overview

**Deshi Bazar** is a modern, Bangladesh-native e-commerce marketplace. Built with Next.js 16 (App Router), React 19, and PostgreSQL (Neon serverless), it delivers search, review moderation, price negotiation suggestions, fraud protection, and recommendations. Business logic is implemented as lightweight, deterministic helper functions in `src/lib/ai.js`, which require no external ML runtime and keep the platform serverless-friendly.

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
- **Database**: Neon PostgreSQL (serverless) via Prisma ORM 6.4.1
- **Authentication**: JWT (jose) with bcrypt password hashing
- **Business Logic**: Dependency-free deterministic helpers (`src/lib/ai.js`) — feature-hashed embeddings, lexicon sentiment, heuristic forecasting/negotiation/fraud/churn (no ML runtime, serverless-friendly)
- **Email**: Gmail SMTP via Nodemailer (2FA codes, account security notices)
- **File Upload**: Custom image upload endpoint
- **Middleware**: Custom authentication and authorization middleware

### DevOps & Tools
- **Package Manager**: npm
- **Database Migrations**: Prisma Migrate
- **Type Checking**: TypeScript (via jsconfig.json)
- **Code Formatting**: Prettier (configured in package.json)
- **Environment Variables**: dotenv

## Smart Features

**Deshi Bazar** ships a suite of smart, automated features implemented as **deterministic, dependency-free heuristics** in `src/lib/ai.js`. This design intentionally uses no heavy ML runtime, so the platform runs smoothly on serverless platforms like Vercel + Neon:

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Search** | Relevance-ranked search combining text matching with feature-hashed embeddings | `generateEmbedding()` in `src/lib/ai.js` |
| **Search Suggestions** | Autocomplete with keyword matching | `getAISearchSuggestions()` in `src/lib/ai.js` |
| **Sentiment Analysis** | Lexicon-based emotional tone scoring of reviews and feedback | `analyzeSentiment()` in `src/lib/ai.js` |
| **Fake Review Detection** | Heuristic identification of potentially fraudulent or spam reviews | `detectFakeReview()` in `src/lib/ai.js` |
| **Price Negotiation Engine** | Suggested acceptable prices and acceptance probabilities | `suggestNegotiationPrice()` & `predictOfferAcceptance()` in `src/lib/ai.js` |
| **Fraud Detection** | Real-time payment fraud scoring and flagging | `detectFraud()` in `src/lib/ai.js` |
| **Delivery Time Prediction** | Estimating delivery dates based on distance and shipping method | `predictDeliveryTime()` in `src/lib/ai.js` |
| **Recommendations** | Behavior-based product recommendations | `generateRecommendations()` in `src/lib/ai.js` |
| **Sales Forecasting** | Trend detection from historical sales data | `forecastSales()` in `src/lib/ai.js` |
| **Customer Churn Prediction** | Identifying at-risk customers for retention efforts | `predictChurn()` in `src/lib/ai.js` |
| **Category Matching** | Keyword-overlap matching for automatic product categorization | `matchCategoryZeroShot()` in `src/lib/ai.js` |
| **Offensive Content Masking** | Detection and masking of inappropriate language | `maskBadWords()` in `src/lib/ai.js` |

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
│   │   │   ├── recommendations/# Product recommendations
│   │   │   ├── reviews/        # Product reviews
│   │   │   ├── search/         # Product search
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
│   │   ├── ai.js               # Deterministic business-logic helper functions (no ML runtime)
│   │   ├── auth.js             # JWT and password utilities
│   │   ├── churnService.js     # Churn prediction compute + persistence helper
│   │   ├── email.js            # Transactional email (2FA, security notices)
│   │   └── prisma.js           # Prisma client instance
│   └── services/               # Business logic layer
│       ├── api.js              # HTTP client with request/response interceptors
│       ├── adminService.js     # Admin-specific operations
│       ├── authService.js      # Authentication flows
│       ├── cartService.js      # Cart and wishlist management
│       ├── orderService.js     # Order processing (regular & custom)
│       ├── productService.js   # Product catalog operations
│       ├── recommendationService.js # Product recommendations
│       ├── reviewService.js    # Review management
│       ├── statsService.js     # Platform statistics
│       └── index.js            # Service exports
├── .env                        # Environment variables (database, JWT, Gmail — keep out of VCS)
├── .gitignore                  # Git ignore rules
├── jsconfig.json               # JavaScript/TypeScript configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── postcss.config.mjs          # PostCSS configuration
└── README.md                   # This file
```

## Database Schema

**Deshi Bazar** uses a normalized PostgreSQL schema (hosted on Neon) designed for scalability and data integrity:

### Core Models

1. **User** - Platform users with role-based access control (BUYER, SELLER, ADMIN)
   - Tracks device sessions (max 2 concurrent devices)
   - Location data for distance-based calculations
   - 2FA support for enhanced security

2. **UserProfile** - Extended user information with behavioral tracking fields
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
   - Negotiable pricing with suggested boundaries
   - Auto-generated tags and embeddings for search
   - Stock management and status tracking

5. **Order** - Customer purchases
   - Structured address fields for shipping/billing
   - Distance calculation between buyer and seller
   - Shipping method and cost based on distance
   - Delivery time predictions and risk scoring
   - Tax, discount, and shipping calculations
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
    - Suggested acceptable price and confidence
    - Expiration and status management
    - Negotiation message history

12. **ProductRecommendation** - Behavior-based suggestions
    - Recommendation scoring algorithm
    - Reason explanation for transparency
    - Bidirectional relationship tracking

13. **SearchHistory** - User search behavior tracking
    - Query storage with applied filters
    - Results count for analytics
    - Auto-generated suggestions storage

14. **SalesAnalytics** - Business intelligence data
    - Daily revenue and order aggregation
    - Category breakdown and top products
    - Trend analysis foundation

15. **TrendingProduct** - Popularity tracking
    - Calculated trend scores
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
| POST | `/api/auth/forgot-password` | Request a password reset link by email | No |
| POST | `/api/auth/reset-password` | Reset password using a valid reset token | No |
| POST | `/api/auth/2fa/send` | Send 2FA verification code | No |
| POST | `/api/auth/2fa/verify` | Verify 2FA code | No |

### Product Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | List products with filters (category, price, type, search, sort, pagination) | No |
| POST | `/api/products` | Create product (generates embedding & price suggestions) | Seller/Admin |
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
| POST | `/api/orders` | Create order from cart (validates stock, calculates tax/shipping by distance, delivery prediction) | Buyer |
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
| POST | `/api/offers` | Create offer with price suggestion & acceptance prediction | Buyer |
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
| POST | `/api/reviews` | Create review with sentiment analysis & fake detection | Buyer |
| PUT | `/api/reviews` | Update review | Buyer |
| DELETE | `/api/reviews?reviewId=X` | Delete review | Buyer/Admin |

### Search Routes

The platform exposes a single search endpoint that serves both full-text browsing and
autocomplete. It powers the `/search` page and the Navbar search box.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/search?q=X&categoryId=X&minPrice=X&maxPrice=X` | Relevance-ranked search (text + embedding ranking) | No (optional auth for history) |
| GET | `/api/search?suggestions=true&q=X` | Autocomplete suggestions | No |
| GET | `/api/search/history` | Recent searches for the authenticated user | Yes |
| DELETE | `/api/search/history` | Clear the authenticated user's search history | Yes |

#### Full Search (`GET /api/search`)

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | `string` | — | Search query. Omit to return the full catalog (paginated). |
| `categoryId` | `string` | — | Restrict results to a single category. |
| `minPrice` | `number` | `0` | Minimum price filter. |
| `maxPrice` | `number` | — | Maximum price filter. |
| `isNegotiable` | `"true"`/`"false"` | — | Restrict to negotiable / non-negotiable products. |
| `sortBy` | `string` | `relevance` | One of `relevance`, `price_asc`, `price_desc`, `newest`, `rating`. |
| `page` | `number` | `1` | Page number (1-based). |
| `limit` | `number` | `20` | Results per page. |
| `ai` | `"true"` | — | Legacy flag (kept for backward compatibility; no longer drives any behavior). |

**How ranking works**

When a query is provided, the endpoint fetches candidate products and ranks them by a
combination of two signals:

1. **Text matching (authoritative)** — the query is tokenized and matched against each
   product's `name`, `description`, and `tags`. An exact substring match scores highest;
   partial (token-level) matches score proportionally. Any product that matches any query
   token is guaranteed to be returned.
2. **Embedding similarity (booster)** — the query and each product are converted to
   feature-hashed, L2-normalized vectors via `generateEmbedding()` in `src/lib/ai.js`, and
   their cosine (dot-product) similarity adds a secondary ranking signal for related products.

This hybrid approach ensures that legitimate keyword matches are always surfaced while also
elevating closely-related products that don't share literal keywords.

**Response shape**

```json
{
  "products": [
    {
      "id": "…",
      "name": "…",
      "description": "…",
      "price": 0,
      "category": { "…": "…" },
      "seller": { "id": "…", "name": "…" },
      "averageRating": 4.5,
      "reviewCount": 12,
      "relevanceScore": 1.85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  },
  "suggestions": []
}
```

If the caller includes a valid `Authorization` header, the query is also persisted to the
user's `SearchHistory` so it appears in their recent searches.

#### Autocomplete (`GET /api/search?suggestions=true`)

Returns up to 100 matching product names (case-insensitive substring match on `name`)
wrapped as `{ "suggestions": ["…", "…"] }`. The client debounces requests and displays the
first 8.

### Recommendation Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/recommendations?userId=X&limit=20` | Get personalized recommendations | Yes (optional) |
| POST | `/api/recommendations` | Generate recommendations for user | Admin |
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
# Database Connection (Neon PostgreSQL)
# Pooled connection (has `-pooler` in hostname) used by the app runtime.
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"
# Direct (unpooled) connection used by the Prisma CLI (migrations / db push).
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DBNAME?sslmode=require"

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Optional: Two Factor Authentication
TWO_FACTOR_TEMP_EXPIRES_IN=5m
```

### Database Setup

The database is hosted on **Neon** (serverless PostgreSQL). The `.env` file must contain both the pooled (`DATABASE_URL`) and unpooled (`DATABASE_URL_UNPOOLED`) connection strings — see [Environment Variables](#environment-variables).

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations to the Neon database (uses DATABASE_URL_UNPOOLED)
npx prisma migrate deploy
#    ...or for a fresh dev database:
# npx prisma db push

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
| **ADMIN** | Full platform management, user management, category management, analytics dashboard, recommendation control, churn prediction oversight, system configuration |

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
| Generate Recommendations | ✗ | ✗ | ✓ |
| View Churn Predictions | ✗ | ✗ | ✓ |

## Key Features

### Smart & Automated Intelligence

1. **Search & Discovery**
   - Hybrid ranking that combines authoritative token-based text matching with
     feature-hashed, L2-normalized vector embeddings for related-product relevance
   - Token-level matching against `name`, `description`, and `tags` so partial and
     multi-word queries still return results (not just exact substrings)
   - Autocomplete suggestions
   - Re-ranking by relevance, price, newest, or average rating
   - Full-featured `/search` interface with filters (category, price range), voice
     search, and persisted search history

2. **Smart Price Negotiation**
   - Suggested acceptable price ranges (deterministic heuristics)
   - Offer acceptance probability
   - Dynamic counter-offer suggestions
   - Market-based pricing insights

3. **Personalized Experience**
   - Behavior-based recommendations
   - Product suggestions from browsing/purchase history
   - Browsing history analysis
   - Interest modeling for discovery

4. **Trust & Safety**
   - Real-time fraud scoring and flagging
   - Fake review identification
   - Offensive content filtering
   - Trust signals for users and transactions

5. **Analytics & Forecasting**
   - Sales trend analysis and forecasting
   - Customer churn scoring
   - Inventory insights
   - Delivery time estimation

### Core E-Commerce Functionality

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
   - Tax and shipping calculation
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

## Search

The search feature is accessible at `/search` and from the Navbar search box. It combines
keyword matching with relevance ranking to return relevant products, and it supports
filters, voice input, suggestions, and history.

### User Interface

The `/search` page provides:

- **Search input** — a text field with a live autocomplete dropdown (suggestions are fetched
  for queries of 2+ characters and debounced to avoid excessive requests).
- **Voice search** — a microphone button that uses the browser's native
  [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
  (`SpeechRecognition`) to transcribe speech into a query. This requires a supporting browser
  (Chrome, Edge, or Safari) and a network connection to the speech service. No ML model is
  downloaded; transcription happens on the browser/cloud side.
- **Filters** — category, minimum price, maximum price, and sort order
  (`relevance`, `price_asc`, `price_desc`, `newest`, `rating`).
- **Recent searches** — persisted server-side (in the `SearchHistory` table) for authenticated
  users, or in `localStorage` for anonymous users.

### How Results Are Ranked

Ranking is implemented in `src/app/api/search/route.js` and `src/lib/ai.js`. It uses a hybrid
of two signals so that both literal and related products are surfaced:

1. **Text matching (authoritative)** — the query is lowercased and split into tokens, then
   matched against the concatenated `name`, `description`, and `tags` of each product. An exact
   substring match scores highest; partial token matches score proportionally. Any product
   matching at least one token is always returned.
2. **Embedding similarity (booster)** — `generateEmbedding()` (in `src/lib/ai.js`) converts text
   into a 256-dimensional, feature-hashed, L2-normalized vector (a lightweight, deterministic
   bag-of-words hash — no heavy ML runtime is required, which keeps serverless deployments
   light). The cosine (dot-product) similarity between the query and each product's stored
   embedding is added as a secondary ranking signal.

Products are then filtered and sorted by `relevanceScore`, followed by the requested sort order
when one is provided. See the [Search Routes](#search-routes) section for the full request and
response contract.

### Voice Search Error Handling

The speech recognition layer treats the following Web Speech API `error` codes as
**non-fatal**, resolving with an empty transcript and showing a friendly "No speech detected"
message instead of throwing:

- `no-speech` — recognition finished without detecting speech.
- `aborted` — recognition was cancelled (e.g. user toggled the microphone off).
- `network` — the browser could not reach the speech recognition service (common in Firefox,
  on non-HTTPS origins, or when the service is blocked/unreachable).

All other error codes reject the promise and surface a descriptive message. A browser without
any speech support is detected up front via the `getSpeechRecognition()` null check.

### Related Files

| Path | Responsibility |
|------|----------------|
| `src/app/search/page.js` | Search UI: input, suggestions, filters, voice search, history |
| `src/app/api/search/route.js` | Search endpoint: ranking, filtering, pagination, history |
| `src/app/api/search/history/route.js` | Recent-search history retrieval and clearing |
| `src/services/productService.js` | Client-side service layer (`searchProducts`, `getSearchSuggestions`) |
| `src/components/layout/Navbar.js` | Search box with autocomplete in the header |
| `src/lib/ai.js` | `generateEmbedding()` and `getAISearchSuggestions()` (search helpers) |

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with hot reload |
| `build` | `npm run build` | Build application for production |
| `start` | `npm run start` | Start production server |
| `db:generate` | `npx prisma generate` | Generate Prisma client from schema |
| `db:migrate` | `npx prisma migrate dev` | Run database migrations |
| `db:push` | `npx prisma db push` | Push schema changes to database |
| `db:seed` | `npx prisma db seed` | Seed database with initial data |
| `lint` | `npm run lint` | Run ESLint for code quality |
| `format` | `npm run format` | Format code with Prettier |

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Neon pooled PostgreSQL connection (has `-pooler` in host) | `postgresql://user:pass@host-pooler.region.aws.neon.tech/db?sslmode=require` | Yes |
| `DATABASE_URL_UNPOOLED` | Neon direct (unpooled) connection for Prisma CLI migrations | `postgresql://user:pass@host.region.aws.neon.tech/db?sslmode=require` | Yes (for `prisma migrate`/`db push`) |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-super-secret-key` | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` | No (defaults to 7d) |
| `NEXT_PUBLIC_API_URL` | Base URL for the API client | `http://localhost:3000` | Yes |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Gmail SMTP credentials for 2FA emails | `user@gmail.com` / `app-password` | Optional (email features) |
| `GMAIL_FROM_NAME` | Sender name for transactional emails | `Deshi Bazar` | No (defaults to `Deshi Bazar`) |
| `TWO_FACTOR_TEMP_EXPIRES_IN` | 2FA token expiration | `5m` | No (defaults to 5m) |

## Architecture Overview

### Data Flow

```
Component → Service Layer → API Route → Prisma ORM → PostgreSQL
                                    ↓
                             Business Logic Layer (src/lib/ai.js)
```

### Key Architectural Patterns

1. **Layered Architecture**
   - Presentation Layer (React Components)
   - Application Layer (Services & Context)
   - API Layer (Next.js Routes)
   - Data Access Layer (Prisma ORM)
   - Business Logic Layer (deterministic heuristics in `src/lib/ai.js`)

2. **Separation of Concerns**
   - UI components handle presentation only
   - Services contain business logic
   - API routes handle HTTP concerns
   - Prisma handles data persistence
   - Business-logic library (`src/lib/ai.js`) handles predictive heuristics

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
   - Database connection pooling (Neon serverless driver)
   - Query optimization with Prisma
   - In-memory heuristic reuse (cheap, deterministic — no model to cache)
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
4. Ensure code passes linting (`npm run lint`)
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

- [Next.js](https://nextjs.org/) team for the React framework
- [Prisma](https://www.prisma.io/) team for the ORM solution
- [Neon](https://neon.com/) for the serverless PostgreSQL database
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Recharts](https://recharts.org/) for the charting library
- [React Icons](https://react-icons.github.io/react-icons/) for the icon set
- All open-source contributors whose work made this project possible

---

*Last updated: September 2026*
*Version: 1.0.0*