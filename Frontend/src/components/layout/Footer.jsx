import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <footer className="bg-white border-top mt-auto pt-5 pb-4">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* ===============================================================
              COLUMN 1 — BRAND & INTRO
              =============================================================== */}
          <div className="col-12 col-md-4 col-lg-4">
            <div className="d-flex align-items-center mb-3">
              <img
                src="/library-logo.png"
                alt="PustakSetu Emblem"
                width="30"
                height="30"
                className="me-2"
              />
              <span className="fw-bold fs-5 text-dark">PustakSetu</span>
            </div>
            <p className="text-secondary small mb-3" style={{ lineHeight: '1.6', maxWidth: '320px' }}>
              Smart Library Management System. A modern, centralized platform for discovering books,
              managing circulation, and accessing campus learning resources.
            </p>
            <div className="d-inline-flex align-items-center small text-muted bg-light px-2 py-1 rounded border">
              <span className="badge bg-success p-1 rounded-circle me-2" style={{ width: '8px', height: '8px' }}></span>
              <span>Central Catalog Live</span>
            </div>
          </div>

          {/* ===============================================================
              COLUMN 2 — QUICK LINKS
              =============================================================== */}
          <div className="col-6 col-sm-4 col-md-2 col-lg-2">
            <h6 className="fw-bold text-dark mb-3 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Quick Links
            </h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              <li>
                <Link to="/" className="text-secondary text-decoration-none hover-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/books" className="text-secondary text-decoration-none hover-primary">
                  Books Catalog
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link to="/my-books" className="text-secondary text-decoration-none hover-primary">
                      My Books
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="text-secondary text-decoration-none hover-primary">
                      Student Profile
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* ===============================================================
              COLUMN 3 — LIBRARY SERVICES
              =============================================================== */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <h6 className="fw-bold text-dark mb-3 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Library Services
            </h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              <li>
                <Link to="/books" className="text-secondary text-decoration-none hover-primary">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/books" className="text-secondary text-decoration-none hover-primary">
                  Available Shelf Stock
                </Link>
              </li>
              <li>
                {isAuthenticated ? (
                  <Link to="/profile" className="text-secondary text-decoration-none hover-primary">
                    Digital Library Card
                  </Link>
                ) : (
                  <Link to="/register" className="text-secondary text-decoration-none hover-primary">
                    Get Library Card
                  </Link>
                )}
              </li>
              <li>
                <span className="text-muted" title="Standard 14-day student book checkout policy">
                  14-Day Loan Policy
                </span>
              </li>
            </ul>
          </div>

          {/* ===============================================================
              COLUMN 4 — ACCOUNT & ACCESS
              =============================================================== */}
          <div className="col-12 col-sm-4 col-md-3 col-lg-3">
            <h6 className="fw-bold text-dark mb-3 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Account Access
            </h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/profile" className="text-secondary text-decoration-none hover-primary">
                      <i className="bi bi-person me-1 text-muted"></i> My Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-books" className="text-secondary text-decoration-none hover-primary">
                      <i className="bi bi-journal-check me-1 text-muted"></i> My Borrowed Books
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn btn-link p-0 text-danger text-decoration-none small d-inline-flex align-items-center"
                    >
                      <i className="bi bi-box-arrow-right me-1"></i> Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="text-secondary text-decoration-none hover-primary">
                      <i className="bi bi-box-arrow-in-right me-1 text-muted"></i> Student Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-secondary text-decoration-none hover-primary">
                      <i className="bi bi-person-plus me-1 text-muted"></i> Register Library Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* ===============================================================
            FOOTER BOTTOM BAR
            =============================================================== */}
        <div className="pt-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small text-secondary">
          <div>
            © {new Date().getFullYear()} <strong>PustakSetu</strong>. All rights reserved.
          </div>
          <div className="text-muted" style={{ fontSize: '12px' }}>
            <i className="bi bi-book me-1 text-secondary"></i>
            Smart Library Management System
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
