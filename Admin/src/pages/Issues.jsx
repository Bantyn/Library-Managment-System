import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { issueService } from '../services/issueService';
import { fineService } from '../services/fineService';
import { formatDate } from '../utils/formatDate';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);

  // Return modal state
  const [issueToReturn, setIssueToReturn] = useState(null);
  const [isReturning, setIsReturning] = useState(false);

  // Collect cash fine modal state
  const [fineIssueToCollect, setFineIssueToCollect] = useState(null);
  const [isCollectingFine, setIsCollectingFine] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await issueService.getIssues({
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });

      if (res.success) {
        setIssues(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalIssues(res.total || 0);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load circulation records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

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
        setSuccessMessage(res.message || 'Book returned successfully.');
        setIssueToReturn(null);
        fetchIssues();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to process book return.'
      );
      setIssueToReturn(null);
    } finally {
      setIsReturning(false);
    }
  };

  const handleCollectFineConfirm = async () => {
    if (!fineIssueToCollect) return;
    setIsCollectingFine(true);
    setError('');
    try {
      const res = await fineService.collectCashFine(fineIssueToCollect._id);
      if (res.success) {
        setSuccessMessage(res.message || 'Fine settled in cash successfully.');
        setFineIssueToCollect(null);
        fetchIssues();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to collect fine.'
      );
      setFineIssueToCollect(null);
    } finally {
      setIsCollectingFine(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Issued Books & Circulation</h3>
          <p className="text-muted small mb-0">
            Track active book loans, monitor due dates, and process returns & fine collections
          </p>
        </div>
        <Link to="/issues/issue-book" className="btn btn-primary d-flex align-items-center">
          <i className="bi bi-journal-plus me-1"></i> Issue New Book
        </Link>
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

      {error && <ErrorMessage message={error} onRetry={fetchIssues} />}

      {/* Filter Bar */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-6 col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Circulation Statuses</option>
                <option value="issued">Active Loans (Issued)</option>
                <option value="returned">Returned Loans</option>
                <option value="overdue">Overdue Loans</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-8 text-sm-end text-muted small">
              Total Recorded Loans: <strong>{totalIssues}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading circulation records..." />
          ) : issues.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 bg-white">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: '4%' }}>#</th>
                      <th scope="col" style={{ width: '26%' }}>Book Title</th>
                      <th scope="col" style={{ width: '22%' }}>Borrower Student</th>
                      <th scope="col" style={{ width: '12%' }}>Issue Date</th>
                      <th scope="col" style={{ width: '12%' }}>Due Date</th>
                      <th scope="col" className="text-center" style={{ width: '10%' }}>Status</th>
                      <th scope="col" className="text-end" style={{ width: '14%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, idx) => {
                      const isOverdue =
                        issue.status !== 'returned' &&
                        new Date(issue.dueDate) < new Date();

                      return (
                        <tr key={issue._id}>
                          <td className="text-muted small">
                            {(currentPage - 1) * 10 + idx + 1}
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">
                              {issue.book?.title || 'Unknown Title'}
                            </div>
                            <span className="text-muted small">
                              ISBN: {issue.book?.isbn || '—'}
                            </span>
                          </td>
                          <td>
                            <div className="fw-medium text-dark">
                              {issue.student?.name || 'Unknown Student'}
                            </div>
                            <span className="text-muted small">
                              ID: {issue.student?.studentId} • {issue.student?.email}
                            </span>
                          </td>
                          <td className="text-muted small">{formatDate(issue.issueDate)}</td>
                          <td>
                            <span
                              className={`small ${
                                isOverdue ? 'text-danger fw-semibold' : 'text-muted'
                              }`}
                            >
                              {formatDate(issue.dueDate)}
                            </span>
                            {isOverdue && (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-block mt-1" style={{ width: 'fit-content', fontSize: '10px' }}>
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                issue.status === 'returned'
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : isOverdue
                                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                  : 'bg-primary-subtle text-primary border border-primary-subtle'
                              }`}
                            >
                              {issue.status}
                            </span>
                            {issue.fine > 0 && (
                              <div className="text-danger small mt-1 fw-bold" style={{ fontSize: '11px' }}>
                                Fine: ₹{issue.fine}
                              </div>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1 flex-wrap">
                              {issue.status !== 'returned' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success text-nowrap"
                                  onClick={() => handleReturnPrompt(issue)}
                                >
                                  <i className="bi bi-box-arrow-in-left me-1"></i> Return
                                </button>
                              )}
                              {issue.fine > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger text-nowrap"
                                  onClick={() => setFineIssueToCollect(issue)}
                                  title="Collect Fine in Cash"
                                >
                                  <i className="bi bi-cash-stack me-1"></i> Collect
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-top">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalIssues}
                  pageSize={10}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon="bi-journal-check"
              title="No issued book records found"
              description="There are currently no book loans matching your filter."
              actionText="Issue a Book"
              onAction={() => (window.location.href = '/issues/issue-book')}
            />
          )}
        </div>
      </div>

      {/* Return Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(issueToReturn)}
        title="Confirm Book Return"
        message={`Confirm return for "${issueToReturn?.book?.title}" borrowed by ${issueToReturn?.student?.name}? The system will restore stock and compute any overdue fines automatically.`}
        confirmText="Confirm Return"
        confirmVariant="success"
        isLoading={isReturning}
        onConfirm={handleConfirmReturn}
        onCancel={() => setIssueToReturn(null)}
      />

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
                    <strong>Student:</strong> {fineIssueToCollect.student?.name} (ID: {fineIssueToCollect.student?.studentId})
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

export default Issues;
