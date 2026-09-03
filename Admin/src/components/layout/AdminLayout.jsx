import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-wrapper d-flex min-vh-100 bg-light">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Container */}
      <div className="main-content-wrapper flex-grow-1 d-flex flex-column" style={{ marginLeft: '0' }}>
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="flex-grow-1 p-3 p-md-4">
          <Outlet />
        </main>

        <footer className="py-3 px-4 border-top bg-white text-center text-muted small">
          © {new Date().getFullYear()} PustakSetu — Library Management System
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
