import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-top py-4 mt-auto">
      <div className="container">
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-6 text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-1 text-primary fw-bold">
              <i className="bi bi-book me-2"></i>
              <span>Library Management System</span>
            </div>
            <p className="text-muted small mb-0">
              Bachelor of Computer Science / Information Technology Academic Capstone Project.
            </p>
          </div>
          <div className="col-12 col-md-6 text-center text-md-end">
            <div className="small text-secondary mb-1">
              <Link to="/" className="text-decoration-none text-muted me-3">Home</Link>
              <Link to="/books" className="text-decoration-none text-muted me-3">Books Catalog</Link>
              <Link to="/login" className="text-decoration-none text-muted">Student Login</Link>
            </div>
            <div className="text-muted" style={{ fontSize: '12px' }}>
              © {new Date().getFullYear()} Library Management System. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
