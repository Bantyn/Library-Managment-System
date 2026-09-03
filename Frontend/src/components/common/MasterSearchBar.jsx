import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../services/bookService';

// Fallback cover icon from icons8
const FALLBACK_ICON = 'https://img.icons8.com/parakeet-partial-filled/48/image.png';

/**
 * Utility to highlight matching query text with bold styling
 */
export const highlightMatch = (text, query) => {
  if (!text || !query || !query.trim()) return text;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <strong
        key={index}
        className="fw-bold text-dark bg-warning-subtle px-1 rounded"
        style={{ textDecoration: 'none' }}
      >
        {part}
      </strong>
    ) : (
      part
    )
  );
};

const MasterSearchBar = ({
  placeholder = 'Search by title, author, category, or ISBN...',
  size = 'lg',
  initialValue = '',
  onSearchSubmit,
  className = '',
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync initialValue if changed from parent
  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results with debouncing
  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setResults([]);
      setTotalMatches(0);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await bookService.getBooks({
        search: searchTerm.trim(),
        limit: 5,
      });

      if (res.success) {
        setResults(res.data || []);
        setTotalMatches(res.total || 0);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Master search error:', err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 250);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
    } else {
      navigate(`/books?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectBook = (bookId) => {
    setIsOpen(false);
    navigate(`/books/${bookId}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isLarge = size === 'lg';

  return (
    <div
      ref={containerRef}
      className={`position-relative w-100 ${className}`}
      style={{ zIndex: 2 }}
    >
      <form onSubmit={handleSubmit} className="w-100 m-0">
        <div
          className="d-flex align-items-center bg-white rounded-pill border border-secondary-subtle p-1 shadow-sm"
          style={{
            minHeight: isLarge ? '52px' : '44px',
          }}
        >
          {/* Search Icon or Loading Spinner */}
          <div className="ps-3 pe-2 text-secondary d-flex align-items-center flex-shrink-0">
            {loading ? (
              <span
                className="spinner-border spinner-border-sm text-warning"
                role="status"
                aria-hidden="true"
                style={{ width: '1.1rem', height: '1.1rem' }}
              ></span>
            ) : (
              <i className={`bi bi-search text-secondary ${isLarge ? 'fs-5' : 'fs-6'}`}></i>
            )}
          </div>

          {/* Search Input Field */}
          <input
            type="text"
            className="form-control border-0 bg-transparent shadow-none px-2 text-dark search-input-no-focus"
            style={{
              fontSize: isLarge ? '1rem' : '0.9rem',
              fontWeight: 400,
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
            }}
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.trim() && results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            autoComplete="off"
            aria-label="Search library books"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              className="btn btn-link p-0 text-muted me-2 text-decoration-none d-flex align-items-center flex-shrink-0"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear search input"
            >
              <i className="bi bi-x-circle-fill fs-5 text-secondary"></i>
            </button>
          )}

          {/* Submit Search Button */}
          <button
            type="submit"
            className={`btn btn-primary text-dark fw-semibold rounded-pill d-flex align-items-center flex-shrink-0 shadow-sm ${
              isLarge ? 'px-4 py-2' : 'px-3 py-1 small'
            }`}
            style={{ border: 'none' }}
          >
            <span>Search</span>
            <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </form>

      {/* ===================================================================
          AUTOCOMPLETE DROPDOWN RESULTS MENU
          =================================================================== */}
      {isOpen && (
        <div
          className="position-absolute start-0 end-0 mt-2 bg-white rounded-4 shadow-lg border overflow-hidden"
          style={{
            zIndex: 1050,
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
          }}
        >
          {results.length > 0 ? (
            <div>
              {/* Header result counter */}
              <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom text-muted small">
                <span>
                  Found <strong>{totalMatches}</strong> match{totalMatches === 1 ? '' : 'es'} for &ldquo;{query}&rdquo;
                </span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>
                  Click to view details
                </span>
              </div>

              {/* Result List Items */}
              <div className="list-group list-group-flush">
                {results.map((book) => {
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
                      className="list-group-item list-group-item-action d-flex align-items-center p-3 border-bottom text-start hover-bg-light transition"
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Thumbnail Cover / Icon */}
                      <div
                        className="rounded border bg-light d-flex align-items-center justify-content-center me-3 flex-shrink-0 overflow-hidden"
                        style={{ width: '42px', height: '56px' }}
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

                      {/* Content Details */}
                      <div className="flex-grow-1 overflow-hidden me-2">
                        {/* Title with matching query highlighted */}
                        <div className="fw-semibold text-dark text-truncate mb-1">
                          {highlightMatch(book.title, query)}
                        </div>

                        {/* Author with matching query highlighted */}
                        <div className="small text-secondary text-truncate mb-1">
                          By <span className="text-dark">{highlightMatch(book.author, query)}</span>
                        </div>

                        {/* Meta Tags */}
                        <div className="d-flex flex-wrap align-items-center gap-2 small" style={{ fontSize: '11px' }}>
                          <span className="badge bg-light text-secondary border">
                            {highlightMatch(book.category?.name || 'General', query)}
                          </span>
                          <span className="text-muted">
                            ISBN: {highlightMatch(book.isbn, query)}
                          </span>
                          {book.shelfLocation && (
                            <span className="text-muted d-none d-sm-inline">
                              • Shelf: {book.shelfLocation}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Availability Tag */}
                      <div className="flex-shrink-0 text-end">
                        {book.availableCopies > 0 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle small">
                            {book.availableCopies} Available
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
                            Out of Stock
                          </span>
                        )}
                        <i className="bi bi-chevron-right text-muted ms-2 d-none d-sm-inline"></i>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Footer — View All Results */}
              <div className="p-2 bg-light text-center border-top">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn btn-link btn-sm text-dark text-decoration-none fw-semibold w-100"
                >
                  View all {totalMatches} results for &ldquo;{query}&rdquo; in Catalog →
                </button>
              </div>
            </div>
          ) : !loading && query.trim() ? (
            /* No Results State */
            <div className="p-4 text-center text-muted">
              <i className="bi bi-journal-x fs-2 d-block mb-2 text-secondary"></i>
              <div className="fw-semibold text-dark mb-1">No books found</div>
              <p className="small mb-2 text-secondary">
                No titles, authors, or ISBNs matched &ldquo;<strong>{query}</strong>&rdquo;
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-outline-dark btn-sm mt-1"
              >
                Search Entire Catalog
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default MasterSearchBar;
