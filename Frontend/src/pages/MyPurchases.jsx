import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { purchaseService } from '../services/purchaseService';
import { formatDateTime } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await purchaseService.getMyPurchases();
      if (res.success) {
        setPurchases(res.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load your purchase records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  };

  if (loading) {
    return (
      <div className="container py-5">
        <Loading message="Loading your book purchase receipts..." />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
          <div>
            <h3 className="fw-bold text-dark mb-1">My Book Purchases</h3>
            <p className="text-muted small mb-0">
              Personal textbooks and references acquired through the library portal
            </p>
          </div>
          <Link to="/books" className="btn btn-outline-primary btn-sm d-flex align-items-center">
            <i className="bi bi-search me-1"></i> Browse More Titles
          </Link>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchPurchases} />}

        {/* Purchases List */}
        {purchases.length > 0 ? (
          <div className="row g-3">
            {purchases.map((purchase) => {
              const coverUrl = getImageUrl(purchase.book?.image);

              return (
                <div key={purchase._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border shadow-sm">
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex gap-3 mb-3">
                        {/* Cover Thumbnail */}
                        <div
                          className="bg-light rounded border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0 shadow-sm"
                          style={{ width: '70px', height: '95px' }}
                        >
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={purchase.book?.title}
                              className="w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            <i className="bi bi-book text-muted fs-3"></i>
                          )}
                        </div>

                        {/* Title & Author */}
                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="fw-bold text-dark mb-1 text-truncate" title={purchase.book?.title}>
                            {purchase.book?.title || 'Purchased Title'}
                          </h6>
                          <p className="text-muted small mb-1 text-truncate">By {purchase.book?.author || '—'}</p>
                          <span className="badge bg-success-subtle text-success border border-success-subtle small">
                            <i className="bi bi-check-circle-fill me-1"></i> Paid (₹{purchase.amount})
                          </span>
                        </div>
                      </div>

                      <div className="bg-light p-3 rounded small text-secondary mt-auto">
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Purchased Date:</span>
                          <span className="fw-medium text-dark">
                            {formatDateTime(purchase.purchaseDate || purchase.createdAt)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted">Payment ID:</span>
                          <code className="text-primary">{purchase.razorpayPaymentId || 'pay_verified'}</code>
                        </div>
                        <div className="d-flex justify-content-between py-1">
                          <span className="text-muted">ISBN:</span>
                          <span>{purchase.book?.isbn || '—'}</span>
                        </div>
                      </div>

                      {purchase.book && (
                        <Link
                          to={`/books/${purchase.book._id}`}
                          className="btn btn-outline-primary btn-sm mt-3 w-100"
                        >
                          View Book Specification
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="bi-bag-x"
            title="No purchased books found"
            description="You have not purchased any personal book copies from the library catalog yet."
            actionText="Explore Books Catalog"
            onAction={() => (window.location.href = '/books')}
          />
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
