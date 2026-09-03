import React from 'react';
import { Link } from 'react-router-dom';

const BookTable = ({ books = [], onDeleteClick, startIndex = 1 }) => {
  const getAvailabilityBadge = (available) => {
    if (available === 0) {
      return <span className="badge bg-danger">Out of Stock</span>;
    }
    if (available <= 2) {
      return <span className="badge bg-warning text-dark">Low Stock ({available})</span>;
    }
    return <span className="badge bg-success">Available ({available})</span>;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 bg-white">
        <thead className="table-light">
          <tr>
            <th scope="col" style={{ width: '3%' }}>#</th>
            <th scope="col" style={{ width: '6%' }}>Cover</th>
            <th scope="col" style={{ width: '25%' }}>Book Title</th>
            <th scope="col" style={{ width: '16%' }}>Author</th>
            <th scope="col" style={{ width: '12%' }}>ISBN</th>
            <th scope="col" style={{ width: '12%' }}>Category</th>
            <th scope="col" className="text-center" style={{ width: '8%' }}>Price</th>
            <th scope="col" className="text-center" style={{ width: '10%' }}>Stock</th>
            <th scope="col" className="text-end" style={{ width: '8%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book, index) => {
            const coverUrl = getImageUrl(book.image);

            return (
              <tr key={book._id}>
                <td className="text-muted small">{startIndex + index}</td>
                {/* Thumbnail */}
                <td>
                  <div
                    className="bg-light rounded border d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                    style={{ width: '38px', height: '50px' }}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<i class="bi bi-book text-muted"></i>';
                        }}
                      />
                    ) : (
                      <i className="bi bi-book text-muted small"></i>
                    )}
                  </div>
                </td>
                <td>
                  <div className="fw-semibold text-dark">{book.title}</div>
                  <div className="text-muted small">
                    {book.publisher ? `${book.publisher}` : ''}
                    {book.publicationYear ? ` (${book.publicationYear})` : ''}
                  </div>
                </td>
                <td className="text-secondary">{book.author}</td>
                <td>
                  <code className="text-dark bg-light px-2 py-1 rounded small">{book.isbn}</code>
                </td>
                <td>
                  <span className="badge bg-light text-dark border">
                    {book.category?.name || 'Uncategorized'}
                  </span>
                </td>
                {/* Purchase Price */}
                <td className="text-center">
                  {book.purchasePrice > 0 ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold">
                      ₹{book.purchasePrice}
                    </span>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                      Loan Only
                    </span>
                  )}
                </td>
                {/* Availability Stock */}
                <td className="text-center">
                  {getAvailabilityBadge(book.availableCopies)}
                </td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm" role="group">
                    <Link
                      to={`/books/${book._id}`}
                      className="btn btn-outline-primary"
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </Link>
                    <Link
                      to={`/books/${book._id}/edit`}
                      className="btn btn-outline-secondary"
                      title="Edit Book"
                    >
                      <i className="bi bi-pencil"></i>
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      title="Delete Book"
                      onClick={() => onDeleteClick(book)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BookTable;
