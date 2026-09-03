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
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [fulfillingId, setFulfillingId] = useState(null);

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

  const handleUpdateStatus = async (purchaseId, newStatus) => {
    if (newStatus === 'fulfilled') {
      const confirmed = window.confirm(
        'Confirm physical fulfillment? This will permanently deduct 1 copy from library inventory stock and record a STOCK_OUT audit transaction.'
      );
      if (!confirmed) return;
    }

    setFulfillingId(purchaseId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await purchaseService.updateStatus(purchaseId, newStatus);
      if (res.success) {
        setSuccessMsg(res.message || `Order successfully updated to ${newStatus}.`);
        fetchPurchases();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order fulfillment status.');
    } finally {
      setFulfillingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'fulfilled':
        return (
          <span className="badge bg-success text-white px-2 py-1">
            <i className="bi bi-box-seam me-1"></i> Fulfilled
          </span>
        );
      case 'processing':
        return (
          <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
            <i className="bi bi-gear-wide me-1"></i> Processing
          </span>
        );
      case 'paid':
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-check-circle-fill me-1"></i> Paid (Pending Dispatch)
          </span>
        );
      case 'created':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
            <i className="bi bi-hourglass-split me-1"></i> Payment Pending
          </span>
        );
      case 'failed':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
            <i className="bi bi-x-circle-fill me-1"></i> Failed
          </span>
        );
      case 'cancelled':
        return <span className="badge bg-secondary">Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  };

  const totalRevenue = purchases
    .filter((p) => p.status === 'paid' || p.status === 'processing' || p.status === 'fulfilled')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Book Purchases & Physical Fulfillment</h3>
          <p className="text-muted small mb-0">
            Student book sales processed via Razorpay with physical copy dispatch and inventory stock tracking
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white border rounded px-3 py-2 shadow-sm small">
            <span className="text-muted me-2">Completed Sales Revenue:</span>
            <strong className="text-success fs-6">₹{totalRevenue}</strong>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{successMsg}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {/* Filter Tabs Card */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div className="d-flex flex-wrap gap-2">
            {['all', 'paid', 'processing', 'fulfilled', 'created', 'failed'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm text-capitalize ${
                  selectedStatus === status
                    ? 'btn-primary text-dark fw-semibold'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'all' ? 'All Orders' : status}
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
              <table className="table table-hover align-middle mb-0 bg-white small">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '4%' }}>#</th>
                    <th scope="col" style={{ width: '6%' }}>Cover</th>
                    <th scope="col" style={{ width: '22%' }}>Book Purchased</th>
                    <th scope="col" style={{ width: '18%' }}>Student Member</th>
                    <th scope="col" style={{ width: '9%' }}>Amount</th>
                    <th scope="col" style={{ width: '11%' }}>Date</th>
                    <th scope="col" style={{ width: '12%' }}>Status</th>
                    <th scope="col" style={{ width: '18%' }} className="text-end">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, index) => {
                    const coverUrl = getImageUrl(purchase.book?.image);
                    const isOperating = fulfillingId === purchase._id;

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
                          <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '200px' }}>
                            {purchase.book?.title || 'Unknown Title'}
                          </div>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            ISBN: <code>{purchase.book?.isbn || '—'}</code>
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium text-dark">{purchase.student?.name}</div>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            ID: {purchase.student?.studentId} • {purchase.student?.email}
                          </span>
                        </td>
                        <td className="fw-bold text-dark fs-6">₹{purchase.amount}</td>
                        <td className="text-secondary" style={{ fontSize: '11px' }}>
                          {formatDateTime(purchase.purchaseDate || purchase.createdAt)}
                        </td>
                        <td>{getStatusBadge(purchase.status)}</td>
                        <td className="text-end">
                          {purchase.status === 'paid' && (
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                type="button"
                                className="btn btn-outline-info btn-sm"
                                onClick={() => handleUpdateStatus(purchase._id, 'processing')}
                                disabled={isOperating}
                              >
                                Process
                              </button>
                              <button
                                type="button"
                                className="btn btn-success btn-sm text-white fw-semibold"
                                onClick={() => handleUpdateStatus(purchase._id, 'fulfilled')}
                                disabled={isOperating}
                              >
                                {isOperating ? 'Fulfilling...' : 'Fulfill & Dispatch'}
                              </button>
                            </div>
                          )}

                          {purchase.status === 'processing' && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm text-white fw-semibold"
                              onClick={() => handleUpdateStatus(purchase._id, 'fulfilled')}
                              disabled={isOperating}
                            >
                              {isOperating ? 'Fulfilling...' : 'Fulfill & Dispatch'}
                            </button>
                          )}

                          {purchase.status === 'fulfilled' && (
                            <span className="text-success small fw-medium">
                              <i className="bi bi-check-all me-1 fs-6"></i> Dispatched & Stock Deducted
                            </span>
                          )}

                          {purchase.status === 'created' && (
                            <span className="text-muted small">Awaiting Student Payment</span>
                          )}

                          {purchase.status === 'failed' && (
                            <span className="text-danger small">Payment Failed</span>
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
