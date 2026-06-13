# AI-Powered E-Commerce Platform

An AI-driven e-commerce platform featuring intelligent price negotiation, personalized recommendations, semantic search, fraud detection, and comprehensive analytics for buyers, sellers, and administrators.

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **UI**: React 19.2.3, Tailwind CSS 4
- **Icons**: React Icons
- **Charts**: Recharts
- **State Management**: React Context API (Auth, Cart, Product)
- **HTTP Client**: Custom API wrapper (`src/services/api.js`)

### Backend
- **Runtime**: Next.js API Routes (Server-side)
- **Database**: PostgreSQL via Prisma ORM 6.4.1
- **Authentication**: JWT (jose) with bcrypt password hashing
- **AI Engine**: HuggingFace Transformers.js

### AI Features
- Semantic search with embeddings
- Sentiment analysis & fake review detection
- Price negotiation suggestions
- Fraud detection
- Delivery time prediction
- Personalized recommendations
- Sales forecasting & customer churn prediction
- AI-powered category matching

## Project Structure

```
my-app/
├── prisma/
│   └── schema.prisma          # Database schema & models
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Backend API routes
│   │   ├── (frontend pages)    # Frontend pages
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Button, Card, Input
│   │   ├── layout/             # Navbar, Footer
│   │   └── product/            # ProductCard
│   ├── context/                # React Context providers
│   │   ├── AuthContext.js
│   │   └── CartContext.js
│   ├── lib/                    # Core utilities
│   │   ├── ai.js               # AI/ML functions
│   │   ├── auth.js             # JWT & password utilities
│   │   └── prisma.js           # Prisma client instance
│   ├── middleware.js           # Auth middleware
│   └── services/               # Service layer (auth, product, cart, order, payment, review, recommendation, stats, admin)
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured (see below)

### Installation

```bash
cd my-app
npm install
```

### Environment Variables

Create a `.env` file in the `my-app/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Database Setup

```bash
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Frontend Documentation

### Pages & Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home page with featured products, categories carousel, AI recommendations | No |
| `/products` | Product listing with filtering, search, sorting | No |
| `/products/[id]` | Product detail page with reviews & offers | Optional |
| `/categories` | Browse all categories | No |
| `/grocery` | Grocery products with filters (organic, freshness) | No |
| `/cart` | Shopping cart with checkout entry | Yes |
| `/checkout` | Checkout with Bkash/COD payment | Yes |
| `/orders` | User's order history | Yes |
| `/orders/[id]` | Order detail & status tracking | Yes |
| `/search` | AI-powered search with semantic matching | No |
| `/reviews` | Product reviews page | No |
| `/wishlist` | Saved wishlist items | Yes |
| `/offers` | Price negotiation / offers management | Yes |
| `/custom-order` | Create custom order for sellers | Yes |
| `/payments` | Payment history & management | Yes |
| `/profile` | User profile & settings | Yes |
| `/register` | User registration (Buyer/Seller) | No |
| `/login` | User login (max 2 devices per account) | No |

### Admin Pages

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard overview |
| `/admin/orders` | Manage all orders (regular & custom) |
| `/admin/users` | User management, verification, banning |
| `/admin/products` | Manage all products |
| `/admin/products/[id]` | Edit specific product |
| `/admin/categories` | Manage categories |
| `/admin/recommendations` | Manage product recommendations |
| `/admin/churn-predictions` | AI churn predictions overview |
| `/admin/analytics/full` | Full analytics dashboard with charts |

### Seller Pages

| Route | Description |
|-------|-------------|
| `/seller/orders` | Seller's product orders |
| `/seller/products` | Seller's product listings |
| `/seller/products/add` | Add new product |
| `/seller/products/[id]/edit` | Edit product |
| `/seller/custom-orders/[id]` | Custom order detail & management |

### Key Components

- **Navbar** (`src/components/layout/Navbar.js`) - Dynamic navigation with role-based links
- **ProductCard** (`src/components/product/ProductCard.js`) - Reusable product display with quick actions
- **Card, Button, Input** (`src/components/common/`) - Foundation UI components

### Context Providers

- **AuthContext** - Manages auth state, login/logout, user data
- **CartContext** - Manages cart state, add/remove items, totals

### Services Layer

| File | Purpose |
|------|---------|
| `api.js` | HTTP client with interceptors |
| `authService.js` | Login, register, profile |
| `productService.js` | Products & categories |
| `cartService.js` | Cart & wishlist |
| `orderService.js` | Orders management |
| `paymentService.js` | Payment processing |
| `reviewService.js` | Reviews |
| `recommendationService.js` | AI recommendations |
| `statsService.js` | Platform statistics |

### Data Flow

```
Component → Service (src/services/) → API Route (src/app/api/) → Prisma → PostgreSQL
                                    ↓
                               AI Engine (src/lib/ai.js)
