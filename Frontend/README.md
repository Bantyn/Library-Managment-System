# 🎓 Library Management System — Student Portal (Phase 3)

A modern, responsive, and student-focused web portal for the **Bachelor-Level Library Management System**, built with **React**, **Vite**, and **Bootstrap 5**.

---

## 🚀 Key Features

- **Public Books Discovery**: Browse academic titles with real-time stock availability badges.
- **Combined Search & Filtering**: Multi-field search (title, author, ISBN) seamlessly integrated with subject category filters and server-side pagination.
- **Book Details & Shelf Navigation**: Complete catalog metadata, summaries, and physical rack/shelf guidance for locating books on campus.
- **Student Authentication**:
  - Secure self-registration restricted strictly to `student` accounts.
  - Role-protected sign-in preventing administrator access to the student interface.
  - Session auto-restoration via JWT.
- **My Borrowed Books Dashboard**:
  - **Currently Borrowed**: Tracks active book loans, calculates days overdue, and displays return deadlines.
  - **Borrowing History**: Complete log of returned books and past late fines.
- **Student Profile**: Membership card view with Student ID, active loan counts, and library circulation rules.

---

## 🛠️ Technology Stack & Styling Architecture

- **Framework**: React 18+
- **Bundler**: Vite (Runs on port `5174`)
- **Routing**: React Router DOM v6
- **UI & Styling**: **Bootstrap 5** + **Bootstrap Icons** (STRICTLY ZERO Tailwind CSS)
- **HTTP Client**: Axios with automatic JWT interceptors
- **State Management**: React Context API (`AuthContext`)

---

## 📂 Directory Structure

```text
Frontend/
├── src/
│   ├── components/
│   │   ├── layout/             # Navbar, Footer, UserLayout
│   │   ├── common/             # Loading, ErrorMessage, EmptyState, Pagination
│   │   ├── books/              # BookCard, BookGrid, BookSearch, CategoryFilter
│   │   └── profile/            # BorrowingTable
│   ├── pages/                  # Home, Books, BookDetails, Login, Register, MyBooks, Profile, NotFound
│   ├── services/               # api.js, authService, bookService, categoryService, issueService
│   ├── context/                # AuthContext.jsx
│   ├── routes/                 # ProtectedRoute.jsx
│   ├── utils/                  # formatDate.js
│   ├── App.jsx                 # Routing hierarchy
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
# 1. Navigate to Frontend folder
cd Frontend

# 2. Install dependencies
npm install

# 3. Start development server (Port 5174)
npm run dev

# 4. Production build
npm run build
```

The portal runs on `http://localhost:5174`.
