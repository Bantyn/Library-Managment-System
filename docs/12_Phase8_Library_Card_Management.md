# Phase 8 — Centralized Library Card & Pass ID Management

## Overview

Phase 8 introduces a centralized, immutable, backend-generated **12-digit decimal Library Card / Pass ID** system (`000000000001` through `999999999999`) across the entire Library Management System.

---

## 1. Architectural Design

```text
Student Registration
        │
        ▼
Counter Model (Atomic $inc) ──► 12-Digit Pad ("000000000123")
                                        │
                                        ▼
                         User.libraryCardId (Unique & Immutable)
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
[ Admin Members & Search ]      [ Issue Book Fast Lookup ]     [ Student Digital Pass ]
- Table column & filter          - Instant student lookup       - Profile 12-digit display
- Search by 12-digit ID          - Resolves to User._id         - Official Digital Pass
- Dashboard Quick Lookup         - Validates Active status      - [ Print Library Card ]
```

---

## 2. Key Business Rules & Invariants

1. **Decimal Digits Only**: Format strictly matches `^[0-9]{12}$`. No letters, hyphens, spaces, or special characters.
2. **Fixed-Length String**: Stored as a 12-character string (preserving leading zeros, e.g., `"000000000123"`).
3. **Atomic Concurrency Guarantee**: Generated exclusively by the backend via atomic `findOneAndUpdate` with `$inc` on the `Counter` collection.
4. **Permanent Immutability**: Once assigned, the Library Card ID cannot be modified by students or administrators. Any `PUT` request attempting alteration is rejected with HTTP `400 Bad Request`.
5. **Soft-Delete Non-Reuse**: When a student is deactivated or soft-deleted, their Library Card ID remains permanently bound to historical records and is **never** recycled.
6. **Circulation Resolution**: Issue book operations accept either student MongoDB ObjectId or 12-digit Library Card ID, resolving to `student: ObjectId` internally.

---

## 3. Database Schema

### `Counter` Collection (`Backend/src/models/Counter.js`)
```javascript
{
  name: { type: String, required: true, unique: true },
  sequenceValue: { type: Number, default: 0, min: 0 }
}
```

### `User` Collection (`Backend/src/models/User.js`)
```javascript
{
  name: String,
  email: { type: String, unique: true },
  studentId: String,          // Academic/Institutional ID (e.g. MCA001)
  libraryCardId: {            // Centralized Library Card / Pass ID
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    immutable: true,
    match: [/^[0-9]{12}$/, 'Library Card ID must be exactly 12 decimal digits'],
    index: true,
  },
  role: { type: String, enum: ['admin', 'student'] },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}
```

---

## 4. API Reference

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public (Student) | Registers student, generates sequential 12-digit Library Card ID |
| `GET` | `/api/members?libraryCardId=000000000123` | Admin | Filter member by exact 12-digit Library Card ID |
| `GET` | `/api/members?search=000000000123` | Admin | Search members by name, email, studentId, or libraryCardId |
| `PUT` | `/api/members/:id` | Admin | Updates member details; rejects any modification of `libraryCardId` |
| `DELETE` | `/api/members/:id` | Admin | Soft-deletes member; preserves `libraryCardId` in database |
| `POST` | `/api/issues` | Admin | Issue book by specifying either `studentId` or `libraryCardId` |
| `GET` | `/api/reports/members?format=csv` | Admin | Downloads CSV registry of all members including `Library Card ID` |

---

## 5. Frontend Implementations

### Student Frontend (`Frontend/`)
- **Student Profile (`/profile`)**:
  - Displays 12-digit Library Card ID with quick copy button.
  - Renders **Digital Library Card / Pass** card with campus branding, student photo initial, academic ID, 12-digit card number, barcode pattern, active status, and issuance date.
  - **[ Print Library Card ]** button with `@media print` styling printing only the card badge.

### Admin Portal (`Admin/`)
- **Members List (`/admin/members`)**: Dedicated **Library Card ID** column with monospace styling; search bar supports 12-digit card IDs.
- **Member Details (`/admin/members/:id`)**: Prominent Library Card ID badge in membership overview.
- **Issue Book (`/admin/issues/issue-book`)**: "Fast Member Identification via Library Card ID" input and lookup button with visual status feedback.
- **Dashboard (`/admin/dashboard`)**: Quick Library Card Lookup card for rapid identity verification.

---

## 6. Automated Verification Results

All 27 Phase 8 automated test cases passed in `Backend/test-phase8-library-card.js`:
- ✅ Sequential atomic 12-digit decimal ID generation (`000000000001`...)
- ✅ Duplicate card ID rejection
- ✅ Filter & search by Library Card ID
- ✅ Book issuance via 12-digit Library Card ID
- ✅ Strict immutability protection (rejection of alteration)
- ✅ Soft-delete non-reuse guarantee
- ✅ Login and `/api/auth/me` payload verification
- ✅ Member registry CSV report export with Library Card ID
