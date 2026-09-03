import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import BookForm from '../components/books/BookForm';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        err.response?.data?.message || 'Failed to load book record for editing.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleUpdateBook = async (bookData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await bookService.updateBook(id, bookData);
      if (res.success) {
        navigate('/books');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update book. Please verify your inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading book details..." />;
  }

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
            Edit Book
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Edit Book</h3>
          <p className="text-muted small mb-0">
            Updating metadata and stock copies for: <strong>{book?.title}</strong>
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchBook} />}

      <div className="card border shadow-sm">
        <div className="card-body p-4">
          {book && (
            <BookForm
              initialValues={book}
              onSubmit={handleUpdateBook}
              isSubmitting={isSubmitting}
              isEdit={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditBook;
