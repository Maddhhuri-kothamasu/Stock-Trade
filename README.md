# 📈 Stock Trades REST API

A production-ready REST API for managing stock trades with JWT-based authentication. Built with modern Node.js ecosystem technologies, demonstrating enterprise-grade architecture, security, and performance optimization.

## 🚀 Features & Technology Stack

### **🔐 Authentication & Security**
- **JWT (JSON Web Tokens) v9.0.2** - Stateless authentication with dual-token system
  - **Access Tokens**: 10-minute expiry for API access (configurable via `JWT_ACCESS_EXPIRY`)
  - **Refresh Tokens**: 7-day expiry for token renewal (configurable via `JWT_REFRESH_EXPIRY`)
  - **HS256 Algorithm**: HMAC with SHA-256 for token signing
  - **Purpose**: Eliminates server-side session storage, enables horizontal scaling
- **bcryptjs v2.4.3** - Password hashing with 12 salt rounds for secure storage
  - **Salt Rounds**: 12 rounds (computationally expensive ~150ms)
  - **Purpose**: Prevents rainbow table attacks, timing attacks
- **Helmet.js v7.1.0** - Security middleware setting HTTP headers:
  - Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options
  - **Purpose**: Prevents XSS, clickjacking, MIME-type sniffing attacks
- **CORS v2.8.5** - Cross-Origin Resource Sharing configuration
  - **Purpose**: Enables secure frontend integration while preventing CSRF

### **👤 User Management System**
- **Email-based Authentication** - Unique email constraint with validation
  - **Purpose**: User identification and login credential
- **Password Security** - Minimum 6-character requirement with bcrypt hashing
  - **Purpose**: Account security with industry-standard hashing
- **User Context** - JWT payload includes userId and email for request context
  - **Purpose**: Request attribution without database lookups

### **📊 Trade Management Engine**
- **CRUD Operations** - Create and Read operations only (as per specification)
  - **POST /trades** - Create new trades with full validation
  - **GET /trades** - Retrieve all trades with optional filtering
  - **GET /trades/:id** - Retrieve specific trade by ID  
  - **PUT/PATCH/DELETE /trades/:id** - Explicitly returns 405 Method Not Allowed
- **Business Logic Validation**:
  - Trade type restricted to "buy" or "sell"
  - Share quantity limited to 1-100 range (business requirement)
  - Positive price validation
  - Stock symbol normalization (uppercase conversion)
- **Data Relationships** - Foreign key relationship between users and trades

### **✅ Input Validation & Data Integrity**
- **Joi v17.11.0** - Schema-based validation library
  - **Request Body Validation** - JSON payload validation for POST requests
  - **Query Parameter Validation** - URL query validation for GET requests  
  - **Path Parameter Validation** - Route parameter validation for dynamic routes
  - **Purpose**: Prevents invalid data entry, ensures business rule compliance
- **Data Sanitization** - Automatic type conversion and format standardization
- **Business Rule Enforcement** - Schema-level business logic validation

### **🗄️ Database & ORM**
- **MySQL v8.0+** - Relational database with ACID compliance
  - **Connection Pooling** - Prisma manages connection pool (9 connections default)
  - **Transaction Support** - Atomic operations for data consistency
  - **Purpose**: Reliable data persistence with referential integrity
- **Prisma ORM v5.6.0** - Type-safe database client with:
  - **Schema Definition** - Declarative database schema in Prisma DSL
  - **Migration System** - Version-controlled database schema changes
  - **Query Builder** - Type-safe database queries with IntelliSense
  - **Purpose**: Eliminates SQL injection, provides type safety, simplifies database operations

### **🧪 Testing Infrastructure**
- **Jest v29.7.0** - Testing framework with:
  - **Unit Tests** - Individual function and middleware testing
  - **Integration Tests** - Full API endpoint testing
  - **Coverage Reports** - Code coverage analysis and reporting
  - **Purpose**: Ensures code quality, prevents regressions
- **Supertest v6.3.3** - HTTP assertion testing:
  - **API Endpoint Testing** - Real HTTP request/response testing
  - **Purpose**: End-to-end API testing without manual testing

## 🏗️ System Architecture

### **Multi-Layer Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Web Apps • Mobile Apps • API Testing Tools • CLI Tools    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS Requests
┌─────────────────────▼───────────────────────────────────────┐
│                  MIDDLEWARE LAYER                           │
│  Helmet Security • CORS • Body Parser • Request Logging     │
└─────────────────────┬───────────────────────────────────────┘
                      │ Processed Requests
┌─────────────────────▼───────────────────────────────────────┐
│                AUTHENTICATION LAYER                         │
│  JWT Verification • User Context • Token Validation         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Authenticated Requests
┌─────────────────────▼───────────────────────────────────────┐
│                 VALIDATION LAYER                            │
│  Joi Schemas • Business Rules • Data Sanitization          │
└─────────────────────┬───────────────────────────────────────┘
                      │ Validated Data
┌─────────────────────▼───────────────────────────────────────┐
│                 BUSINESS LOGIC LAYER                        │
│  Route Handlers • Controllers • Service Logic               │
└─────────────────────┬───────────────────────────────────────┘
                      │ Database Operations
