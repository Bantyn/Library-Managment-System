import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueService } from '../services/issueService';
import { fineService } from '../services/fineService';
import { openRazorpayCheckout } from '../utils/razorpay';
import { formatDateTime } from '../utils/formatDate';
import BorrowingTable from '../components/profile/BorrowingTable';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const MyBooks = () => {
  const { user } = useAuth();

  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLoans, setHistoryLoans] = useState([]);
  const [finesData, setFinesData] = useState({ totalOutstanding: 0, issuesWithFines: [], paymentHistory: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [payingIssueId, setPayingIssueId] = useState(null);

  const fetchStudentData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const studentId = user.id || user._id;
      const [issuesRes, finesRes] = await Promise.all([
        issueService.getMemberIssues(studentId),
        fineService.getMyFines(),
      ]);

      if (issuesRes.success) {
        const allIssues = issuesRes.data || [];
        setActiveLoans(allIssues.filter((item) => item.status !== 'returned'));
        setHistoryLoans(allIssues.filter((item) => item.status === 'returned'));
      }

      if (finesRes.success) {
        setFinesData(finesRes.data || { totalOutstanding: 0, issuesWithFines: [], paymentHistory: [] });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load your borrowing records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const handlePayFineOnline = async (issueId, amount) => {
    setPayingIssueId(issueId);
    setError('');
    setSuccessMessage('');

    try {
      // 1. Create fine payment order
      const orderRes = await fineService.createFineOrder(issueId);
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to initiate fine payment.');
      }

      const { finePaymentId, orderId, key_id, bookTitle } = orderRes.data;

      // 2. Open Razorpay Checkout modal
      await openRazorpayCheckout({
        key: key_id,
        orderId,
        amount: Math.round(amount * 100),
        name: 'Campus Digital Library',
        description: `Fine Settlement: ${bookTitle}`,
        prefill: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        onSuccess: async (paymentData) => {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fineService.verifyFinePayment({
              finePaymentId,
              razorpayOrderId: paymentData.razorpayOrderId,
              razorpayPaymentId: paymentData.razorpayPaymentId,
              razorpaySignature: paymentData.razorpaySignature,
            });

            if (verifyRes.success) {
              setSuccessMessage(`Fine of ₹${amount} settled successfully via Razorpay!`);
              fetchStudentData();
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setError(err.response?.data?.message || err.message || 'Payment verification error.');
          } finally {
            setPayingIssueId(null);
          }
        },
        onDismiss: () => {
          setPayingIssueId(null);
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment processing failed.');
      setPayingIssueId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <Loading message="Loading your active loans, borrowing history & fines..." />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="container">
        {/* Page Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
          <div>
            <h3 className="fw-bold text-dark mb-1">My Borrowed Books</h3>
            <p className="text-muted small mb-0">
              Track active loans, return due dates, and settle outstanding penalties online
            </p>
          </div>
          <Link to="/books" className="btn btn-outline-primary btn-sm d-flex align-items-center">
            <i className="bi bi-search me-1"></i> Browse More Books
          </Link>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{successMessage}</div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccessMessage('')}
            ></button>
          </div>
        )}

        {error && <ErrorMessage message={error} onRetry={fetchStudentData} />}

        {/* Outstanding Fine Notice Card (Phase 5) */}
        {finesData.totalOutstanding > 0 && (
          <div className="card border-danger shadow-sm mb-4 bg-danger-subtle text-danger-emphasis">
            <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h5 className="fw-bold mb-1 d-flex align-items-center text-danger">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>
                  Outstanding Library Fines: ₹{finesData.totalOutstanding}
                </h5>
                <p className="small mb-0 text-secondary">
                  You have delayed book return fees accumulated on your library account. Settle immediately using Razorpay to maintain your borrowing privileges.
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                {finesData.issuesWithFines
                  .filter((item) => item.outstandingFine > 0)
                  .map((item) => (
                    <button
                      key={item.issueId}
                      type="button"
                      className="btn btn-danger btn-sm d-flex align-items-center text-nowrap"
                      onClick={() => handlePayFineOnline(item.issueId, item.outstandingFine)}
                      disabled={payingIssueId === item.issueId}
                    >
                      {payingIssueId === item.issueId ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      ) : (
                        <i className="bi bi-credit-card me-1"></i>
                      )}
                      Pay Fine for "{item.book?.title?.substring(0, 16)}..." (₹{item.outstandingFine})
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Currently Borrowed Books */}
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
              <i className="bi bi-journal-check me-2 text-primary"></i>
              Currently Borrowed Books
            </h5>
            <span className="badge bg-primary rounded-pill">
              {activeLoans.length} active loan{activeLoans.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="card-body p-0">
            {activeLoans.length > 0 ? (
              <BorrowingTable issues={activeLoans} isHistory={false} />
            ) : (
              <EmptyState
                icon="bi-book"
                title="No active book borrowings"
                description="You currently have no books checked out from the library."
                actionText="Explore Books Catalog"
                onAction={() => (window.location.href = '/books')}
              />
            )}
          </div>
        </div>

        {/* Section 2: Complete Borrowing History */}
        <div className="card border shadow-sm mb-4">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-secondary d-flex align-items-center">
              <i className="bi bi-clock-history me-2"></i>
              Past Borrowing History
            </h5>
            <span className="badge bg-secondary-subtle text-secondary border">
              {historyLoans.length} returned title{historyLoans.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="card-body p-0">
            {historyLoans.length > 0 ? (
              <BorrowingTable issues={historyLoans} isHistory={true} />
            ) : (
              <div className="p-4 text-center text-muted small">
                No past returned loans recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Fine Payment History (Phase 5) */}
        <div className="card border shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
              <i className="bi bi-cash-coin me-2 text-success"></i>
              Fine Payment Receipts & Audit History
            </h5>
            <span className="badge bg-light text-secondary border">
              {finesData.paymentHistory?.length || 0} receipt(s)
            </span>
          </div>
          <div className="card-body p-0">
            {finesData.paymentHistory?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Book</th>
                      <th>Fine Settled</th>
                      <th>Payment Method</th>
                      <th>Date Paid</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finesData.paymentHistory.map((p) => (
                      <tr key={p._id}>
                        <td className="fw-medium text-dark">
                          {p.issue?.book?.title || 'Book Loan'}
                        </td>
                        <td className="fw-bold text-success">₹{p.amount}</td>
                        <td>
                          {p.paymentMethod === 'cash' ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              Cash (Desk Collection)
                            </span>
                          ) : (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              Razorpay Online
                            </span>
                          )}
                        </td>
                        <td className="text-muted">{formatDateTime(p.paidAt || p.createdAt)}</td>
                        <td className="text-end">
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-muted small">
                No fine payment history recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBooks;
