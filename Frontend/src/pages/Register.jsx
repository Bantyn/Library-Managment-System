import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    phone: '',
  });

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword, studentId, phone } = formData;

    if (!name.trim() || !email.trim() || !password || !studentId.trim()) {
      setError('Please fill in all mandatory fields (Name, Email, Password, Student ID).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (captchaId && !captchaAnswer.trim()) {
      setError('Please enter the security verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        studentId: studentId.trim(),
        phone: phone.trim(),
        captchaId,
        captchaAnswer: captchaAnswer.trim(),
      });
      navigate('/my-books');
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Registration failed. Please check inputs.'
      );
      loadCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6">
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
                  <h4 className="fw-bold text-dark mb-1">Student Registration</h4>
                  <p className="text-muted small">
                    Create your student library account to borrow books, obtain your 12-digit Digital Pass, and access catalog services
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center small py-2 px-3 mb-4" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-2 flex-shrink-0"></i>
                    <div>{error}</div>
                  </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="regName" className="form-label small fw-medium text-secondary">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="regName"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label htmlFor="regStudentId" className="form-label small fw-medium text-secondary">
                        Student ID / Roll No <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="regStudentId"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        placeholder="e.g. STU1042"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label htmlFor="regPhone" className="form-label small fw-medium text-secondary">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="regPhone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="regEmail" className="form-label small fw-medium text-secondary">
                        Student Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="regEmail"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="rahul@example.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label htmlFor="regPassword" className="form-label small fw-medium text-secondary">
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="regPassword"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label htmlFor="regConfirm" className="form-label small fw-medium text-secondary">
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="regConfirm"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat password"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Visual SVG CAPTCHA Verification */}
                    {captchaSvg && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded border">
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
                            Enter the 5 characters shown above.
                          </small>
                        </div>
                      </div>
                    )}

                    <div className="col-12 mt-4">
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
                        {isSubmitting ? 'Creating Account...' : 'Register Library Account'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Footer link */}
                <div className="text-center mt-4 pt-3 border-top small text-muted">
                  Already registered?{' '}
                  <Link to="/login" className="fw-semibold text-primary text-decoration-none">
                    Sign In Here
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

export default Register;
