import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { memberService } from '../services/memberService';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await memberService.getMembers({
        search: searchTerm,
        isActive: statusFilter,
      });
      if (res.success) {
        setMembers(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load member records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleToggleStatus = async (member) => {
    const newStatus = !member.isActive;
    setActionInProgressId(member._id);
    setError('');
    try {
      const res = await memberService.updateMember(member._id, { isActive: newStatus });
      if (res.success) {
        setSuccessMessage(
          `Account for "${member.name}" was ${newStatus ? 'activated' : 'deactivated'} successfully.`
        );
        fetchMembers();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update member status.'
      );
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Student Members</h3>
          <p className="text-muted small mb-0">
            View registered student library profiles, track loan privileges, and manage account statuses
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{successMessage}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchMembers} />}

      {/* Filter & Search Bar */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search members by name, Student ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Members</option>
                <option value="false">Deactivated Members</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-2">
              <button type="submit" className="btn btn-outline-primary w-100">
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Members Table */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading member records..." />
          ) : members.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '15%' }}>Student ID</th>
                    <th scope="col" style={{ width: '25%' }}>Student Name</th>
                    <th scope="col" style={{ width: '25%' }}>Email Address</th>
                    <th scope="col" style={{ width: '15%' }}>Phone</th>
                    <th scope="col" className="text-center" style={{ width: '10%' }}>Status</th>
                    <th scope="col" className="text-end" style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <code className="text-dark bg-light px-2 py-1 rounded fw-medium">
                          {member.studentId || 'N/A'}
                        </code>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{member.name}</div>
                      </td>
                      <td className="text-secondary small">{member.email}</td>
                      <td className="text-secondary small">{member.phone || '—'}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            member.isActive
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            to={`/members/${member._id}`}
                            className="btn btn-outline-primary"
                            title="View Profile & Borrowing History"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <button
                            type="button"
                            className={`btn ${
                              member.isActive ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                            title={member.isActive ? 'Deactivate Member' : 'Activate Member'}
                            onClick={() => handleToggleStatus(member)}
                            disabled={actionInProgressId === member._id}
                          >
                            {actionInProgressId === member._id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : member.isActive ? (
                              <i className="bi bi-person-x"></i>
                            ) : (
                              <i className="bi bi-person-check"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-people"
              title="No student members found"
              description={
                searchTerm || statusFilter
                  ? 'No members match the current filter criteria.'
                  : 'Students can register through the student portal.'
              }
              actionText={searchTerm || statusFilter ? 'Reset Filter' : null}
              onAction={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;