┌─────────────────────▼───────────────────────────────────────┐
│                  DATA ACCESS LAYER                          │
│  Prisma ORM • Query Builder • Transaction Management        │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQL Queries
┌─────────────────────▼───────────────────────────────────────┐
│                   DATABASE LAYER                            │
│  MySQL 8.0 • Connection Pool • ACID Transactions           │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Architecture

### **Prisma Schema Configuration**
```prisma
generator client {
  provider = "prisma-client-js"  // TypeScript client generation
}

datasource db {
  provider = "mysql"             // MySQL database provider
  url      = env("DATABASE_URL") // Environment variable injection
}

model User {
  id       Int     @id @default(autoincrement())  // Auto-increment primary key
  email    String  @unique                        // Unique constraint for login
  password String                                 // bcrypt hashed password
  trades   Trade[] // One-to-many relationship    // Foreign key relationship
  
  @@map("users")  // Custom table name mapping
}

model Trade {
  id        Int      @id @default(autoincrement()) // Auto-increment primary key
  type      String   // "buy" or "sell" validation // Trade direction
  userId    Int      @map("user_id")               // Foreign key to users
  symbol    String   // Stock ticker symbol        // Normalized to uppercase
  shares    Int      // Share quantity 1-100       // Business rule constraint
  price     Float    // Share price per unit       // Positive decimal
  timestamp DateTime @default(now())               // Auto-generated timestamp
  
  user User @relation(fields: [userId], references: [id]) // Foreign key relation
  
  @@map("trades") // Custom table name mapping
}
```

### **Data Transformation Pipeline**
```javascript
// Input (HTTP Request Body)
{
  "type": "buy",
  "user_id": 1,
  "symbol": "aapl",     // lowercase input
  "shares": 50,
  "price": "150.25"     // string input
}

// ↓ Joi Validation & Transformation
{
  type: "buy",           // ✓ Validated against enum ["buy", "sell"]
  user_id: 1,           // ✓ Converted to integer, positive validation
  symbol: "aapl",       // ✓ String validation, will be normalized
  shares: 50,           // ✓ Integer validation, range check (1-100)
  price: 150.25         // ✓ Converted to float, positive validation
}

// ↓ Business Logic Processing
{
  type: "buy",
  userId: 1,            // ✓ Mapped to Prisma field name
  symbol: "AAPL",       // ✓ Normalized to uppercase
  shares: 50,
  price: 150.25,
  timestamp: new Date() // ✓ Auto-generated timestamp
}

// ↓ Database Storage (MySQL via Prisma)
{
  id: 1,                // ✓ Auto-generated by MySQL AUTO_INCREMENT
  type: "buy",
  user_id: 1,           // ✓ Foreign key reference
  symbol: "AAPL",
  shares: 50,
  price: 150.25,
  timestamp: "2023-12-01 10:30:00"  // ✓ MySQL DATETIME format
}

// ↓ API Response (JSON)
{
  "id": 1,
  "type": "buy",
  "user_id": 1,
  "symbol": "AAPL",
  "shares": 50,
  "price": 150.25,
  "timestamp": 1701424200000  // ✓ Converted to Unix milliseconds
}
```

## 🚀 Getting Started

### **1. Installation**
```bash
git clone <repository-url>
cd stock-trades-api
npm install
```

### **2. Environment Setup**
```bash
cp env.example .env
# Edit .env with your MySQL credentials
```

### **3. Database Setup**
```bash
npm run db:generate
npm run db:migrate
```

### **4. Start Server**
```bash
npm run dev
```

### **5. Test API**
```bash
curl http://localhost:3000/health
```

## 🧪 Testing

```bash
npm test                 # Run all tests
npm test -- --coverage  # Run with coverage
```

## 📋 API Endpoints

### **Authentication**
- `POST /signup` - Create user account
- `POST /login` - User authentication
- `POST /token/refresh` - Refresh access token

### **Trades (Protected)**
- `POST /trades` - Create new trade
- `GET /trades` - Get all trades (with filtering)
- `GET /trades/:id` - Get specific trade
- `PUT/PATCH/DELETE /trades/:id` - Returns 405

## 🔧 Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | v4.18.2 | Web framework for HTTP server |
| **MySQL** | v8.0+ | Relational database for data persistence |
| **Prisma** | v5.6.0 | ORM for type-safe database operations |
| **JWT** | v9.0.2 | Stateless authentication tokens |
| **bcryptjs** | v2.4.3 | Password hashing for security |
| **Joi** | v17.11.0 | Request validation and sanitization |
| **Helmet** | v7.1.0 | Security headers middleware |
| **CORS** | v2.8.5 | Cross-origin resource sharing |
| **Jest** | v29.7.0 | Testing framework |
| **Supertest** | v6.3.3 | HTTP API testing |
| **Nodemon** | v3.0.1 | Development server hot-reload |

---

**🎯 Built with enterprise-grade architecture for production deployment, scalability, and maintainability.** 