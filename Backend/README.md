# 📚 Library Management System — Backend API (Phase 1)

A clean, robust, and understandable RESTful API for a **Bachelor-Level Library Management System** built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Seeding Default Admin](#seeding-default-admin)
  - [Running the Server](#running-the-server)
- [System Roles & Access Control](#-system-roles--access-control)
- [API Endpoints Reference](#-api-endpoints-reference)
  - [Authentication](#authentication-apiauth)
  - [Books](#books-apibooks)
  - [Categories](#categories-apicategories)
  - [Members](#members-apimembers)
  - [Issues & Returns](#circulation--issues-apiissues--apireturns)
  - [Dashboard](#dashboard-apidashboard)
- [Core Business Rules](#-core-business-rules)
- [Automated API Testing](#-automated-api-testing)

---

## 🏛️ Overview & Architecture

The backend implements a classic, readable Express MVC pattern ideal for academic projects and viva explanations:

```text
HTTP Request
     │
     ▼
Route (`src/routes/`)
     │
     ▼
Middleware (`authMiddleware.js` / `adminMiddleware.js`)
     │
     ▼
Controller (`src/controllers/`)
     │
     ▼
Model (`src/models/`)
     │
     ▼
MongoDB Database
     │
     ▼
Standardized JSON Response (`{ success: true, message: "...", data: ... }`)
```

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose ODM
- **Authentication**: Stateless JSON Web Tokens (JWT)
- **Password Security**: Salted hashing via `bcryptjs`
- **Environment**: `dotenv`
- **CORS**: `cors`

---

## 📂 Project Directory Structure

```text
Backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, GetMe
│   │   ├── bookController.js      # Book CRUD, search & pagination
│   │   ├── categoryController.js  # Category CRUD
│   │   ├── memberController.js    # Member management & history
│   │   ├── issueController.js     # Book issue & overdue queries
│   │   ├── returnController.js    # Book return & fine calculation
│   │   └── dashboardController.js # Aggregated analytics & stats
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT token verification
│   │   ├── adminMiddleware.js     # Admin role verification
│   │   └── errorMiddleware.js     # Centralized error handler
│   ├── models/
│   │   ├── User.js                # User & student schema
│   │   ├── Book.js                # Book catalog schema
│   │   ├── Category.js            # Book category schema
│   │   └── Issue.js               # Circulation & loan schema
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── bookRoutes.js          # /api/books
│   │   ├── categoryRoutes.js      # /api/categories
│   │   ├── memberRoutes.js        # /api/members
│   │   ├── issueRoutes.js         # /api/issues
│   │   ├── returnRoutes.js        # /api/returns
│   │   └── dashboardRoutes.js     # /api/dashboard
│   ├── utils/
│   │   ├── generateToken.js       # JWT generator
│   │   └── seedAdmin.js           # Default admin creator
│   ├── app.js                     # Express app configuration
│   └── server.js                  # Server bootstrap & listener
├── test-api.js                    # Automated end-to-end test suite
├── .env.example                   # Environment variable template
├── .env                           # Local environment config
├── .gitignore                     # Git exclusions
├── package.json                   # Dependencies and scripts
└── README.md                      # Backend documentation
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017 or a MongoDB Atlas connection string.

### Installation

```bash
cd Backend
npm install
```

### Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/library_management
JWT_SECRET=bachelor_library_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
FINE_PER_DAY=5
```

| Variable | Description |
| :--- | :--- |
| `PORT` | The port on which the Express server listens (default: 5000) |
| `MONGO_URI` | MongoDB connection URI string |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens |
| `JWT_EXPIRES_IN`| Lifespan of the JWT (e.g., `7d` for 7 days) |
| `FINE_PER_DAY` | Fine amount in ₹ charged per day for overdue returns (default: 5) |

### Seeding Default Admin

The server will automatically create the initial admin account upon startup. You can also run the seeder manually:

```bash
npm run seed
```

**Default Admin Credentials:**
- **Email**: `admin@library.com`
- **Password**: `admin123`
*(Note: Change this password before public deployment)*

### Running the Server

```bash
# Development mode with auto-reload (nodemon)
npm run dev

# Standard production mode
npm start
```

---

## 👥 System Roles & Access Control

1. **Admin**:
   - Manage books (Create, Read, Update, Delete).
   - Manage categories (Create, Read, Update, Delete).
   - Manage student members (View, Update, Deactivate, Delete).
   - Issue books to students.
   - Process book returns and calculate late fines.
   - View system statistics on the Dashboard.

2. **Student**:
   - Register account (public registration is restricted to `student` role only).
   - Login and view personal profile (`/api/auth/me`).
   - Search and browse books catalog and categories.
   - View their own borrowed books and due dates (`/api/members/:id/issues`).

---

## 📡 API Endpoints Reference

Base URL: `http://localhost:5000/api`

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new student member |
| `POST` | `/api/auth/login` | Public | Login with email & password |
| `GET` | `/api/auth/me` | Private (All) | Get current authenticated user profile |

### Books (`/api/books`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | Public | List books (supports `?search=`, `?category=`, `?page=`, `?limit=`) |
| `GET` | `/api/books/:id` | Public | Get single book details with populated category |
| `POST` | `/api/books` | Admin | Add new book to catalog |
| `PUT` | `/api/books/:id` | Admin | Update book information & copies |
| `DELETE`| `/api/books/:id` | Admin | Delete book (safe check: rejects if copies currently issued) |

### Categories (`/api/categories`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all categories |
| `GET` | `/api/categories/:id` | Public | Get single category details |
| `POST` | `/api/categories` | Admin | Create a new category |
| `PUT` | `/api/categories/:id` | Admin | Update category name/description |
| `DELETE`| `/api/categories/:id` | Admin | Delete category (rejects if books belong to it) |

### Members (`/api/members`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/members` | Admin | List student members (supports `?search=`, `?isActive=`) |
| `GET` | `/api/members/:id` | Admin | Get member profile with active loans count |
| `PUT` | `/api/members/:id` | Admin | Update member details or toggle `isActive` |
| `DELETE`| `/api/members/:id` | Admin | Delete member (rejects if active loans exist) |
| `GET` | `/api/members/:id/issues` | Private (Admin/Self) | View member's borrowing history |

### Circulation & Issues (`/api/issues` & `/api/returns`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/issues` | Admin | Issue book to a student (`bookId`, `studentId`, `dueDate`) |
| `GET` | `/api/issues` | Admin | List all issues (supports `?status=`, `?student=`, `?book=`) |
| `GET` | `/api/issues/active` | Admin | List all currently active issues (`status: issued`) |
| `GET` | `/api/issues/overdue`| Admin | List all overdue issues (`dueDate < now` & not returned) |
| `GET` | `/api/issues/:id` | Private (Admin/Self) | Get single issue details |
| `PUT` | `/api/issues/:id/return` | Admin | Process book return and compute overdue fine |
| `PUT` | `/api/returns/:id` | Admin | Alias endpoint to process book return |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Admin | Get summary statistics, metrics, and recent activity logs |

---

## ⚖️ Core Business Rules

1. **Available Copies Management**:
   - Available copies cannot exceed total copies (`availableCopies <= totalCopies`).
   - A book cannot be issued if `availableCopies === 0`.
   - Issuing a book decrements `availableCopies` by 1.
   - Returning a book increments `availableCopies` by 1.
2. **Double Borrow Prevention**:
   - A student cannot have the same book issued twice concurrently.
3. **Account Status**:
   - Inactive/deactivated students (`isActive: false`) cannot borrow books.
4. **Security & Roles**:
   - Public registration (`POST /api/auth/register`) strictly sets `role: "student"`. Admin roles cannot be registered publicly.
   - Passwords are salted with bcrypt (10 rounds) and never returned in API responses.
5. **Overdue & Fine Calculation**:
   - Late fine is computed only upon book return:
     $$\text{Fine} = \max(0, \text{Days Overdue}) \times \text{FINE\_PER\_DAY (₹5)}$$

---

## 🧪 Automated API Testing

A self-contained automated test suite is included in `test-api.js`:

```bash
npm run test:api
```

This validates:
- [x] Admin login & token generation
- [x] Category CRUD
- [x] Book CRUD & search
- [x] Student registration & login
- [x] Role-based 403 authorization guard
- [x] Book issue workflow & stock decrement
- [x] Business constraints (preventing double issue & out-of-stock issue)
- [x] Book return workflow, stock restoration & fine calculation
- [x] Overdue detection
- [x] Dashboard metrics
