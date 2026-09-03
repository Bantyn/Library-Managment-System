import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import BookGrid from '../components/books/BookGrid';
import BookSearch from '../components/books/BookSearch';
import CategoryFilter from '../components/books/CategoryFilter';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Read initial query params from URL if present
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // Load categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success) setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    };
    fetchCats();
  }, []);

  // Synchronize state when URL query params change (e.g. from Home category click)
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    setSelectedCategory(cat);
    setSearchTerm(search);
    setCurrentPage(1);
  }, [searchParams]);

  // Fetch books with search and category combined
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookService.getBooks({
        search: searchTerm,
        category: selectedCategory,
        page: currentPage,
        limit: 12,
      });

      if (res.success) {
        setBooks(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalBooks(res.total || 0);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load books catalog. Please try again.'
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
    updateUrlParams(searchTerm, selectedCategory);
    fetchBooks();
  };

  const handleCategoryChange = (newCat) => {
    setSelectedCategory(newCat);
    setCurrentPage(1);
    updateUrlParams(searchTerm, newCat);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    updateUrlParams('', selectedCategory);
  };

  const updateUrlParams = (search, category) => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    setSearchParams(params);
  };

  return (
    <div className="py-4">
      <div className="container">
        {/* Page Header */}
        <div className="mb-4">
          <h3 className="fw-bold text-dark mb-1">Books Catalog</h3>
          <p className="text-muted small mb-0">
            Browse through campus academic collections, textbooks, and research publications
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="card border shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-12 col-md-7">
                <BookSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onSearchSubmit={handleSearchSubmit}
                  onClearSearch={handleClearSearch}
                />
              </div>
              <div className="col-12 col-md-5">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorMessage message={error} onRetry={fetchBooks} />}

        {/* Books Content */}
        {loading ? (
          <Loading message="Fetching catalog books..." />
        ) : books.length > 0 ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted small">
              <span>Found <strong>{totalBooks}</strong> title{totalBooks === 1 ? '' : 's'}</span>
              {(searchTerm || selectedCategory) && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-danger p-0"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setCurrentPage(1);
                    setSearchParams({});
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i> Clear Filters
                </button>
              )}
            </div>

            <BookGrid books={books} />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalBooks}
              pageSize={12}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        ) : (
          <EmptyState
            icon="bi-book"
            title="No books match your criteria"
            description={
              searchTerm || selectedCategory
                ? 'Try broadening your search keyword or selecting a different subject category.'
                : 'There are currently no books cataloged in the library system.'
            }
            actionText={searchTerm || selectedCategory ? 'Reset Filters' : null}
            onAction={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setCurrentPage(1);
              setSearchParams({});
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Books;
