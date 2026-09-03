import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatDate';

const Settings = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">System Settings & Profile</h3>
        <p className="text-muted small mb-0">
          Admin account credentials and core system parameters
        </p>
      </div>

      <div className="row g-4" style={{ maxWidth: '850px' }}>
        {/* Profile Card */}
        <div className="col-12">
          <div className="card border shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                <i className="bi bi-person-badge me-2 text-primary"></i>
                Administrator Profile
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold fs-4"
                  style={{ width: '60px', height: '60px' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
                  <div className="d-flex gap-2 align-items-center">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      System Administrator
                    </span>
                    <span className="text-muted small">
                      Registered on {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row g-3 border-top pt-3">
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Admin Email</span>
                  <span className="fw-medium text-dark">{user?.email}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Role Permissions</span>
                  <span className="fw-medium text-success">Full System Access (Read / Write / Delete)</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Contact Phone</span>
                  <span className="text-secondary">{user?.phone || 'Not configured'}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Account Status</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Configuration Specs */}
        <div className="col-12">
          <div className="card border shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold text-dark d-flex align-items-center">
                <i className="bi bi-sliders me-2 text-secondary"></i>
                System Configuration Parameters
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Backend API Base URL</span>
                  <code>{import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</code>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Overdue Penalty Rate</span>
                  <span className="fw-medium text-dark">₹5.00 per late day</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Default Loan Duration</span>
                  <span className="fw-medium text-dark">14 Calendar Days</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Security Architecture</span>
                  <span className="fw-medium text-dark">Stateless JWT + bcrypt Salted Hashing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Session Actions */}
        <div className="col-12">
          <div className="card border shadow-sm">
            <div className="card-body p-4 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-semibold text-dark mb-1">Sign Out of Admin Portal</h6>
                <p className="text-muted small mb-0">
                  Terminates your current administrator session and clears local credentials.
                </p>
              </div>
              <button type="button" className="btn btn-outline-danger" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1"></i> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