```

## Backend Documentation

### Authentication

JWT-based authentication. Protected routes require Bearer token in `Authorization` header.

- **Login**: `POST /api/auth/login`
- **Register**: `POST /api/auth/register`
- **Middleware**: `src/middleware.js` validates tokens for protected routes
- **Device Limit**: Max 2 devices per user account
- **Roles**: BUYER, SELLER, ADMIN

### API Routes

#### Auth Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user (buyer/seller) | No |
| POST | `/api/auth/login` | Login, returns JWT + user data | No |

#### Product Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products with filters (category, price, type, search, sort, pagination) | No |
| POST | `/api/products` | Create product (generates AI embedding & price suggestions) | Seller |
| GET | `/api/products/[id]` | Get single product with seller, category, reviews | No |
| PUT | `/api/products/[id]` | Update product | Seller |
| DELETE | `/api/products/[id]` | Delete product | Seller |

**Filters**: `categoryId`, `sellerId`, `minPrice`, `maxPrice`, `isNegotiable`, `productType` (REGULAR/GROCERY), `isOrganic`, `freshness`, `search`, `status`, `sortBy`, `sortOrder`, `page`, `limit`

#### Category Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List categories (top-level by default, `parentId`, `name`, `all` filters) | No |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories` | Update category | Admin |
| DELETE | `/api/categories` | Delete category (deactivates if has products) | Admin |

#### Cart Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart?type=cart\|wishlist` | Get cart or wishlist with suggested products | Yes |
| POST | `/api/cart` | Add item to cart or wishlist (`type=wishlist` for wishlist) | Yes |
| PUT | `/api/cart` | Update cart item quantity | Yes |
| DELETE | `/api/cart?itemId=X\|clearAll=true` | Remove item or clear cart | Yes |

#### Order Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orders?type=buyer\|seller\|all&status=X` | Get orders (filters by role and status) | Yes |
| POST | `/api/orders` | Create order from cart (validates stock, calculates tax/shipping by distance, AI delivery prediction) | Buyer |
| PUT | `/api/orders` | Update order status (`cancel`, `confirm`, `ship`, `deliver`, `return`) | Buyer/Seller/Admin |

**Order Status**: PENDING → CONFIRMED → SHIPPED → DELIVERED → RETURNED / CANCELLED

#### Custom Order Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/custom-orders?type=buyer\|seller&status=X` | Get custom orders | Yes |
| POST | `/api/custom-orders` | Create custom order with items (calculates distance-based shipping) | Buyer |
| PUT | `/api/custom-orders/[id]` | Update custom order status (verify, confirm, process, ship, deliver, cancel) | Seller |
| POST | `/api/custom-orders/[id]/confirm` | Seller confirms items/prices | Seller |

**Custom Order Status**: PENDING → VERIFIED → CONFIRMED → PROCESSING → OUT_FOR_DELIVERY → DELIVERED / CANCELLED

#### Offer Routes (Price Negotiation)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/offers?type=sent\|received&status=X` | Get offers (sent/received by user) | Yes |
| POST | `/api/offers` | Create offer with AI price suggestion & acceptance prediction | Buyer |
| PUT | `/api/offers` | Respond to offer (`accept`, `reject`, `counter`, `accept_counter`) | Buyer/Seller |

#### Payment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/payments` | Get payments (all for admin, own products for seller, own for buyer) | Yes |
| POST | `/api/payments` | Process payment (Bkash/COD, fraud detection, updates order status) | Buyer |
| PUT | `/api/payments` | Update payment (`refund`, `approve`) | Seller/Admin |
| DELETE | `/api/payments` | Delete payment | Seller/Admin |

**Payment Methods**: `bkash` (requires transactionId & mobileNumber), `cod`

#### Review Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reviews?productId=X` | Get reviews with stats (avg rating, distribution) | No |
| POST | `/api/reviews` | Create review with AI sentiment analysis & fake detection | Buyer |
| PUT | `/api/reviews` | Update review | Buyer |
| DELETE | `/api/reviews?reviewId=X` | Delete review | Buyer/Admin |

