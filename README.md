# 📚 PustakSetu : Library Management System

A full-stack **Library Management System (LMS)** built with the **MERN stack — MongoDB, Express.js, React, and Node.js**.

The system is designed to manage a modern library's complete workflow, including **book cataloguing, inventory, members, library cards, book issue/return, reservations, fines, authentication, role-based access control, and administrative analytics**.

### 👨‍💻 Created & Developed By

**Banty Patel**

A full-stack project focused on building a scalable, maintainable, and practical library management platform using modern web technologies.

---

## 🧰 Tech Stack

| Layer             | Technology                  |
| ----------------- | --------------------------- |
| Frontend          | React 18+                   |
| Build Tool        | Vite                        |
| Backend           | Node.js + Express.js        |
| Database          | MongoDB                     |
| ODM               | Mongoose                    |
| Authentication    | JWT                         |
| Password Security | bcrypt / bcryptjs           |
| API               | REST                        |
| Validation        | Zod / Joi                   |
| Styling           | Modern CSS / Design Tokens  |
| State Management  | Context API / Redux Toolkit |

### Architecture

```text
┌───────────────────────────┐
│       React Frontend      │
│       Vite + React        │
└─────────────┬─────────────┘
              │
              │ REST API / HTTP
              ▼
┌───────────────────────────┐
│      Express Backend      │
│   Routes + Middleware     │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Authentication / RBAC     │
│ JWT + Authorization       │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Controllers / Services    │
│ Business Logic            │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│       Mongoose / DB       │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│          MongoDB          │
└───────────────────────────┘
```

---

# ✨ Features

## 📖 Book & Catalog Management

- Create, read, update, and delete books
- ISBN management
- Author and category management
- Publisher information
- Publication year and edition tracking
- Multiple physical copies
- Rack / shelf location
- Book availability tracking
- Lost / damaged book status
- Advanced search and filtering
- Cover image support
- Barcode / QR code support

The catalog is designed for a **general-purpose library**, not only technical or computer-science books.

Books can belong to categories such as:

- Computer Science
- Programming
- Artificial Intelligence
- Data Science
- Business
- Finance
- Economics
- Mathematics
- Science
- History
- Geography
- Literature
- Fiction
- Psychology
- Philosophy
- Biography
- Self Development
- Competitive Exams
- Children's Books
- Arts
- Travel
- And other library categories

---

## 👥 User & Member Management

The system supports role-based access control.

### Admin

Admin users have full system access, including:

- User management
- Librarian management
- Book management
- Inventory management
- Library configuration
- Analytics
- Reports
- Audit-related operations
- System administration

### Librarian

Librarians can manage day-to-day library operations:

- Add/update books
- Manage inventory
- Issue books
- Return books
- Renew books
- Manage fines
- Manage reservations
- View overdue books

### Member

Members can:

- Browse the catalog
- Search for books
- View book details
- View borrowing history
- View currently borrowed books
- Reserve books
- View active fines
- Manage their profile
- Access their library membership information

---

# 🪪 Library Membership

The system supports digital library membership.

Depending on the configured data model, members can have:

- Unique membership records
- Digital library cards
- Membership status
- Issue and expiry dates
- Borrowing limits
- Active loan count
- Membership history

### Library Card Number

Library card/pass identifiers should be:

```text
Numeric only
Unique
Stable
```

Example:

```text
10000001
10000002
10000003
10000004
```

---

# 🔄 Book Circulation

The circulation module manages the complete book lifecycle.

```text
Available
    │
    ▼
Issued
    │
    ├──────────────► Returned
    │
    ▼
Overdue
    │
    ▼
Fine Generated
```

Supported workflows include:

- Book issue
- Book return
- Due-date tracking
- Renewal
- Overdue detection
- Fine calculation
- Fine payment tracking
- Reservation queue
- Borrowing history

---

# 💰 Fine Management

The system can calculate and track fines for overdue books.

Fine information can include:

- Fine amount
- Fine status
- Related borrowing transaction
- Payment status
- Payment date
- Overdue duration

Example:

```text
Borrowed:
01 September

Due:
15 September

Returned:
18 September

Overdue:
3 days

Fine:
3 × configured daily rate
```

The actual fine calculation should follow the application's configured business rules.

---

# 📦 Inventory Management

Inventory is separated conceptually from the book catalog where the application's data model supports physical copies.

Example:

```text
Book
└── Clean Code
    ├── Copy 001
    ├── Copy 002
    ├── Copy 003
    └── Copy 004
```

Each physical copy can contain information such as:

- Copy identifier
- Book reference
- Availability
- Condition
- Rack / shelf
- Acquisition information

