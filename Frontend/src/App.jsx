import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout & Route Guard
import UserLayout from './components/layout/UserLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBooks from './pages/MyBooks';
import MyPurchases from './pages/MyPurchases';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/my-books" element={<MyBooks />} />
          <Route path="/my-purchases" element={<MyPurchases />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