#### Search Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/search?q=X&categoryId=X&minPrice=X&maxPrice=X&ai=true` | Semantic search with embedding-based re-ranking | No |
| GET | `/api/search?suggestions=true&q=X` | AI-powered autocomplete suggestions | No |

#### Recommendation Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/recommendations?userId=X&limit=20` | Get personalized recommendations | Yes (optional) |
| POST | `/api/recommendations` | Generate AI recommendations for user | Admin |
| PUT | `/api/recommendations` | Update recommendation score/reason | Admin |
| DELETE | `/api/recommendations` | Delete recommendation | Admin |

#### Admin Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
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

#### Stats & Users Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stats` | Public platform stats (sellers, products, satisfaction) | No |
| GET | `/api/users?role=X` | List users (public sellers, optional auth) | No |
| GET/PUT | `/api/users/profile` | Get/update user profile | Yes |
| POST | `/api/upload-image` | Upload product image | Yes |

### Database Schema

**Core Models**:
- `User` - Buyers, sellers, admins with role-based access & device tracking
- `UserProfile` - Extended profile with AI fields (browsing history, purchase history, interests, behavioral analytics)
- `Category` - Hierarchical categories with parent/children relationships
- `Product` - Regular or grocery products with negotiable pricing, AI tags, embeddings, stock management
- `ProductRecommendation` - Personalized recommendations with scores
- `Offer` - Price negotiation with AI suggestions, counter-offers, expiration
- `Cart` / `CartItem` - Shopping cart with offer pricing
- `Wishlist` - Saved products
- `Order` / `OrderItem` - Orders with AI delivery predictions, distance-based shipping
- `Payment` - Payments with fraud detection scores
- `Review` - Reviews with sentiment scores & fake detection
- `SearchHistory` - Search tracking with AI suggestions
- `SalesAnalytics` - Daily revenue & order tracking
- `TrendingProduct` - AI-calculated trend scores
- `ChurnPrediction` - Customer churn risk levels
- `CustomOrder` / `CustomOrderItem` - Custom orders with seller verification workflow

### AI Integration

| Function | File | Usage |
|----------|------|-------|
| `analyzeSentiment` | `src/lib/ai.js` | Review content analysis |
| `detectFakeReview` | `src/lib/ai.js` | Zero-shot fake review detection |
| `generateEmbedding` | `src/lib/ai.js` | Semantic search embeddings |
| `getAISearchSuggestions` | `src/lib/ai.js` | Search autocomplete |
| `suggestNegotiationPrice` | `src/lib/ai.js` | Price negotiation engine |
| `predictOfferAcceptance` | `src/lib/ai.js` | Offer success probability |
| `detectFraud` | `src/lib/ai.js` | Payment fraud detection |
| `predictDeliveryTime` | `src/lib/ai.js` | Delivery estimation |
| `generateRecommendations` | `src/lib/ai.js` | Collaborative filtering |
| `forecastSales` | `src/lib/ai.js` | Sales forecasting |
| `predictChurn` | `src/lib/ai.js` | Customer churn prediction |
| `matchCategoryZeroShot` | `src/lib/ai.js` | AI category assignment |

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server |
| `build` | `npm run build` | Build for production |
| `start` | `npm run start` | Start production server |
| `db:generate` | `npm run db:generate` | Generate Prisma client |
| `db:push` | `npm run db:push` | Push schema to database |
| `db:migrate` | `npm run db:migrate` | Run migrations |

## User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **BUYER** | Browse products, add to cart/wishlist, create orders, make offers, write reviews, track orders |
| **SELLER** | Create/manage products, manage orders, respond to offers, handle custom orders, view analytics |
| **ADMIN** | Full platform management, user management, category management, analytics dashboard, AI recommendation control, churn prediction oversight |

## Key Features

- **AI Smart Bargaining**: Intelligent price negotiation with AI-suggested acceptable prices and acceptance predictions
- **Semantic Search**: Vector embeddings powered search with autocomplete suggestions
- **AI Recommendations**: Personalized product recommendations based on browsing history
- **Fraud Detection**: AI-powered payment fraud detection with risk scoring
- **Fake Review Detection**: Zero-shot classification to identify suspicious reviews
- **Distance-Based Shipping**: Haversine formula calculates shipping cost by buyer-seller distance
- **Churn Prediction**: AI-driven customer retention insights for admins
- **Sales Forecasting**: Moving average trend analysis for business intelligence
- **Category Matching**: Zero-shot classification for automatic product categorization
- **Multi-Device Tracking**: Max 2 concurrent device sessions per user
- **Custom Orders**: Buyer-seller custom product ordering with verification workflow