This prevents the catalog record and physical inventory from being treated as the same thing.

---

# 📊 Dashboard & Analytics

The administrative dashboard can provide:

- Total books
- Total members
- Active borrows
- Returned books
- Overdue books
- Available inventory
- Fine revenue
- Popular books
- Popular categories
- Borrowing trends

Reports can be exported to supported formats such as:

- CSV
- PDF

---

# 🗂️ Project Structure

```text
library-management-system/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── layouts/
│       ├── routes/
│       ├── services/
│       ├── styles/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validations/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── workflows/
│
├── .gitignore
├── LICENSE
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

- **Node.js 18+**
- npm, pnpm, or yarn
- MongoDB locally or MongoDB Atlas
- Git

Check your Node.js installation:

```bash
node --version
```

Check npm:

```bash
npm --version
```

---

# 📥 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/library-management-system.git
cd library-management-system
```

---

## 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3. Configure Backend Environment

Create the environment file:

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then configure the values inside:

```text
server/.env
```

Example:

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/library_management_db

JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d

FINE_RATE_PER_DAY=1.50
DEFAULT_BORROW_DAYS=14
```

---

# 🖥️ Start Backend

From the `server` directory:

```bash
npm run dev
```

The API will normally be available at:

```text
http://localhost:5000
```

API base path:

```text
http://localhost:5000/api/v1
```

---

# 🌐 Start Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔐 Client Environment

Create:

```text
client/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Restart the Vite development server after changing environment variables.

---

# 🌱 Database Seeding

The project should provide a database seeder for creating a clean development dataset.

The seeder should:

1. Clean existing application data
2. Create the default administrator
3. Create categories
4. Create authors
5. Create publishers
6. Create books
7. Create members
8. Create library cards
9. Create inventory / physical copies
10. Create borrowing history
11. Create fines where applicable
12. Create reservations where applicable
13. Verify important relationships

The seed dataset should contain books from **multiple library domains**, not only Computer Science or Programming.

### Default Development Admin

```text
Email:
admin@gmail.com

Password:
admin123
```

> ⚠️ These credentials are intended for local/development use only. Change or disable the default account before deploying to production.

### Running the Seeder

Use the seed command configured by the backend project.

For example:

```bash
npm run seed
```

or:

```bash
npm run db:seed
```

If the project defines a different command, use the command specified in `server/package.json`.

### Seeder Expectations

The seeder should be safe to execute repeatedly.

```text
Run Seeder
     │
     ▼
Clean Existing Data
     │
     ▼
Create Fresh Dataset
     │
     ▼
Validate Relationships
     │
     ▼
Seeder Complete
```

It should not continuously create duplicate records every time it runs.

---

# 🔑 Authentication

Authentication uses JWT-based authorization.

Typical authentication flow:

```text
User
 │
 │ Login
 ▼
POST /api/v1/auth/login
 │
 ▼
Validate Credentials
 │
 ▼
Generate JWT
 │
 ▼
Client Stores Token
 │
 ▼
Authenticated API Requests
```

Protected routes should verify:

- Valid token
- Token expiration
- User identity
- User role
- Required permissions

---

# 🛡️ Role-Based Access Control

The application uses RBAC to restrict access to protected operations.

```text
ADMIN
  │
  ├── Full Access
  │
  └── System Management

LIBRARIAN
  │
  ├── Catalog
  ├── Inventory
  ├── Issue / Return
  └── Fines

MEMBER
  │
  ├── Catalog
  ├── Own Borrow History
  ├── Reservations
  └── Own Fines
```

Authorization should be enforced on the **backend**, not only by hiding frontend UI elements.

---

# 📡 API Overview

All APIs are versioned under:

```text
/api/v1
```

## Authentication

Base URL:

```text
/api/v1/auth
```

| Method | Endpoint    | Access  | Purpose           |
| ------ | ----------- | ------- | ----------------- |
| POST   | `/register` | Public  | Register a member |
| POST   | `/login`    | Public  | Authenticate user |
| GET    | `/me`       | Private | Get current user  |

---

## Books

Base URL:

```text
/api/v1/books
```

| Method | Endpoint | Access            | Purpose           |
| ------ | -------- | ----------------- | ----------------- |
| GET    | `/`      | Public            | List/search books |
| GET    | `/:id`   | Public            | Get book details  |
| POST   | `/`      | Admin / Librarian | Create book       |
| PUT    | `/:id`   | Admin / Librarian | Update book       |
| DELETE | `/:id`   | Admin             | Delete book       |

---

## Borrowing

Base URL:

```text
/api/v1/borrows
```

