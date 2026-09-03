import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand bg-white border-bottom sticky-top px-3 py-2">
      <div className="container-fluid p-0">
        {/* Mobile Toggle Button */}
        <button
          className="btn btn-sm btn-outline-secondary d-md-none me-2"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        {/* System Title & Logo */}
        <div className="d-flex align-items-center">
          <img
            src="/library-logo.png"
            alt="Library Logo"
            width="30"
            height="30"
            className="me-2"
          />
          <span className="navbar-text fw-semibold text-dark d-none d-sm-inline">
            Library Management Portal
          </span>
        </div>

        {/* User profile & Actions */}
        <div className="ms-auto d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <div
              className="bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold border border-warning"
              style={{ width: '36px', height: '36px', fontSize: '14px' }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="d-none d-md-block text-start">
              <div className="small fw-semibold text-dark">{user?.name || 'Administrator'}</div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Admin
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-light border text-danger d-flex align-items-center"
            title="Logout"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
