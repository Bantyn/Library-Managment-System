import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import BookTable from '../components/books/BookTable';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search, filter & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // Deletion modal state
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch categories for filter dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success) setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    };
    loadCategories();
  }, []);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookService.getBooks({
        search: searchTerm,
        category: selectedCategory,
        page: currentPage,
        limit: 10,
      });

      if (res.success) {
        setBooks(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalBooks(res.total || 0);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load books. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, currentPage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks();
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleDeletePrompt = (book) => {
    setBookToDelete(book);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await bookService.deleteBook(bookToDelete._id);
      if (res.success) {
        setSuccessMessage(`"${bookToDelete.title}" moved to Trash. You can restore it from the Trash page.`);
        setBookToDelete(null);
        fetchBooks();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to move book to trash. Please check for active borrowings.'
      );
      setBookToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1">Books Catalog</h3>
          <p className="text-muted small mb-0">
            Manage inventory, check stock availability, and update book metadata
          </p>
        </div>
        <Link to="/books/add" className="btn btn-primary d-flex align-items-center">
          <i className="bi bi-plus-lg me-1"></i> Add New Book
        </Link>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>{successMessage}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorMessage message={error} onRetry={fetchBooks} />}

      {/* Search & Filters Card */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search books by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-4">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-2">
              <button type="submit" className="btn btn-outline-primary w-100">
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Books Table Container */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loading message="Loading catalog records..." />
          ) : books.length > 0 ? (
            <>
              <BookTable
                books={books}
                onDeleteClick={handleDeletePrompt}
                startIndex={(currentPage - 1) * 10 + 1}
              />
              <div className="p-3 border-top">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalBooks}
                  pageSize={10}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon="bi-book"
              title="No books match your criteria"
              description={
                searchTerm || selectedCategory
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start by adding your first book to the library catalog.'
              }
              actionText={searchTerm || selectedCategory ? 'Clear Filters' : 'Add New Book'}
              onAction={() => {
                if (searchTerm || selectedCategory) {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setCurrentPage(1);
                } else {
                  window.location.href = '/books/add';
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Move to Trash Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Move Book to Trash"
        message={`Move "${bookToDelete?.title}" to trash? It will be removed from the active catalog but can be restored from the Trash page.`}
        confirmText="Move to Trash"
        confirmVariant="warning"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  );
};

export default Books;
