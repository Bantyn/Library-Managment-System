import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2">
      <div className="container">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center fw-bold text-primary">
          <img src="/library-logo.png" alt="PustakSetu Logo" width="32" height="32" className="me-2" />
          <span>PustakSetu</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link px-3 ${isActive ? 'text-primary fw-semibold active' : 'text-secondary'}`
                }
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/books"
                className={({ isActive }) =>
                  `nav-link px-3 ${isActive ? 'text-primary fw-semibold active' : 'text-secondary'}`
                }
              >
                Books Catalog
              </NavLink>
            </li>

            {/* Authenticated Student Navigation */}
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink
                    to="/my-books"
                    className={({ isActive }) =>
                      `nav-link px-3 ${isActive ? 'text-primary fw-semibold active' : 'text-secondary'}`
                    }
                  >
                    My Borrowed Books
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/my-purchases"
                    className={({ isActive }) =>
                      `nav-link px-3 ${isActive ? 'text-primary fw-semibold active' : 'text-secondary'}`
                    }
                  >
                    My Purchases
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `nav-link px-3 ${isActive ? 'text-primary fw-semibold active' : 'text-secondary'}`
                    }
                  >
                    My Profile
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* Right-Side Authentication Actions */}
          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                <Link
                  to="/profile"
                  className="d-flex align-items-center text-decoration-none text-dark"
                >
                  <div
                    className="bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold border border-warning"
                    style={{ width: '34px', height: '34px', fontSize: '13px' }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="small fw-medium d-none d-sm-inline">{user?.name}</span>
                </Link>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-sm btn-outline-secondary px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary px-3">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
