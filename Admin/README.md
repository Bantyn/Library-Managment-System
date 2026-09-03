# 🛡️ Library Management System — Admin Panel (Phase 2)

A clean, responsive, and intuitive administration interface for the **Bachelor-Level Library Management System**, built with **React**, **Vite**, and **Bootstrap 5**.

---

## 🚀 Key Features

- **Admin Authentication**: Secure JWT login with session restoration (`/login`).
- **Protected Routing**: Robust route guarding via `ProtectedRoute` ensuring only authenticated administrators access system pages.
- **Executive Dashboard**: Real-time KPI cards (Total Books, Available Stock, Issued Copies, Registered Students, Overdue Count, Categories) plus recent issues and overdue tables.
- **Catalog Management**:
  - Full CRUD on books with multi-field search (`title`, `author`, `isbn`) and server-side pagination.
  - Category assignment and stock control.
  - Safe deletion safeguards preventing deletion of books with active borrowings.
- **Category Organization**: Add/Edit/Delete subject categories with book relationship validation.
- **Student Member Management**: Directory of registered students, account activation/deactivation toggle, and comprehensive individual borrowing history.
- **Book Circulation Engine**:
  - Issue books to active students with automatic stock deduction.
  - Process book returns with automatic late fee/fine calculation based on days overdue.
  - Dedicated overdue monitor identifying delayed loans and calculating outstanding fines.
- **System Settings**: Admin profile overview and environment parameters.

---

## 🛠️ Technology Stack & Styling Architecture

- **Framework**: React 18+
- **Bundler**: Vite
- **Router**: React Router DOM v6
- **UI & Styling**: **Bootstrap 5** + **Bootstrap Icons** (STRICTLY ZERO Tailwind CSS)
- **HTTP Client**: Axios with automatic JWT interceptors
- **State Management**: React Context API (`AuthContext`)

---

## 📂 Directory Structure

```text
Admin/
├── src/
│   ├── components/
│   │   ├── common/             # Loading, ErrorMessage, ConfirmModal, Pagination, EmptyState
│   │   ├── layout/             # Sidebar, Navbar, AdminLayout
│   │   └── books/              # BookForm, BookTable
│   ├── pages/                  # Login, Dashboard, Books, AddBook, EditBook, BookDetails,
│   │                           # Categories, Members, MemberDetails, Issues, IssueBook,
│   │                           # OverdueBooks, Settings
│   ├── services/               # api.js, authService, bookService, categoryService,
│   │                           # memberService, issueService, dashboardService
│   ├── context/                # AuthContext.jsx
│   ├── routes/                 # ProtectedRoute.jsx
│   ├── utils/                  # formatDate.js
│   ├── App.jsx                 # Routing tree
│   ├── main.jsx                # Bootstrap imports & entry
│   └── index.css               # Minimal custom layout CSS
├── .env.example
├── .env
├── index.html
├── package.json
└── vite.config.js
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Backend server running on `http://localhost:5000`

### Installation & Execution

```bash
# 1. Navigate to Admin folder
cd Admin

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Production build
npm run build
```

The portal runs on `http://localhost:5173`.

### Default Admin Login Credentials

- **Email**: `admin@library.com`
- **Password**: `admin123`
