import React, { useState, useEffect } from 'react';
import { issueService } from '../services/issueService';
import { formatDate } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';

const OverdueBooks = () => {
  const [overdueIssues, setOverdueIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Return modal state
  const [issueToReturn, setIssueToReturn] = useState(null);
  const [isReturning, setIsReturning] = useState(false);

  const fetchOverdue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await issueService.getOverdueIssues();
      if (res.success) {
        setOverdueIssues(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load overdue books. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const handleReturnPrompt = (issue) => {
    setIssueToReturn(issue);
  };

  const handleConfirmReturn = async () => {
    if (!issueToReturn) return;
    setIsReturning(true);
    setError('');
    try {
      const res = await issueService.returnBook(issueToReturn._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Book returned and late fine logged.');
        setIssueToReturn(null);
        fetchOverdue();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return.');
      setIssueToReturn(null);
    } finally {
      setIsReturning(false);
    }
  };

  const calculateDaysOverdue = (dueDate) => {
    const diff = new Date() - new Date(dueDate);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Overdue Loans</h3>
          <p className="text-muted small mb-0">
            Monitor delayed returns, track outstanding late fees, and process returns
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

      {error && <ErrorMessage message={error} onRetry={fetchOverdue} />}

      {/* Overdue Table Card */}
      <div className="card border shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-semibold text-danger d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Active Overdue Book Loans
          </span>
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
            {overdueIssues.length} overdue
          </span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Auditing overdue records..." />
          ) : overdueIssues.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '4%' }}>#</th>
                    <th scope="col" style={{ width: '28%' }}>Book Title</th>
                    <th scope="col" style={{ width: '24%' }}>Borrower Student</th>
                    <th scope="col" style={{ width: '12%' }}>Due Date</th>
                    <th scope="col" style={{ width: '14%' }}>Days Overdue</th>
                    <th scope="col" style={{ width: '10%' }}>Est. Fine</th>
                    <th scope="col" className="text-end" style={{ width: '8%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueIssues.map((issue, idx) => {
                    const daysOverdue = calculateDaysOverdue(issue.dueDate);
                    const estimatedFine = daysOverdue * 5;

                    return (
                      <tr key={issue._id}>
                        <td className="text-muted small">{idx + 1}</td>
                        <td>
                          <div className="fw-semibold text-dark">
                            {issue.book?.title || 'Unknown Title'}
                          </div>
                          <span className="text-muted small">
                            ISBN: {issue.book?.isbn} • Shelf: {issue.book?.shelfLocation || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium text-dark">{issue.student?.name}</div>
                          <span className="text-muted small">
                            ID: {issue.student?.studentId} • {issue.student?.phone || 'No phone'}
                          </span>
                        </td>
                        <td className="text-danger fw-medium small">
                          {formatDate(issue.dueDate)}
                        </td>
                        <td>
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            <i className="bi bi-clock-history me-1"></i>
                            Overdue — {daysOverdue} day{daysOverdue > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="fw-bold text-danger">₹{estimatedFine}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success text-nowrap"
                            onClick={() => handleReturnPrompt(issue)}
                          >
                            Return
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-shield-check"
              title="No overdue books"
              description="Excellent! All borrowed books have either been returned or are within their designated loan windows."
            />
          )}
        </div>
      </div>

      {/* Return Modal */}
      <ConfirmModal
        isOpen={Boolean(issueToReturn)}
        title="Process Overdue Return"
        message={`Confirm return for "${issueToReturn?.book?.title}" borrowed by ${issueToReturn?.student?.name}? The system will calculate late fees based on the overdue duration.`}
        confirmText="Confirm Overdue Return"
        confirmVariant="success"
        isLoading={isReturning}
        onConfirm={handleConfirmReturn}
        onCancel={() => setIssueToReturn(null)}
      />
    </div>
  );
};

export default OverdueBooks;
