import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { formatDateTime } from '../utils/formatDate';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import ConfirmModal from '../components/common/ConfirmModal';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBook = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookService.getBookById(id);
      if (res.success) {
        setBook(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load book details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await bookService.deleteBook(id);
      if (res.success) {
        navigate('/books');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete book. Check for active loan issues.'
      );
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading book specifications..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchBook} />;
  }

  if (!book) return null;

  const getStockBadge = () => {
    if (book.availableCopies === 0) {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fs-6">
          <i className="bi bi-x-circle me-1"></i> Unavailable (Out of Stock)
        </span>
      );
    }
    if (book.availableCopies <= 2) {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 fs-6">
          <i className="bi bi-exclamation-triangle me-1"></i> Low Stock ({book.availableCopies} available)
        </span>
      );
    }
    return (
      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6">
        <i className="bi bi-check-circle me-1"></i> Available ({book.availableCopies} copies)
      </span>
    );
  };

  const coverUrl = book.image
    ? book.image.startsWith('http')
      ? book.image
      : `http://localhost:5000${book.image}`
    : null;

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/books" className="text-decoration-none">
              Books
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {book.title}
          </li>
        </ol>
      </nav>

      {/* Header with Title and Quick Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">{book.title}</h3>
          <p className="text-muted small mb-0">By {book.author}</p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/books/${book._id}/edit`} className="btn btn-outline-secondary btn-sm d-flex align-items-center">
            <i className="bi bi-pencil me-1"></i> Edit Book
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm d-flex align-items-center"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="bi bi-trash me-1"></i> Delete
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Details Card */}
        <div className="col-12 col-lg-8">
          <div className="card border shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold text-dark">Book Specifications</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Title</span>
                  <span className="fw-medium text-dark">{book.title}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Author</span>
                  <span className="fw-medium text-dark">{book.author}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">ISBN</span>
                  <code>{book.isbn}</code>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Category</span>
                  <span className="badge bg-light text-dark border">
                    {book.category?.name || 'Unassigned'}
                  </span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Purchase Price</span>
                  {book.purchasePrice > 0 ? (
                    <span className="fw-bold text-success">₹{book.purchasePrice}</span>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary border">Loan Only (₹0)</span>
                  )}
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Publisher</span>
                  <span className="text-secondary">{book.publisher || 'Not specified'}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Publication Year</span>
                  <span className="text-secondary">{book.publicationYear || 'Not specified'}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Shelf / Rack Location</span>
                  <span className="badge bg-secondary-subtle text-secondary border">
                    {book.shelfLocation || 'General Collection'}
                  </span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Record Added</span>
                  <span className="text-secondary small">{formatDateTime(book.createdAt)}</span>
                </div>
                <div className="col-12 mt-3 pt-3 border-top">
                  <span className="text-muted small d-block mb-1">Description / Summary</span>
                  <p className="text-secondary mb-0">
                    {book.description || 'No description provided for this title.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Cover Image & Stock Status */}
        <div className="col-12 col-lg-4">
          {/* Cover Image Card */}
          <div className="card border shadow-sm mb-4 text-center p-3">
            <div
              className="bg-light rounded border mx-auto d-flex align-items-center justify-content-center overflow-hidden shadow-sm mb-3"
              style={{ width: '160px', height: '220px' }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-100 h-100 object-fit-cover"
                />
              ) : (
                <div className="text-muted small p-3">
                  <i className="bi bi-image fs-1 d-block mb-2 text-secondary"></i>
                  No Cover Image
                </div>
              )}
            </div>
            <span className="text-muted small">
              {book.image ? 'Custom Uploaded Cover' : 'Default Placeholders Active'}
            </span>
          </div>

          {/* Stock Card */}
          <div className="card border shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold text-dark">Circulation Inventory</h5>
            </div>
            <div className="card-body p-4 text-center">
              <div className="mb-3">{getStockBadge()}</div>

              <div className="row g-2 mt-3 pt-3 border-top text-start">
                <div className="col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <span className="text-muted small d-block">Total Copies</span>
                    <h4 className="fw-bold text-dark mb-0">{book.totalCopies}</h4>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <span className="text-muted small d-block">Available</span>
                    <h4 className="fw-bold text-success mb-0">{book.availableCopies}</h4>
                  </div>
                </div>
                <div className="col-12 mt-2">
                  <div className="p-3 bg-light rounded text-center">
                    <span className="text-muted small d-block">Currently on Loan</span>
                    <h5 className="fw-bold text-primary mb-0">
                      {book.totalCopies - book.availableCopies}
                    </h5>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to="/issues/issue-book"
                  className={`btn btn-primary w-100 ${book.availableCopies === 0 ? 'disabled' : ''}`}
                >
                  <i className="bi bi-journal-plus me-1"></i> Issue This Book
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Book Record"
        message={`Are you sure you want to delete "${book.title}"?`}
        confirmText="Delete Book"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default BookDetails;
