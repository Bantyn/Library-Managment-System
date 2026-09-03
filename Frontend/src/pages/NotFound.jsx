import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container py-5 text-center my-5">
      <div className="display-1 fw-bold text-primary mb-2">404</div>
      <h3 className="fw-bold text-dark mb-3">Page Not Found</h3>
      <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '450px' }}>
        The library resource or page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary px-4">
        <i className="bi bi-house me-1"></i> Return to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
