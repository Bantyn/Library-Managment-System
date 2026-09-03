import React from 'react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    if (totalItems > 0) {
      return (
        <div className="d-flex justify-content-between align-items-center mt-3 text-muted small">
          <span>
            Showing 1–{totalItems} of {totalItems} records
          </span>
        </div>
      );
    }
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-2">
      <div className="text-muted small">
        Showing {startItem}–{endItem} of {totalItems} records
      </div>

      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {pages.map((p, idx) =>
            p === '...' ? (
              <li key={`ellipsis-${idx}`} className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            ) : (
              <li
                key={p}
                className={`page-item ${currentPage === p ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              </li>
            )
          )}

          <li
            className={`page-item ${
              currentPage === totalPages ? 'disabled' : ''
            }`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
