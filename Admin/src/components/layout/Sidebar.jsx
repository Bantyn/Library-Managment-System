import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/books', label: 'Books', icon: 'bi-book' },
    { to: '/inventory', label: 'Inventory', icon: 'bi-box-seam' },
    { to: '/categories', label: 'Categories', icon: 'bi-tags' },
    { to: '/members', label: 'Members', icon: 'bi-people' },
    { to: '/issues/issue-book', label: 'Issue Book', icon: 'bi-journal-plus' },
    { to: '/issues', label: 'Issued Books', icon: 'bi-journal-check', end: true },
    { to: '/issues/overdue', label: 'Overdue Books', icon: 'bi-exclamation-triangle' },
    { to: '/purchases', label: 'Purchases', icon: 'bi-bag-check' },
    { to: '/fine-payments', label: 'Fine Payments', icon: 'bi-cash-coin' },
    { to: '/inventory/reports', label: 'Inventory Reports', icon: 'bi-file-earmark-spreadsheet' },
    { to: '/settings', label: 'Settings', icon: 'bi-gear' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`sidebar bg-white border-end position-fixed top-0 start-0 h-100 d-flex flex-column ${
          isOpen ? 'sidebar-open' : ''
        }`}
        style={{ width: '250px', zIndex: 1045, transition: 'transform 0.3s ease-in-out' }}
      >
        {/* Brand Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center text-primary text-decoration-none fw-bold fs-5">
            <img src="/library-logo.png" alt="LibraryAdmin Logo" width="30" height="30" className="me-2" />
            <span>LibraryAdmin</span>
          </div>
          <button
            type="button"
            className="btn-close d-md-none"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>

        {/* Navigation Links */}
        <div className="flex-grow-1 overflow-y-auto py-3">
          <ul className="nav nav-pills flex-column px-2 gap-1">
            {navItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center py-2 px-3 rounded ${
                      isActive
                        ? 'active bg-primary text-dark fw-semibold'
                        : 'text-secondary hover-bg-light'
                    }`
                  }
                  onClick={onClose}
                >
                  <i className={`bi ${item.icon} me-3 fs-5`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-top">
          <button
            type="button"
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
