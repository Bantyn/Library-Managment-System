import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fineService } from '../services/fineService';
import { formatDate } from '../utils/formatDate';

const Profile = () => {
  const { user, logout } = useAuth();
  const [outstandingFine, setOutstandingFine] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFines = async () => {
      try {
        const res = await fineService.getMyFines();
        if (res.success) {
          setOutstandingFine(res.data?.totalOutstanding || 0);
        }
      } catch (err) {
        console.error('Failed to query fines on profile:', err.message);
      }
    };
    fetchFines();
  }, []);

  const handleCopyId = () => {
    if (user?.libraryCardId) {
      navigator.clipboard.writeText(user.libraryCardId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const libraryCardNumber = user?.libraryCardId || '000000000001';

  return (
    <div className="py-4">
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2 no-print">
          <div>
            <h3 className="fw-bold text-dark mb-1">Student Library Profile & Pass</h3>
            <p className="text-muted small mb-0">
              University library membership credentials, digital borrowing pass, and circulation records
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm d-flex align-items-center"
            onClick={handlePrintCard}
          >
            <i className="bi bi-printer me-1"></i> Print Library Card
          </button>
        </div>

        {/* SECTION 1: DIGITAL LIBRARY CARD / PASS (PRINTABLE) */}
        <div className="mb-4 library-card-container print-card-section">
          <div className="digital-library-pass p-4">
            {/* Header with Logo */}
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <div className="d-flex align-items-center">
                <img
                  src="/library-logo.png"
                  alt="Library Logo"
                  width="36"
                  height="36"
                  className="me-2"
                />
                <div>
                  <h6 className="fw-bold text-dark mb-0" style={{ letterSpacing: '0.5px' }}>
                    CENTRAL CAMPUS LIBRARY
                  </h6>
                  <span className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Official Digital Student Pass
                  </span>
                </div>
              </div>
              <span className="badge bg-success text-white px-2 py-1 small">
                <i className="bi bi-shield-check me-1"></i> ACTIVE
              </span>
            </div>

            {/* Student Info & Photo Row */}
            <div className="row g-3 align-items-center mb-3">
              <div className="col-auto">
                <div
                  className="bg-primary text-dark rounded-3 d-flex align-items-center justify-content-center fw-bold fs-2 shadow-sm border border-warning"
                  style={{ width: '72px', height: '84px' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              <div className="col">
                <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
                <div className="text-muted small mb-1">
                  Student ID: <strong className="text-dark">{user?.studentId || 'N/A'}</strong>
                </div>
                <div className="text-muted small">
                  Email: {user?.email}
                </div>
              </div>
            </div>

            {/* 12-Digit Library Card Number Display */}
            <div className="text-center py-2 mb-3 bg-light rounded border">
              <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '1px', fontWeight: '600' }}>
                Centralized Library Card / Pass ID
              </div>
              <div className="d-flex justify-content-center align-items-center gap-2">
                <span className="card-number-display">{libraryCardNumber}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary no-print"
                  onClick={handleCopyId}
                  title="Copy 12-digit ID"
                >
                  {copied ? (
                    <i className="bi bi-check2 text-success"></i>
                  ) : (
                    <i className="bi bi-clipboard"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Barcode Visual Representation */}
            <div className="text-center mb-3">
              <div
                className="d-inline-flex justify-content-center align-items-end gap-1 px-3 py-1 bg-white border rounded"
                style={{ height: '36px', opacity: 0.85 }}
              >
                {[4, 2, 5, 3, 6, 2, 4, 3, 5, 2, 6, 4, 2, 5, 3, 6, 2, 4, 3, 5, 2, 4, 6, 3, 2, 5, 4].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      width: i % 3 === 0 ? '3px' : '2px',
                      height: `${h * 4.5}px`,
                      backgroundColor: '#212529',
                    }}
                  ></span>
                ))}
              </div>
              <div className="text-muted" style={{ fontSize: '9px', letterSpacing: '2px' }}>
                *{libraryCardNumber}*
              </div>
            </div>

            {/* Card Footer Metadata */}
            <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '10px' }}>
              <span>Issued: {formatDate(user?.createdAt)}</span>
              <span>Authorized Borrowing Privileges</span>
              <span>Expires: Annual Renewal</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: MEMBERSHIP PROFILE DETAILS (SCREEN ONLY) */}
        <div className="card border shadow-sm mb-4 no-print">
          <div className="card-body p-4">
            <h6 className="fw-bold text-dark mb-3">Membership Record & Contact Information</h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small d-block">12-Digit Library Card ID</span>
                <span className="fw-bold text-dark font-monospace fs-6">
                  <code>{libraryCardNumber}</code>
                </span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Institutional Student ID</span>
                <span className="fw-semibold text-dark fs-6">{user?.studentId || 'Not registered'}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Student Email Address</span>
                <span className="fw-medium text-dark">{user?.email}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Contact Phone</span>
                <span className="text-secondary">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Account Status</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  Active Member
                </span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Outstanding Penalty Balance</span>
                {outstandingFine > 0 ? (
                  <span className="fw-bold text-danger">₹{outstandingFine}</span>
                ) : (
                  <span className="text-success fw-medium">₹0 (Clear)</span>
                )}
              </div>
            </div>

            {outstandingFine > 0 && (
              <div className="alert alert-danger d-flex align-items-center justify-content-between mt-4 mb-0 py-2 px-3 small" role="alert">
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  You have an outstanding fine of <strong>₹{outstandingFine}</strong>.
                </div>
                <Link to="/my-books" className="btn btn-sm btn-danger text-nowrap">
                  Settle Online via Razorpay
                </Link>
              </div>
            )}

            <hr className="my-4" />

            {/* Circulation Guidelines */}
            <div className="bg-light p-3 rounded small text-secondary">
              <h6 className="fw-semibold text-dark mb-1">
                <i className="bi bi-shield-check text-primary me-1"></i> Library Rules & Card Usage
              </h6>
              <ul className="mb-0 ps-3 mt-2">
                <li>Present your 12-digit Library Card ID at the circulation desk when borrowing or returning books.</li>
                <li>Loans are valid for a duration of 14 days per issued copy.</li>
                <li>Late returns incur fees of ₹5.00 per day and can be cleared online via Razorpay.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 3: QUICK LINKS (SCREEN ONLY) */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 no-print">
          <div className="d-flex gap-2">
            <Link to="/my-books" className="btn btn-outline-primary">
              <i className="bi bi-journal-text me-1"></i> My Borrowed Books
            </Link>
            <Link to="/my-purchases" className="btn btn-outline-success">
              <i className="bi bi-bag-check me-1"></i> My Purchases
            </Link>
          </div>

          <button type="button" className="btn btn-outline-danger" onClick={logout}>
            <i className="bi bi-box-arrow-right me-1"></i> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
