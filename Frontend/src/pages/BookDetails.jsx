import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { purchaseService } from '../services/purchaseService';
import { useAuth } from '../context/AuthContext';
import { openRazorpayCheckout } from '../utils/razorpay';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Payment State
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(''); // 'initiating', 'processing', 'verifying', 'done'

  const fetchBook = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookService.getBookById(id);
      if (res.success) {
        setBook(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Book record not found or unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handlePurchaseBook = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!book || book.purchasePrice <= 0) return;

    setIsPurchasing(true);
    setError('');
    setSuccessMessage('');
    setPurchaseStatus('initiating');

    try {
      // 1. Create order on backend
      const orderRes = await purchaseService.createPurchaseOrder(book._id);
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to initialize purchase order.');
      }

      const { purchaseId, orderId, amount, key_id } = orderRes.data;

      setPurchaseStatus('processing');

      // 2. Open Razorpay Checkout modal
      await openRazorpayCheckout({
        key: key_id,
        orderId,
        amount,
        name: 'Campus Digital Library',
        description: `Purchase: ${book.title}`,
        prefill: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        onSuccess: async (paymentData) => {
          setPurchaseStatus('verifying');
          try {
            // 3. Verify server-side signature
            const verifyRes = await purchaseService.verifyPurchase({
              purchaseId,
              razorpayOrderId: paymentData.razorpayOrderId,
              razorpayPaymentId: paymentData.razorpayPaymentId,
              razorpaySignature: paymentData.razorpaySignature,
            });

            if (verifyRes.success) {
              setSuccessMessage(
                `Payment verified! "${book.title}" was purchased successfully. View receipt in My Purchases.`
              );
              setPurchaseStatus('done');
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setError(err.response?.data?.message || err.message || 'Payment verification failed.');
            setPurchaseStatus('');
          } finally {
            setIsPurchasing(false);
          }
        },
        onDismiss: () => {
          setIsPurchasing(false);
          setPurchaseStatus('');
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to start purchase flow.');
      setIsPurchasing(false);
      setPurchaseStatus('');
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <Loading message="Loading book specifications..." />
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="container py-5">
        <ErrorMessage message={error} onRetry={fetchBook} />
        <div className="mt-3">
          <Link to="/books" className="btn btn-outline-secondary">
            ← Back to Books Catalog
          </Link>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const getStockBadge = () => {
    if (book.availableCopies === 0) {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fs-6">
          <i className="bi bi-x-circle me-1"></i> Currently Unavailable (0 copies)
        </span>
      );
    }
    if (book.availableCopies <= 2) {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 fs-6">
          <i className="bi bi-exclamation-triangle me-1"></i> Limited Availability ({book.availableCopies} available)
        </span>
      );
    }
    return (
      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6">
        <i className="bi bi-check-circle me-1"></i> Available for Loan ({book.availableCopies} copies)
      </span>
    );
  };

  const coverUrl = book.image
    ? book.image.startsWith('http')
      ? book.image
      : `http://localhost:5000${book.image}`
    : null;

  return (
    <div className="py-4">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item">
              <Link to="/books" className="text-decoration-none">
                Books Catalog
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {book.title}
            </li>
          </ol>
        </nav>

        {/* Back Link */}
        <div className="mb-3">
          <Link to="/books" className="text-decoration-none text-muted small d-inline-flex align-items-center">
            <i className="bi bi-arrow-left me-1"></i> Back to All Books
          </Link>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{successMessage}</div>
            <Link to="/my-purchases" className="btn btn-sm btn-outline-success ms-auto text-nowrap">
              View My Purchases
            </Link>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="row g-4">
          {/* Main Book Information */}
          <div className="col-12 col-lg-8">
            <div className="card border shadow-sm mb-4">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                  <span className="badge bg-light text-secondary border px-3 py-2">
                    <i className="bi bi-tag me-1 text-primary"></i>
                    {book.category?.name || 'General Academic'}
                  </span>
                  {book.publicationYear && (
                    <span className="text-muted small">Published: {book.publicationYear}</span>
                  )}
                </div>

                <h2 className="fw-bold text-dark mb-2">{book.title}</h2>
                <h5 className="text-secondary fw-normal mb-4">Author: {book.author}</h5>

                <div className="mb-4">{getStockBadge()}</div>

                <hr className="my-4" />

                {/* Summary / Description */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Book Summary</h6>
                  <p className="text-secondary mb-0 leading-relaxed">
                    {book.description || 'No detailed synopsis available for this title.'}
                  </p>
                </div>

                <hr className="my-4" />

                {/* Metadata Details Grid */}
                <h6 className="fw-bold text-dark mb-3">Catalog Details</h6>
                <div className="row g-3 small">
                  <div className="col-sm-6">
                    <span className="text-muted d-block">International Standard Book Number (ISBN)</span>
                    <code className="text-dark fs-6">{book.isbn}</code>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Publisher</span>
                    <span className="text-dark fw-medium">{book.publisher || 'Not recorded'}</span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Physical Shelf Location</span>
                    <span className="badge bg-secondary-subtle text-secondary border">
                      {book.shelfLocation || 'General Circulation Stacks'}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Total Library Holdings</span>
                    <span className="text-dark fw-medium">{book.totalCopies} copies in library</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Cover Image, Purchase Flow & Borrowing Procedure */}
          <div className="col-12 col-lg-4">
            {/* Book Cover Card */}
            <div className="card border shadow-sm mb-4 text-center p-3">
              <div
                className="bg-light rounded border mx-auto d-flex align-items-center justify-content-center overflow-hidden shadow-sm mb-2"
                style={{ width: '180px', height: '240px' }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={book.title}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML =
                        '<div class="text-center text-muted p-3"><i class="bi bi-book fs-1 d-block mb-1"></i><span class="small">Cover Unavailable</span></div>';
                    }}
                  />
                ) : (
                  <div className="text-center text-muted p-3">
                    <i className="bi bi-book fs-1 d-block mb-2 text-secondary"></i>
                    <span className="small text-secondary">No Cover Uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Section Card (Phase 5) */}
            <div className="card border shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center">
                  <i className="bi bi-bag-check text-success me-2"></i> Book Purchase Option
                </h6>
              </div>
              <div className="card-body p-4">
                {book.purchasePrice > 0 ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted small">Purchase Price:</span>
                      <h4 className="fw-bold text-success mb-0">₹{book.purchasePrice}</h4>
                    </div>
                    <p className="text-muted small mb-3">
                      Own a permanent personal copy of this textbook via secure Razorpay checkout.
                    </p>
                    <button
                      type="button"
                      className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center fw-medium"
                      onClick={handlePurchaseBook}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          {purchaseStatus === 'initiating' && 'Creating Order...'}
                          {purchaseStatus === 'processing' && 'Processing Payment...'}
                          {purchaseStatus === 'verifying' && 'Verifying Signature...'}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-credit-card me-2"></i>
                          Purchase Book (₹{book.purchasePrice})
                        </>
                      )}
                    </button>
                    {!isAuthenticated && (
                      <div className="text-muted small text-center mt-2" style={{ fontSize: '11px' }}>
                        * You will be prompted to sign in to your student account.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="badge bg-secondary-subtle text-secondary border px-3 py-2 small d-block mb-2">
                      Purchase not available
                    </span>
                    <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                      This volume is exclusively available for campus library checkout & study loans.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Borrowing Procedure Instructions */}
            <div className="card border shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  Borrowing Instructions
                </h6>
              </div>
              <div className="card-body p-4 small text-secondary">
                <p>
                  To borrow this book on a 14-day campus loan:
                </p>
                <div className="bg-light p-3 rounded mb-3">
                  <div className="mb-1"><strong>Title:</strong> {book.title}</div>
                  <div className="mb-1"><strong>Shelf:</strong> {book.shelfLocation || 'General Stacks'}</div>
                  <div><strong>ISBN:</strong> {book.isbn}</div>
                </div>
                <p className="mb-0">
                  Present your <strong>Student ID</strong> at the library circulation desk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
