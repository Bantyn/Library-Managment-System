# Phase 6 — Reports and CAPTCHA Specification

## 1. Cryptographic Server-Side CAPTCHA

### Architecture
- **Challenge Generation**: Handled exclusively on the server (`GET /api/auth/captcha`).
- **Visual Rendering**: Pure SVG markup with random background noise lines, scatter dots, distorted character glyphs, and distinct color variations. No heavy native binary canvas dependencies.
- **Storage & Expiration**: Active challenges are stored server-side with a 5-minute Time-To-Live (TTL).
- **Single-Use Enforcement**: Any attempt to verify a challenge deletes the `captchaId` from memory immediately, preventing replay attacks or brute-force retries.
- **Case-Insensitive Match**: User input is matched case-insensitively against the stored answer.
- **Integration Points**:
  - Student Registration (`/register`)
  - Student Login (`/login`)
  - Admin Login (`/login`)

---

## 2. HTTP-Only Cookie Session Management

### Architecture
- **Cookie Security**:
  - `httpOnly: true` (prevents XSS access from client JavaScript).
  - `secure: true` in production (`process.env.NODE_ENV === 'production'`).
  - `sameSite: 'lax'` (prevents CSRF across external domains).
  - `maxAge: 7 days`.
- **Dual-Token Support**: `authMiddleware.js` seamlessly checks `req.cookies.token` first, falling back to `Authorization: Bearer <token>` header for automated scripts and external tooling.
- **CORS Configuration**: Explicit origin whitelist (`http://localhost:5173`, `http://localhost:5174`) with `credentials: true`.
- **Axios Configuration**: Both `Admin` and `Frontend` clients configured with `withCredentials: true`.
- **Logout**: `POST /api/auth/logout` explicitly clears the `token` cookie with matching security flags.

---

## 3. Comprehensive AWD Institutional Reports Suite (`/admin/reports`)

### 3.1 8 Summary KPI Cards
All aggregated directly from live MongoDB records:
1. **Total Books**: Active non-deleted book titles.
2. **Total Members**: Registered student accounts.
3. **Total Loans**: Total circulation issue records created.
4. **Overdue Loans**: Active loans past due date with returnDate = null.
5. **Book Sales**: Completed book purchases.
6. **Book Revenue**: Total sum of completed book sales.
7. **Fine Collected**: Sum of settled late return penalties.
8. **Unpaid Fines**: Outstanding unpaid late penalty balance.

### 3.2 6 Core Institutional Reports
Each report provides interactive date/status filtering, real-time live preview table, one-click **Export to CSV**, and **Print / PDF View**:
1. **Book Catalog Report** (`/api/reports/books`):
   - Fields: Title, Author, ISBN, Category, Total Copies, Available Copies, Issued Copies, Purchase Price, Status.
2. **Circulation / Issues Report** (`/api/reports/issues`):
   - Fields: Student Name, Student ID, 12-Digit Library Card ID, Book Title, ISBN, Issue Date, Due Date, Return Date, Status, Fine.
3. **Overdue Loans Report** (`/api/reports/overdue`):
   - Fields: Student Name, Student ID, 12-Digit Library Card ID, Phone, Book Title, Due Date, Days Overdue, Accrued Fine, Payment Status.
4. **Member Registry Report** (`/api/reports/members`):
   - Fields: 12-Digit Library Card ID, Student ID, Student Name, Email Address, Phone, Status, Registration Date.
5. **Book Purchases Report** (`/api/reports/purchases`):
   - Fields: Student Name, 12-Digit Library Card ID, Book Title, Amount, Purchase Date, Order Status, Razorpay Payment ID.
6. **Fine Settlements Report** (`/api/reports/fines`):
   - Fields: Student Name, 12-Digit Library Card ID, Amount Paid, Payment Method, Status, Payment Date, Collected By, Reference.
