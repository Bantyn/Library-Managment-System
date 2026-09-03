import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const res = await authService.getCaptcha();
      if (res.success) {
        setCaptchaId(res.captchaId);
        setCaptchaSvg(res.captchaSvg);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err.message);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

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

    if (captchaId && !captchaAnswer.trim()) {
      setError('Please enter the security verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password, captchaId, captchaAnswer.trim());
      navigate('/my-books');
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
      loadCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5">
            <div className="mb-3">
              <Link to="/" className="text-decoration-none text-secondary small d-inline-flex align-items-center">
                <i className="bi bi-arrow-left me-1"></i> Back to Home
              </Link>
            </div>
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <img
                    src="/library-logo.png"
                    alt="PustakSetu Logo"
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

                  <div className="mb-3">
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

                  {/* Visual SVG CAPTCHA Verification */}
                  {captchaSvg && (
                    <div className="mb-4 p-3 bg-light rounded border">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-medium text-secondary mb-0">
                          Security Verification
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-decoration-none p-0"
                          onClick={loadCaptcha}
                          disabled={loadingCaptcha}
                          title="Generate new challenge"
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div
                          dangerouslySetInnerHTML={{ __html: captchaSvg }}
                          className="d-flex align-items-center"
                          style={{ minHeight: '50px' }}
                        />
                        <input
                          type="text"
                          className="form-control font-monospace text-uppercase text-center fw-bold"
                          placeholder="Code"
                          maxLength="6"
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          required
                          disabled={isSubmitting}
                          style={{ letterSpacing: '2px', height: '50px' }}
                        />
                      </div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        Enter the characters shown above.
                      </small>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-medium d-flex align-items-center justify-content-center text-dark fw-semibold"
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
