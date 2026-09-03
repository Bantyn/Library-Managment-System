import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fineService } from '../services/fineService';
import { formatDate } from '../utils/formatDate';

const Profile = () => {
  const { user, logout } = useAuth();
  const [outstandingFine, setOutstandingFine] = useState(0);

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

  return (
    <div className="py-4">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="mb-4">
          <h3 className="fw-bold text-dark mb-1">Student Library Profile</h3>
          <p className="text-muted small mb-0">
            Your university library membership, circulation credentials, and penalty status
          </p>
        </div>

        {/* Profile Card */}
        <div className="card border shadow-sm mb-4">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-column flex-sm-row align-items-center mb-4 text-center text-sm-start">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mb-3 mb-sm-0 me-sm-4 fw-bold fs-3"
                style={{ width: '70px', height: '70px' }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h4 className="fw-bold text-dark mb-1">{user?.name}</h4>
                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start align-items-center">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    Enrolled Student Member
                  </span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Borrowing Privileges Active
                  </span>
                  {outstandingFine > 0 ? (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                      Outstanding Fine: ₹{outstandingFine}
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border">
                      Outstanding Fine: ₹0 (No Penalties)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* Profile Info Details Grid */}
            <h6 className="fw-bold text-dark mb-3">Membership Credentials</h6>
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small d-block">Student ID / Roll Number</span>
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
                <span className="text-muted small d-block">Membership Established</span>
                <span className="text-secondary">{formatDate(user?.createdAt)}</span>
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
                <i className="bi bi-shield-check text-primary me-1"></i> Library Rules & Privileges
              </h6>
              <ul className="mb-0 ps-3 mt-2">
                <li>Books can be borrowed for a maximum duration of 14 days per loan.</li>
                <li>Ensure books are returned or renewed before the due date to avoid late charges.</li>
                <li>Overdue fees accumulate at ₹5.00 per late day and can be paid online via Razorpay.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links & Sign out */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
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
