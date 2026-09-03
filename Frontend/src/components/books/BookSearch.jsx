import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import { highlightMatch } from '../common/MasterSearchBar';

const FALLBACK_ICON = 'https://img.icons8.com/parakeet-partial-filled/48/image.png';

const BookSearch = ({ searchTerm, onSearchChange, onSearchSubmit, onClearSearch }) => {
  const navigate = useNavigate();
  const [dropdownResults, setDropdownResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Live search debounced fetch for dropdown
  const fetchLiveSuggestions = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setDropdownResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await bookService.getBooks({
        search: query.trim(),
        limit: 5,
      });

      if (res.success) {
        setDropdownResults(res.data || []);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch search suggestions:', err.message);
      setDropdownResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onSearchChange(val);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!val.trim()) {
      setDropdownResults([]);
      setIsOpen(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      fetchLiveSuggestions(val);
    }, 280);
  };

  const handleFormSubmit = (e) => {
    setIsOpen(false);
    onSearchSubmit(e);
  };

  const handleSelectBook = (bookId) => {
    setIsOpen(false);
    navigate(`/books/${bookId}`);
  };

  return (
    <div ref={containerRef} className="position-relative w-100">
      <form onSubmit={handleFormSubmit} className="w-100">
        <div
          className={`input-group shadow-sm rounded-3 overflow-hidden bg-white border ${
            isOpen ? 'border-warning' : 'border-secondary-subtle'
          }`}
        >
          <span className="input-group-text bg-white border-0 ps-3 pe-2 text-secondary">
            {loading ? (
              <span
                className="spinner-border spinner-border-sm text-warning"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <i className="bi bi-search"></i>
            )}
          </span>

          <input
            type="text"
            className="form-control border-0 shadow-none py-2"
            placeholder="Search books by title, author, category, or ISBN..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchTerm.trim() && dropdownResults.length > 0) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
            autoComplete="off"
            aria-label="Search catalog books"
          />

          {searchTerm && (
            <button
              className="btn btn-white bg-white border-0 text-muted px-2"
              type="button"
              onClick={() => {
                setIsOpen(false);
                setDropdownResults([]);
                onClearSearch();
              }}
              aria-label="Clear search"
            >
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}

          <button
            className="btn btn-primary text-dark fw-semibold px-4 border-0 d-flex align-items-center"
            type="submit"
          >
            <span>Search</span>
            <i className="bi bi-search ms-2 d-none d-sm-inline"></i>
          </button>
        </div>
      </form>

      {/* ===================================================================
          LIVE SEARCH AUTOCOMPLETE DROPDOWN WITH BOLD MATCHED KEYWORDS
          =================================================================== */}
      {isOpen && searchTerm.trim() && (
        <div
          className="position-absolute start-0 end-0 mt-1 bg-white rounded-3 shadow-lg border overflow-hidden"
          style={{ zIndex: 1060, maxHeight: '380px', overflowY: 'auto' }}
        >
          {dropdownResults.length > 0 ? (
            <div>
              <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom text-muted small">
                <span>
                  Suggestions for &ldquo;<strong>{searchTerm}</strong>&rdquo;
                </span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>
                  Click to open book
                </span>
              </div>

              <div className="list-group list-group-flush">
                {dropdownResults.map((book) => {
                  const coverSrc = book.image
                    ? book.image.startsWith('http')
                      ? book.image
                      : `http://localhost:5000${book.image}`
                    : FALLBACK_ICON;

                  return (
                    <button
                      key={book._id}
                      type="button"
                      onClick={() => handleSelectBook(book._id)}
                      className="list-group-item list-group-item-action d-flex align-items-center p-2 px-3 border-bottom text-start"
                    >
                      {/* Thumbnail */}
                      <div
                        className="rounded border bg-light d-flex align-items-center justify-content-center me-3 flex-shrink-0 overflow-hidden"
                        style={{ width: '36px', height: '48px' }}
                      >
                        <img
                          src={coverSrc}
                          alt={book.title}
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_ICON;
                          }}
                        />
                      </div>

                      {/* Content with highlighted keywords */}
                      <div className="flex-grow-1 overflow-hidden me-2">
                        <div className="fw-semibold text-dark text-truncate small mb-1">
                          {highlightMatch(book.title, searchTerm)}
                        </div>
                        <div className="text-secondary text-truncate" style={{ fontSize: '11px' }}>
                          By{' '}
                          <span className="text-dark">
                            {highlightMatch(book.author, searchTerm)}
                          </span>{' '}
                          • ISBN: {highlightMatch(book.isbn, searchTerm)}
                        </div>
                      </div>

                      {/* Stock Pill */}
                      <div className="flex-shrink-0">
                        {book.availableCopies > 0 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10px' }}>
                            {book.availableCopies} in stock
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '10px' }}>
                            Out of stock
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* View all in catalog footer button */}
              <div className="p-2 bg-light text-center border-top">
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  className="btn btn-link btn-sm text-dark text-decoration-none fw-semibold w-100"
                >
                  Filter entire catalog by &ldquo;{searchTerm}&rdquo; →
                </button>
              </div>
            </div>
          ) : !loading ? (
            <div className="p-3 text-center text-muted small">
              No direct matches for &ldquo;<strong>{searchTerm}</strong>&rdquo;. Press Enter to perform a broad search.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default BookSearch;
