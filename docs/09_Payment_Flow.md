# 💳 Payment Flow Documentation — Library Management System

Comprehensive technical architecture for **Book Purchases** and **Fine/Penalty Settlements** integrated via **Razorpay** and **On-The-Spot Cash Collection**.

---

## 1. Architectural Overview

```text
                               ┌───────────────────────────┐
                               │   Student React Client    │
                               └─────────────┬─────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               │ 1. Initiate Purchase Order  │ 1. Initiate Fine Payment    │
               │ (POST /purchases/create-order) (POST /fines/create-order) │
               ▼                             ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
   │ Express Purchases API │     │   Express Fines API   │     │  Express Cash Desk    │
   │  - Validates Price > 0│     │  - Computes Due Fines │     │  - Admin Authorization│
   │  - Razorpay SDK Order │     │  - Razorpay SDK Order │     │  - Instant Settlement │
   └───────────┬───────────┘     └───────────┬───────────┘     └───────────┬───────────┘
               │                             │                             │
               ▼                             ▼                             ▼
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │                     Server-Side Signature Verification & Storage                  │
   │   - HMAC-SHA256: crypto.createHmac('sha256', secret).update(order|pay).digest()   │
   │   - Status Marked "PAID" in MongoDB (Purchase / FinePayment collections)          │
   └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Book Purchase Flow (Student Self-Checkout)

### Sequence

1. **Browsing & Availability Check**:
   - Student navigates to `/books/:id`.
   - If `book.purchasePrice > 0`, the system displays the price and renders the `[ Purchase Book (₹XX) ]` button.
   - If `book.purchasePrice === 0`, purchase is disabled (`Loan Only`).

2. **Order Creation (`POST /api/purchases/create-order`)**:
   - Client sends `{ bookId }`.
   - The backend looks up the book in MongoDB and reads `book.purchasePrice`.
   - The backend calls Razorpay SDK `orders.create({ amount: price * 100, currency: "INR" })`.
   - A `Purchase` record is saved in MongoDB with `status = "created"`.
   - The backend responds with `{ orderId, amount, currency, key_id }`.

3. **Client Razorpay Modal**:
   - The student frontend dynamically loads Razorpay Checkout.
   - The payment dialog appears with prefilled student details.
   - Student completes payment.
   - Razorpay returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`.

4. **Server-Side Verification (`POST /api/purchases/verify`)**:
   - Client submits the payment payload to the server.
   - Server recomputes the HMAC-SHA256 signature using `process.env.RAZORPAY_KEY_SECRET`.
   - If valid:
     - `Purchase.status = "paid"`.
     - `Purchase.razorpayPaymentId` and `purchaseDate` are persisted.
     - Student redirected / receipt shown on `/my-purchases`.
   - If invalid:
     - `Purchase.status = "failed"`.
     - Transaction rejected with HTTP 400.

---

## 3. Dual Fine Payment System

### Method A: Online Self-Settlement (Student Razorpay)

1. **Calculation**:
   $$\text{Outstanding Fine} = \text{Issue.fine} - \sum \text{Paid FinePayments for this Issue}$$
2. **Order Creation (`POST /api/fines/create-order`)**:
   - Client submits `{ issueId }`.
   - Backend calculates outstanding fine. If $\le 0$, rejects with `400: No outstanding fine`.
   - Creates Razorpay order and pending `FinePayment` document.
3. **Verification (`POST /api/fines/verify`)**:
   - Server verifies Razorpay cryptographic signature.
   - Updates `FinePayment.status = "paid"` and `paidAt = Date.now()`.
   - Outstanding fine automatically drops to ₹0 on `/my-books` and `/profile`.

### Method B: Offline On-The-Spot Collection (Admin Cash Desk)

1. **Trigger**:
   - Student approaches circulation desk.
   - Admin opens `/issues`, `/issues/overdue`, or `/members/:id`.
   - Admin clicks `[ Collect Fine ]`.
2. **Cash Settlement (`POST /api/fines/:issueId/collect`)**:
   - Admin submits `{ paymentMethod: "cash" }`.
   - Backend verifies admin JWT authorization.
   - Computes outstanding fine and creates `FinePayment` with:
     - `paymentMethod = "cash"`
     - `status = "paid"`
     - `collectedBy = req.user._id` (Admin ID for audit log)
     - `paidAt = Date.now()`.
   - Outstanding fine balance resets to ₹0 immediately.

---

## 4. Double-Payment Prevention Safeguards

- Before generating a payment order, the backend executes an atomic aggregation of all existing paid payments for that issue.
- If total paid equals or exceeds `issue.fine`, `createFineOrder` is aborted with `400 Bad Request`.
- Idempotency is enforced on `verifyFinePayment` so redundant verification requests return the existing receipt without duplicate charges.
