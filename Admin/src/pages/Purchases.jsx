import React, { useState, useEffect, useCallback } from 'react';
import { purchaseService } from '../services/purchaseService';
import { formatDate, formatDateTime } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await purchaseService.getAllPurchases(selectedStatus);
      if (res.success) {
        setPurchases(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load purchase records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-check-circle-fill me-1"></i> Paid
          </span>
        );
      case 'created':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
            <i className="bi bi-hourglass-split me-1"></i> Created (Pending)
          </span>
        );
      case 'failed':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
            <i className="bi bi-x-circle-fill me-1"></i> Failed
          </span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  };

  const totalRevenue = purchases
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Book Purchases Ledger</h3>
          <p className="text-muted small mb-0">
            Student book sales processed via Razorpay payment gateway
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white border rounded px-3 py-2 shadow-sm small">
            <span className="text-muted me-2">Paid Sales:</span>
            <strong className="text-success fs-6">₹{totalRevenue}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs Card */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div className="d-flex gap-2">
            {['all', 'paid', 'created', 'failed'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm text-capitalize ${
                  selectedStatus === status
                    ? 'btn-primary'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'all' ? 'All Transactions' : status}
              </button>
            ))}
          </div>
          <span className="text-muted small">
            Total records: <strong>{purchases.length}</strong>
          </span>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchPurchases} />}

      {/* Table Card */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Fetching student book purchase records..." />
          ) : purchases.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '4%' }}>#</th>
                    <th scope="col" style={{ width: '6%' }}>Cover</th>
                    <th scope="col" style={{ width: '24%' }}>Book Purchased</th>
                    <th scope="col" style={{ width: '22%' }}>Student Member</th>
                    <th scope="col" style={{ width: '10%' }}>Amount</th>
                    <th scope="col" style={{ width: '12%' }}>Date</th>
                    <th scope="col" style={{ width: '10%' }}>Status</th>
                    <th scope="col" style={{ width: '12%' }}>Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, index) => {
                    const coverUrl = getImageUrl(purchase.book?.image);

                    return (
                      <tr key={purchase._id}>
                        <td className="text-muted small">{index + 1}</td>
                        {/* Cover Thumbnail */}
                        <td>
                          <div
                            className="bg-light rounded border d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                            style={{ width: '38px', height: '50px' }}
                          >
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={purchase.book?.title}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="bi bi-book text-muted small"></i>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">
                            {purchase.book?.title || 'Unknown Title'}
                          </div>
                          <span className="text-muted small">
                            ISBN: {purchase.book?.isbn || '—'} • Author: {purchase.book?.author || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium text-dark">{purchase.student?.name}</div>
                          <span className="text-muted small">
                            ID: {purchase.student?.studentId} • {purchase.student?.email}
                          </span>
                        </td>
                        <td className="fw-bold text-dark">₹{purchase.amount}</td>
                        <td className="small text-secondary">
                          {formatDateTime(purchase.purchaseDate || purchase.createdAt)}
                        </td>
                        <td>{getStatusBadge(purchase.status)}</td>
                        <td>
                          {purchase.razorpayPaymentId ? (
                            <code className="text-primary small">{purchase.razorpayPaymentId}</code>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-bag"
              title="No book purchases recorded"
              description={
                selectedStatus === 'all'
                  ? 'No students have purchased books from the library catalog yet.'
                  : `No purchases found with status "${selectedStatus}".`
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchases;
