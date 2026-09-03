import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('admin@library.com');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated as admin, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          {/* Brand & Header */}
          <div className="text-center mb-4">
            <img
              src="/library-logo.png"
              alt="Library Admin Logo"
              width="64"
              height="64"
              className="mb-2"
            />
            <h4 className="fw-bold text-dark mb-1">Library Admin Portal</h4>
            <p className="text-muted small mb-0">
              Sign in to manage catalog, members, and book circulation
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center small py-2 px-3 mb-4" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2 flex-shrink-0"></i>
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label small fw-medium text-secondary">
                Admin Email
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-envelope text-muted"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0"
                  id="loginEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@library.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="loginPassword" className="form-label small fw-medium text-secondary">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-muted"></i>
                </span>
                <input
                  type="password"
                  className="form-control border-start-0"
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-medium d-flex align-items-center justify-content-center"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Note */}
          <div className="mt-4 p-3 bg-light rounded text-center small text-muted border">
            <div className="fw-semibold text-secondary mb-1">
              <i className="bi bi-info-circle me-1 text-primary"></i>
              Academic Project Demo
            </div>
            <div>
              Email: <code>admin@library.com</code>
            </div>
            <div>
              Password: <code>admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
