import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { memberService } from '../services/memberService';
import { fineService } from '../services/fineService';
import { formatDate, formatDateTime } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const MemberDetails = () => {
  const { id } = useParams();

  const [member, setMember] = useState(null);
  const [issues, setIssues] = useState([]);
  const [finePayments, setFinePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Collect cash fine modal state
  const [fineIssueToCollect, setFineIssueToCollect] = useState(null);
  const [isCollectingFine, setIsCollectingFine] = useState(false);

  const fetchMemberData = async () => {
    setLoading(true);
    setError('');
    try {
      const [memberRes, issuesRes, finesRes] = await Promise.all([
        memberService.getMemberById(id),
        memberService.getMemberIssues(id),
        fineService.getAllFines(),
      ]);

      if (memberRes.success) setMember(memberRes.data);
      if (issuesRes.success) setIssues(issuesRes.data || []);
      if (finesRes.success) {
        // Filter fine payments belonging to this student
        const studentFines = (finesRes.data || []).filter(
          (f) => f.student?._id === id || f.student === id
        );
        setFinePayments(studentFines);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load member profile and circulation records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const handleCollectFineConfirm = async () => {
    if (!fineIssueToCollect) return;
    setIsCollectingFine(true);
    setError('');
    try {
      const res = await fineService.collectCashFine(fineIssueToCollect._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Fine settled in cash successfully.');
        setFineIssueToCollect(null);
        fetchMemberData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to collect fine.');
      setFineIssueToCollect(null);
    } finally {
      setIsCollectingFine(false);
    }
  };

  if (loading) {
    return <Loading message="Loading member profile & borrowing history..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMemberData} />;
  }

  if (!member) return null;

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/members" className="text-decoration-none">
              Members
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {member.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">{member.name}</h3>
          <p className="text-muted small mb-0">Student Profile, Circulation History & Fine Records</p>
        </div>
        <Link to="/issues/issue-book" className="btn btn-primary btn-sm d-flex align-items-center">
          <i className="bi bi-journal-plus me-1"></i> Issue Book to this Member
        </Link>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
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

      <div className="row g-4 mb-4">
        {/* Profile Card */}
        <div className="col-12 col-lg-4">
          <div className="card border shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold text-dark">Member Profile</h5>
            </div>
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <div
                  className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3 fs-3 fw-bold border border-primary-subtle"
                  style={{ width: '64px', height: '64px' }}
                >
                  {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <h5 className="fw-bold text-dark mb-1">{member.name}</h5>
                <span className="badge bg-light text-dark border px-2 py-1">
                  ID: {member.studentId || 'N/A'}
                </span>
              </div>

              <ul className="list-group list-group-flush border-top">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted small">Account Status</span>
                  <span
                    className={`badge ${
                      member.isActive
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted small">Email Address</span>
                  <span className="text-secondary small">{member.email}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted small">Phone</span>
                  <span className="text-secondary small">{member.phone || '—'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted small">Registered On</span>
                  <span className="text-secondary small">{formatDate(member.createdAt)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted small">Active Borrowings</span>
                  <span className="badge bg-primary rounded-pill">
                    {member.activeLoansCount || 0}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Borrowing History */}
        <div className="col-12 col-lg-8">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-semibold text-dark">Circulation & Borrowing History</h5>
              <span className="badge bg-light text-secondary border">
                {issues.length} record(s)
              </span>
            </div>
            <div className="card-body p-0">
              {issues.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Book</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Fine</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((issue) => (
                        <tr key={issue._id}>
                          <td>
                            <div className="fw-medium text-dark">
                              {issue.book?.title || 'Unknown Title'}
                            </div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              ISBN: {issue.book?.isbn}
                            </span>
                          </td>
                          <td className="text-muted">{formatDate(issue.issueDate)}</td>
                          <td>
                            <span
                              className={
                                issue.status !== 'returned' &&
                                new Date(issue.dueDate) < new Date()
                                  ? 'text-danger fw-medium'
                                  : 'text-muted'
                              }
                            >
                              {formatDate(issue.dueDate)}
                            </span>
                          </td>
                          <td>
                            {issue.fine > 0 ? (
                              <span className="text-danger fw-bold">₹{issue.fine}</span>
                            ) : (
                              '₹0'
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                issue.status === 'returned'
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : new Date(issue.dueDate) < new Date()
                                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                  : 'bg-primary-subtle text-primary border border-primary-subtle'
                              }`}
                            >
                              {issue.status}
                            </span>
                          </td>
                          <td className="text-end">
                            {issue.fine > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setFineIssueToCollect(issue)}
                                title="Collect Fine in Cash"
                              >
                                Collect Fine
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="bi-journal-x"
                  title="No borrowing records"
                  description="This student has not borrowed any books yet."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fine & Payment History Section (Phase 5) */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold text-dark d-flex align-items-center">
            <i className="bi bi-cash-coin me-2 text-success"></i>
            Fine Settlement & Payment History
          </h5>
          <span className="badge bg-light text-secondary border">
            {finePayments.length} payment(s) recorded
          </span>
        </div>
        <div className="card-body p-0">
          {finePayments.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Book</th>
                    <th>Fine Paid</th>
                    <th>Payment Method</th>
                    <th>Date Settled</th>
                    <th>Status</th>
                    <th>Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  {finePayments.map((p) => (
                    <tr key={p._id}>
                      <td className="fw-medium text-dark">
                        {p.issue?.book?.title || 'Book Loan'}
                      </td>
                      <td className="fw-bold text-success">₹{p.amount}</td>
                      <td>
                        {p.paymentMethod === 'cash' ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Cash
                          </span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            Razorpay
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{formatDateTime(p.paidAt || p.createdAt)}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {p.status}
                        </span>
                      </td>
                      <td>
                        {p.collectedBy ? (
                          <span className="badge bg-light text-dark border">
                            {p.collectedBy.name || 'Admin'}
                          </span>
                        ) : (
                          <span className="text-muted">Online Gateway</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-muted small">
              No fine settlement records on file for this member.
            </div>
          )}
        </div>
      </div>

      {/* Collect Fine (Cash) Modal */}
      {fineIssueToCollect && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-cash-coin text-success me-2"></i> Collect Fine (Cash)
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setFineIssueToCollect(null)}
                  disabled={isCollectingFine}
                ></button>
              </div>
              <div className="modal-body">
                <div className="bg-light p-3 rounded mb-3 small">
                  <div className="mb-1">
                    <strong>Student:</strong> {member.name} (ID: {member.studentId})
                  </div>
                  <div className="mb-1">
                    <strong>Book:</strong> {fineIssueToCollect.book?.title}
                  </div>
                  <div className="mb-1 text-danger fw-bold fs-6">
                    Outstanding Fine: ₹{fineIssueToCollect.fine}
                  </div>
                </div>
                <p className="small text-muted mb-0">
                  Collect <strong>₹{fineIssueToCollect.fine}</strong> cash from the student. Click <strong>Mark as Paid</strong> to create a verified cash collection entry in the audit ledger.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setFineIssueToCollect(null)}
                  disabled={isCollectingFine}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleCollectFineConfirm}
                  disabled={isCollectingFine}
                >
                  {isCollectingFine ? 'Recording...' : 'Mark as Paid (Cash)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;
