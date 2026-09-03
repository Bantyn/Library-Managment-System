import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/my-books" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your student email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/my-books');
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <img
                    src="/library-logo.png"
                    alt="Campus Library Logo"
                    width="60"
                    height="60"
                    className="mb-2"
                  />
                  <h4 className="fw-bold text-dark mb-1">Student Sign In</h4>
                  <p className="text-muted small">
                    Access your active book loans, due dates, and circulation history
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center small py-2 px-3 mb-4" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-2 flex-shrink-0"></i>
                    <div>{error}</div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="studentEmail" className="form-label small fw-medium text-secondary">
                      Student Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-envelope text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0"
                        id="studentEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="studentPassword" className="form-label small fw-medium text-secondary">
                      Account Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0"
                        id="studentPassword"
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
                    {isSubmitting ? 'Signing In...' : 'Sign In to Account'}
                  </button>
                </form>

                {/* Footer link */}
                <div className="text-center mt-4 pt-3 border-top small text-muted">
                  Don't have a library account yet?{' '}
                  <Link to="/register" className="fw-semibold text-primary text-decoration-none">
                    Register Here
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
