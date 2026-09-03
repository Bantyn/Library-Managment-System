import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Route Guards
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import AddBook from './pages/AddBook';
import EditBook from './pages/EditBook';
import BookDetails from './pages/BookDetails';
import Categories from './pages/Categories';
import Members from './pages/Members';
import MemberDetails from './pages/MemberDetails';
import Issues from './pages/Issues';
import IssueBook from './pages/IssueBook';
import OverdueBooks from './pages/OverdueBooks';
import Purchases from './pages/Purchases';
import FinePayments from './pages/FinePayments';
import Inventory from './pages/Inventory';
import InventoryDetails from './pages/InventoryDetails';
import InventoryReports from './pages/InventoryReports';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Books Management */}
          <Route path="/books" element={<Books />} />
          <Route path="/books/add" element={<AddBook />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/books/:id/edit" element={<EditBook />} />

          {/* Categories Management */}
          <Route path="/categories" element={<Categories />} />

          {/* Members Management */}
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetails />} />

          {/* Issues & Circulation */}
          <Route path="/issues" element={<Issues />} />
          <Route path="/issues/issue-book" element={<IssueBook />} />
          <Route path="/issues/overdue" element={<OverdueBooks />} />

          {/* Financials & Razorpay (Phase 5) */}
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/fine-payments" element={<FinePayments />} />

          {/* Advanced Inventory Management (Phase 7) */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:bookId" element={<InventoryDetails />} />
          <Route path="/inventory/reports" element={<InventoryReports />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
