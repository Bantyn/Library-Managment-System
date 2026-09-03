import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  const [imageError, setImageError] = useState(false);

  const getAvailabilityBadge = () => {
    if (book.availableCopies === 0) {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
          Unavailable (0 left)
        </span>
      );
    }
    if (book.availableCopies <= 2) {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle small">
          Low Stock ({book.availableCopies} left)
        </span>
      );
    }
    return (
      <span className="badge bg-success-subtle text-success border border-success-subtle small">
        Available ({book.availableCopies} copies)
      </span>
    );
  };

  const coverUrl = book.image
    ? book.image.startsWith('http')
      ? book.image
      : `http://localhost:5000${book.image}`
    : null;

  return (
    <div className="col">
      <div className="card h-100 border shadow-sm book-card overflow-hidden">
        {/* Book Cover Image Header */}
        <div
          className="bg-light d-flex align-items-center justify-content-center position-relative border-bottom"
          style={{ height: '170px', overflow: 'hidden' }}
        >
          {coverUrl && !imageError ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="w-100 h-100 object-fit-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center text-muted p-3">
              <img
                width="48"
                height="48"
                src="https://img.icons8.com/parakeet-partial-filled/48/image.png"
                alt="image"
                className="mb-1"
              />
              <span className="small d-block text-secondary">No Cover Image</span>
            </div>
          )}

          {/* Price Badge Overlay */}
          {book.purchasePrice > 0 ? (
            <span
              className="badge bg-success position-absolute top-0 end-0 m-2 shadow-sm"
              style={{ fontSize: '11px' }}
            >
              Buy: ₹{book.purchasePrice}
            </span>
          ) : (
            <span
              className="badge bg-secondary-subtle text-secondary position-absolute top-0 end-0 m-2 border"
              style={{ fontSize: '10px' }}
            >
              Loan Only
            </span>
          )}
        </div>

        <div className="card-body d-flex flex-column p-3">
          {/* Category Pill */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-light text-secondary border small">
              {book.category?.name || 'General'}
            </span>
            {book.publicationYear && (
              <span className="text-muted small" style={{ fontSize: '11px' }}>
                {book.publicationYear}
              </span>
            )}
          </div>

          {/* Book Title */}
          <h6 className="card-title fw-bold text-dark mb-1 text-truncate" title={book.title}>
            {book.title}
          </h6>

          {/* Author */}
          <p className="card-subtitle text-muted small mb-2 text-truncate">By {book.author}</p>

          {/* ISBN & Shelf */}
          <div className="bg-light p-2 rounded mb-3 small" style={{ fontSize: '11px' }}>
            <div className="text-truncate text-muted">
              <span className="fw-medium">ISBN:</span> <code>{book.isbn}</code>
            </div>
            {book.shelfLocation && (
              <div className="text-truncate text-muted mt-1">
                <span className="fw-medium">Shelf:</span> {book.shelfLocation}
              </div>
            )}
          </div>

          {/* Availability Status */}
          <div className="mb-3">{getAvailabilityBadge()}</div>

          {/* View Details Action */}
          <Link
            to={`/books/${book._id}`}
            className="btn btn-outline-primary btn-sm w-100 mt-auto d-flex align-items-center justify-content-center"
          >
            <i className="bi bi-eye me-1"></i> View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