| Method | Endpoint            | Access            | Purpose                    |
| ------ | ------------------- | ----------------- | -------------------------- |
| POST   | `/issue`            | Admin / Librarian | Issue book                 |
| POST   | `/return/:borrowId` | Admin / Librarian | Return book                |
| GET    | `/my-borrows`       | Member            | View own borrowing history |
| GET    | `/overdue`          | Admin / Librarian | View overdue books         |

> The exact available endpoints should always be treated as defined by the backend route implementation.

---

# 🗄️ Core Data Model

The application is built around several related entities.

```text
User
 │
 ├──────────────► Library Card
 │
 ├──────────────► Borrow
 │                    │
 │                    ├────► Book
 │                    │
 │                    └────► Fine
 │
 └──────────────► Reservation


Book
 │
 ├────► Author
 ├────► Category
 ├────► Publisher
 └────► Physical Copies / Inventory
```

### Users

Typical information:

```text
name
email
passwordHash
role
phone
membershipStatus
activeLoansCount
```

### Books

Typical information:

```text
title
author
isbn
category / genre
publisher
publishedYear
edition
availableCopies
totalCopies
rackNumber
status
```

### Borrow Transactions

Typical information:

```text
bookId
userId
issuedBy
issueDate
dueDate
returnDate
status
fineAmount
finePaid
```

The exact fields depend on the current Mongoose models.

---

# 🔒 Security

The backend should follow these security practices:

### Password Hashing

Passwords must never be stored as plain text.

Use the project's configured password hashing implementation such as bcrypt/bcryptjs.

### JWT Authentication

JWT tokens should:

- Be signed with a secure secret
- Have an expiration time
- Be validated on protected requests
- Never expose sensitive authentication data

### Input Validation

Validate incoming request data before database operations.

Validation should cover:

- Required fields
- Data types
- String lengths
- Email format
- Numeric ranges
- Enum values
- IDs
- Business rules

### HTTP Security

Use appropriate security middleware such as:

- Helmet
- CORS
- Rate limiting
- Centralized error handling
- Request validation
- Sanitization

### Environment Variables

Never commit:

```text
.env
```

or production credentials/secrets to source control.

Use:

```text
.env.example
```

for documenting required environment variables.

---

# 🧪 Development

Recommended development workflow:

```text
1. Start MongoDB
       ↓
2. Start Backend
       ↓
3. Start Frontend
       ↓
4. Run Seeder if required
       ↓
5. Login with development admin
       ↓
6. Test application workflows
```

Before committing changes:

```bash
git status
```

Review changed files and ensure:

- No secrets are committed
- `.env` is ignored
- Debug code is removed
- API changes are documented
- Database changes are tested

---

# 🐛 Troubleshooting

## MongoDB Connection Error

Check:

```env
MONGODB_URI=mongodb://localhost:27017/library_management_db
```

Make sure MongoDB is running.

---

## Frontend Cannot Reach Backend

Verify:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Also verify that the backend is running on port `5000`.

---

## CORS Error

Verify:

```env
CLIENT_URL=http://localhost:5173
```

The configured frontend origin must match the actual frontend URL.

---

## Login Fails

Check:

1. Database connection
2. Seeded admin account
3. Password hashing
4. JWT configuration
5. Backend authentication route
6. User role
7. Browser network requests

For development, reseeding the database can recreate the clean admin account.

---

# 📈 Roadmap

Planned improvements include:

- [ ] Automated overdue email notifications
- [ ] Barcode scanning using device camera
- [ ] QR-based library card
- [ ] Online fine payment
- [ ] Razorpay / Stripe integration
- [ ] E-book support
- [ ] Digital reader
- [ ] Advanced analytics
- [ ] Automated reservation notifications
- [ ] Fine payment history
- [ ] Improved audit logging
- [ ] Advanced inventory tracking

---

# 🤝 Contributing

Contributions, bug reports, and feature requests are welcome.

### Development Flow

```bash
git checkout -b feature/your-feature
```

Make your changes and test them.

Then:

```bash
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

Open a Pull Request with:

- Clear description
- Screenshots where relevant
- Testing information
- Database/model changes if applicable
- API changes if applicable

---

# 📄 License

This project is distributed under the **MIT License**.

See the `LICENSE` file for complete license information.

---

# 👨‍💻 Project Status

The project is structured as a full-stack MERN application with separate frontend and backend applications.

```text
Frontend
React + Vite

        ↕ REST API

Backend
Node.js + Express

        ↕

Database
MongoDB + Mongoose
```

For architecture diagrams, workflows, API specifications, and additional technical documentation, refer to the `docs/` directory.

---

## ⭐ Development Credentials

For local development only:

```text
Admin Email:    admin@gmail.com
Admin Password: admin123
```

**Do not use these credentials in production.**
