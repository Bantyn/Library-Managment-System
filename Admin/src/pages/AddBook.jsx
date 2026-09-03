import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import BookForm from '../components/books/BookForm';
import ErrorMessage from '../components/common/ErrorMessage';

const AddBook = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddBook = async (bookData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await bookService.createBook(bookData);
      if (res.success) {
        navigate('/books');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to add book. Please verify your inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/books" className="text-decoration-none">
              Books
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Add New Book
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Add New Book</h3>
          <p className="text-muted small mb-0">
            Fill out the details below to add a new title to the library catalog
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="card border shadow-sm">
        <div className="card-body p-4">
          <BookForm onSubmit={handleAddBook} isSubmitting={isSubmitting} isEdit={false} />
        </div>
      </div>
    </div>
  );
};

export default AddBook;
