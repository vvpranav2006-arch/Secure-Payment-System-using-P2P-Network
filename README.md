# 🛡️ PayPulse — Secure Peer-to-Peer (P2P) Digital Wallet & Payment System

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-emerald.svg)](https://nodejs.org/)
[![MongoDB ACID Transactions](https://img.shields.io/badge/Database-MongoDB%20ACID-brightgreen.svg)](https://www.mongodb.com/)
[![Security Standards](https://img.shields.io/badge/Security-FinTech%20Grade-blue.svg)](https://owasp.org/)
[![License](https://img.shields.io/badge/License-ISC-gray.svg)](https://opensource.org/licenses/ISC)

> Production-ready, enterprise-grade Peer-to-Peer (P2P) Digital Wallet and Payment System (similar to Google Pay / Paytm) built strictly using the **MERN stack** (MongoDB, Express.js, React.js, Node.js). Engineered with strict FinTech security patterns, multi-document ACID transactions, double-spending prevention via idempotency keys, integer subunit precision, and brute-force resilient transaction PIN authorization.

---

## 🏛️ System Architecture

```
                                      ┌────────────────────────────────────────────────┐
                                      │              React 18 + Vite UI               │
                                      │  (Tailwind CSS, Debounced Autocomplete, PIN)   │
                                      └──────────────────────┬─────────────────────────┘
                                                             │
                                                  HTTPS / JSON REST API
                                                (Idempotency-Key Header)
                                                             │
                                                             ▼
                                      ┌────────────────────────────────────────────────┐
                                      │             Express 5 REST Gateway             │
                                      │  - Helmet Headers & CORS Isolation            │
                                      │  - Rate Limiters (Auth & Transfers)           │
                                      │  - Zod Request Schema Validation              │
                                      │  - JWT Bearer Authentication                   │
                                      │  - Idempotency Interceptor (TTL Cache)        │
                                      │  - Transaction PIN Verification & Lockout      │
                                      └──────────────────────┬─────────────────────────┘
                                                             │
                                          Mongoose Multi-Document Transactions
                                          (Snapshot Read / Majority Write Concern)
                                                             │
                                                             ▼
                                ┌────────────────────────────────────────────────────────────┐
                                │                      MongoDB Engine                        │
                                │  ┌──────────────────────────────────────────────────────┐  │
                                │  │ 1. Atomic Debit User A:                             │  │
                                │  │    Account.updateOne({                               │  │
                                │  │      _id: A, balance: { $gte: amount }               │  │
                                │  │    }, { $inc: { balance: -amount } })                │  │
                                │  ├──────────────────────────────────────────────────────┤  │
                                │  │ 2. Atomic Credit User B:                             │  │
                                │  │    Account.updateOne({ _id: B },                     │  │
                                │  │      { $inc: { balance: +amount } })                 │  │
                                │  ├──────────────────────────────────────────────────────┤  │
                                │  │ 3. Ledger Entry:                                     │  │
                                │  │    Transaction.create({ refId, before, after })      │  │
                                │  └──────────────────────────────────────────────────────┘  │
                                └────────────────────────────────────────────────────────────┘
```

---

## 🔒 FinTech & Security Engineering Principles

### 1. Integer Subunit Precision (No Floating-Point Math)
- In financial computing, **IEEE 754 binary floating-point representation** causes catastrophic precision loss (e.g., `0.1 + 0.2 = 0.30000000000000004` or `19.99 * 100 = 1998.9999999999998`).
- In PayPulse, **all monetary values are strictly validated and stored as positive 64-bit integers in the smallest currency subunit (`paise` where 1 INR = 100 paise / cents)**.
- Precision conversion utilities (`toSubunits`, `fromSubunits`, `formatCurrency`) eliminate float rounding bugs at the boundaries.

### 2. ACID Multi-Document Transactions (`session.startTransaction()`)
- Money transfers debit User A and credit User B across separate documents.
- Both operations and ledger creation occur within an atomic session:
  ```js
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  });
  ```
- If debit fails, credit fails, or a network disconnection occurs, the transaction aborts completely, guaranteeing **zero money creation or destruction**.

### 3. Concurrency & Race Condition Elimination
- Even with multi-threading or burst HTTP transfers, negative balances are prevented using conditional DB-level atomic writes:
  ```js
  Account.findOneAndUpdate(
    { _id: senderAccountId, balance: { $gte: amountInSubunits }, status: 'ACTIVE' },
    { $inc: { balance: -amountInSubunits, version: 1 } },
    { session, new: true }
  );
  ```
  If another process races and debits balance first, the query fails atomically, preventing overdraft.

### 4. Idempotency Key Deduplication (`Idempotency-Key`)
- Prevents double-spending caused by user double-clicks or mobile network drops/retries.
- Client passes `Idempotency-Key: <UUIDv4>`.
- The middleware creates an `IN_PROGRESS` record in MongoDB. If a concurrent retry arrives, it returns `409 Conflict`. If already completed, it returns the cached response with `X-Idempotency-Replay: true`. Records expire automatically using MongoDB TTL indices (`expires: 24h`).

### 5. Bcrypt Transaction PIN Authorization & Lockout Policy
- Transfers require a 4 to 6 digit numeric transaction PIN.
- PIN is never stored in plaintext — it is hashed using `bcrypt` with cost factor 12.
- 5 consecutive failed PIN attempts automatically lock the user's PIN for 15 minutes, preventing automated dictionary and brute-force attacks.

---

## 🗄️ Database Schemas & Indexes

| Model | Key Fields | Purpose & Indexes |
| :--- | :--- | :--- |
| **`User`** | `fullName`, `username`, `email`, `phone`, `passwordHash`, `pinHash`, `isPinSet`, `failedPinAttempts` | User identity & security credentials. Unique indices on `username`, `email`, `phone`. Compound text index for fast P2P autocomplete. |
| **`Account`** | `userId`, `balance` (Integer Subunits), `currency`, `status`, `version` | Wallet balance ledger. Unique 1:1 index on `userId`. Integer validation (`balance >= 0`). |
| **`Transaction`** | `referenceId`, `idempotencyKey`, `senderId`, `receiverId`, `amount`, `senderBalanceAfter`, `receiverBalanceAfter`, `status` | Double-entry passbook ledger. Unique index on `referenceId`, sparse unique on `idempotencyKey`, compound indexes on `{ senderId, createdAt: -1 }`. |
| **`IdempotencyRecord`**| `key`, `userId`, `requestHash`, `status`, `responseCode`, `responseBody`, `expiresAt` | Replay protection cache with native MongoDB TTL index on `expiresAt`. |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (v6.0+) running locally or on MongoDB Atlas

### 1. Clone & Install Dependencies
```bash
# Clone the repository
cd "secure p2p"

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Inside `backend/.env`:
```env
PORT=5050
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/secure_p2p_wallet
JWT_SECRET=super_secure_fintech_jwt_secret_key_change_in_prod_!#$2026
JWT_EXPIRES_IN=24h
INITIAL_ONBOARDING_BALANCE=500000
CORS_ORIGIN=http://localhost:5173
```

### 3. Run Backend & Frontend

#### Terminal 1 — Start Express Backend:
```bash
cd backend
npm run dev
# Server running at http://localhost:5050
```

#### Terminal 2 — Start React Vite Frontend:
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:5173
```

### 4. Run Automated Backend Tests
```bash
cd backend
npm test
# Runs 12 automated unit tests for subunit currency precision, Zod validation, and security rules
```

---

## 📡 REST API Reference (`/api/v1`)

### Authentication & Security
- `POST /api/v1/auth/register` — Register user, initialize wallet account with ₹5,000 onboarding bonus, and return JWT.
- `POST /api/v1/auth/login` — Sign in with username, email, or phone.
- `GET /api/v1/auth/me` — Retrieve active authenticated session and balance profile.
- `POST /api/v1/auth/pin` — Set or update 4-6 digit Transaction PIN (requires account password).

### Account & P2P Transfers
- `GET /api/v1/account/balance` — Get real-time balance in subunits and major currency.
- `GET /api/v1/account/users?query=rahul` — Search registered wallet users by username, email, or phone.
- `POST /api/v1/account/transfer` — **Core Atomic P2P Transfer**:
  - **Headers**: `Authorization: Bearer <token>`, `Idempotency-Key: <UUIDv4>`
  - **Body**: `{ "recipientIdentifier": "rahul_sharma", "amount": 250.00, "pin": "1234", "notes": "Lunch" }`
- `GET /api/v1/account/transactions` — Paginated passbook with `type` (ALL, SENT, RECEIVED) and `status` filters.
- `GET /api/v1/account/transactions/:id` — Digital transaction receipt details by ID or reference ID.

---

## 🧪 Testing Concurrent Transfer / Idempotency Demonstration

1. Register **User A** (`alice`, PIN: `1111`) and **User B** (`bob`, PIN: `2222`). Both start with **₹5,000.00** (500,000 paise).
2. Send **₹1,250.00** from Alice to Bob with note `"Invoice #101"`.
3. Alice's balance instantly debits to **₹3,750.00** (375,000 paise); Bob's balance credits to **₹6,250.00** (625,000 paise).
4. If network repeats the transfer with the same `Idempotency-Key`, PayPulse returns the cached receipt with `X-Idempotency-Replay: true` without deducting funds a second time.

