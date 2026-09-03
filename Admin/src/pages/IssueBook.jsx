import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { memberService } from '../services/memberService';
import { issueService } from '../services/issueService';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const IssueBook = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [studentId, setStudentId] = useState('');
  const [bookId, setBookId] = useState('');
  // Default due date: 14 days from today
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);
  const [dueDate, setDueDate] = useState(defaultDue.toISOString().split('T')[0]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadPrerequisites = async () => {
      setLoadingData(true);
      try {
        const [studentsRes, booksRes] = await Promise.all([
          memberService.getMembers({ isActive: 'true' }),
          bookService.getBooks({ limit: 100 }),
        ]);

        if (studentsRes.success) setStudents(studentsRes.data || []);
        if (booksRes.success) {
          // Filter to books with availableCopies > 0
          const available = (booksRes.data || []).filter((b) => b.availableCopies > 0);
          setBooks(available);
        }
      } catch (err) {
        setApiError('Failed to load eligible students or available books.');
      } finally {
        setLoadingData(false);
      }
    };

    loadPrerequisites();
  }, []);

  const validate = () => {
    const errs = {};
    if (!studentId) errs.studentId = 'Please select a student member';
    if (!bookId) errs.bookId = 'Please select an available book';
    if (!dueDate) {
      errs.dueDate = 'Due date is required';
    } else {
      const selected = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected <= today) {
        errs.dueDate = 'Due date must be in the future';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');
    try {
      const res = await issueService.issueBook({
        bookId,
        studentId,
        dueDate,
      });

      if (res.success) {
        navigate('/issues');
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Failed to issue book. Please check student status and stock.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return <Loading message="Loading active students and available inventory..." />;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/issues" className="text-decoration-none">
              Issued Books
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Issue Book
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Issue Book to Student</h3>
          <p className="text-muted small mb-0">
            Create an active loan record, allocate book stock, and establish due dates
          </p>
        </div>
      </div>

      {apiError && <ErrorMessage message={apiError} />}

      <div className="card border shadow-sm" style={{ maxWidth: '750px' }}>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              {/* Select Student */}
              <div className="col-12">
                <label htmlFor="studentSelect" className="form-label fw-medium">
                  Select Student Member <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.studentId ? 'is-invalid' : ''}`}
                  id="studentSelect"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: '' }));
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">— Select an Active Student Member —</option>
                  {students.map((stu) => (
                    <option key={stu._id} value={stu._id}>
                      {stu.name} (ID: {stu.studentId} • {stu.email})
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <div className="invalid-feedback">{errors.studentId}</div>
                )}
                <div className="form-text small">
                  Only active registered student accounts appear in this list.
                </div>
              </div>

              {/* Select Book */}
              <div className="col-12">
                <label htmlFor="bookSelect" className="form-label fw-medium">
                  Select Book from Available Inventory <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.bookId ? 'is-invalid' : ''}`}
                  id="bookSelect"
                  value={bookId}
                  onChange={(e) => {
                    setBookId(e.target.value);
                    if (errors.bookId) setErrors((prev) => ({ ...prev, bookId: '' }));
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">— Select an In-Stock Book —</option>
                  {books.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title} — By {b.author} ({b.availableCopies} available)
                    </option>
                  ))}
                </select>
                {errors.bookId && <div className="invalid-feedback">{errors.bookId}</div>}
                <div className="form-text small">
                  Only books with at least 1 copy available for loan appear in this list.
                </div>
              </div>

              {/* Due Date */}
              <div className="col-md-6">
                <label htmlFor="dueDate" className="form-label fw-medium">
                  Loan Return Due Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
                  }}
                  disabled={isSubmitting}
                />
                {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
                <div className="form-text small">Standard academic borrowing window is 14 days.</div>
              </div>

              {/* Action Buttons */}
              <div className="col-12 mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/issues')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary d-flex align-items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  )}
                  {isSubmitting ? 'Issuing Book...' : 'Confirm Book Issue'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueBook;
