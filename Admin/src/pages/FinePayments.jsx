import React, { useState, useEffect, useCallback } from 'react';
import { fineService } from '../services/fineService';
import { formatDateTime } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const FinePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');

  const fetchFinePayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fineService.getAllFines({
        paymentMethod: selectedMethod,
      });
      if (res.success) {
        setPayments(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load fine payment audit records.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMethod]);

  useEffect(() => {
    fetchFinePayments();
  }, [fetchFinePayments]);

  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Fine Collection Ledger</h3>
          <p className="text-muted small mb-0">
            Audit log of student penalty settlements via Razorpay and on-the-spot cash collections
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white border rounded px-3 py-2 shadow-sm small">
            <span className="text-muted me-2">Total Collected:</span>
            <strong className="text-success fs-6">₹{totalCollected}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs Card */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div className="d-flex gap-2">
            {[
              { id: 'all', label: 'All Payments' },
              { id: 'cash', label: 'Cash Collections' },
              { id: 'razorpay', label: 'Razorpay Online' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${
                  selectedMethod === tab.id
                    ? 'btn-primary'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => setSelectedMethod(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-muted small">
            Total records: <strong>{payments.length}</strong>
          </span>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchFinePayments} />}

      {/* Table Card */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading fine payment records..." />
          ) : payments.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '4%' }}>#</th>
                    <th scope="col" style={{ width: '22%' }}>Student Member</th>
                    <th scope="col" style={{ width: '26%' }}>Book Loan Reference</th>
                    <th scope="col" style={{ width: '10%' }}>Amount</th>
                    <th scope="col" style={{ width: '12%' }}>Method</th>
                    <th scope="col" style={{ width: '14%' }}>Settled Date</th>
                    <th scope="col" style={{ width: '12%' }}>Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={payment._id}>
                      <td className="text-muted small">{index + 1}</td>
                      <td>
                        <div className="fw-medium text-dark">{payment.student?.name}</div>
                        <span className="text-muted small">
                          ID: {payment.student?.studentId} • {payment.student?.email}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {payment.issue?.book?.title || 'Book Loan'}
                        </div>
                        <span className="text-muted small">
                          ISBN: {payment.issue?.book?.isbn || '—'}
                        </span>
                      </td>
                      <td className="fw-bold text-success">₹{payment.amount}</td>
                      <td>
                        {payment.paymentMethod === 'cash' ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            <i className="bi bi-cash-stack me-1"></i> Cash (Offline)
                          </span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                            <i className="bi bi-credit-card me-1"></i> Razorpay (Online)
                          </span>
                        )}
                      </td>
                      <td className="small text-secondary">
                        {formatDateTime(payment.paidAt || payment.createdAt)}
                      </td>
                      <td>
                        {payment.collectedBy ? (
                          <span className="badge bg-light text-dark border">
                            <i className="bi bi-person-check me-1 text-primary"></i>
                            {payment.collectedBy.name || 'Admin'}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">
                            Online Gateway
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-cash-coin"
              title="No fine payment records"
              description="No fine transactions matching the selected criteria were found in the database."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FinePayments;
