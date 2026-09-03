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
  // Library Card Lookup State
  const [cardLookupInput, setCardLookupInput] = useState('');
  const [lookupFeedback, setLookupFeedback] = useState(null); // { success: bool, message: string, student: obj }
  const [isLookingUp, setIsLookingUp] = useState(false);

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

  // Quick lookup via 12-digit Library Card ID
  const handleCardLookup = async (e) => {
    if (e) e.preventDefault();
    const cleanId = cardLookupInput.trim();
    if (!cleanId) return;

    setIsLookingUp(true);
    setLookupFeedback(null);
    try {
      const res = await memberService.getMembers({ libraryCardId: cleanId });
      if (res.success && res.data?.length > 0) {
        const found = res.data[0];
        if (!found.isActive) {
          setLookupFeedback({
            success: false,
            message: `Student account for ${found.name} is deactivated. Cannot issue books.`,
          });
        } else {
          setStudentId(found._id);
          setLookupFeedback({
            success: true,
            message: `Verified: ${found.name} (Student ID: ${found.studentId || 'N/A'} • Card: ${found.libraryCardId})`,
            student: found,
          });
          if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: '' }));
        }
      } else {
        setLookupFeedback({
          success: false,
          message: `No active student found with Library Card ID "${cleanId}".`,
        });
      }
    } catch (err) {
      setLookupFeedback({
        success: false,
        message: 'Error looking up member by Library Card ID.',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!studentId) errs.studentId = 'Please select or scan a student member';
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
            Create an active loan record, allocate book stock, and verify student library credentials
          </p>
        </div>
      </div>

      {apiError && <ErrorMessage message={apiError} />}

      <div className="card border shadow-sm mb-4" style={{ maxWidth: '780px' }}>
        <div className="card-header bg-white py-3">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
            <i className="bi bi-credit-card-2-front me-2 text-primary"></i>
            Fast Member Identification via Library Card ID
          </h6>
        </div>
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleCardLookup} className="row g-2 align-items-center">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-upc-scan text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control font-monospace"
                  placeholder="Enter or scan 12-digit Library Card ID (e.g. 000000000001)..."
                  maxLength="12"
                  value={cardLookupInput}
                  onChange={(e) => setCardLookupInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <button
                type="submit"
                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                disabled={isLookingUp || !cardLookupInput.trim()}
              >
                {isLookingUp ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                ) : (
                  <i className="bi bi-search me-1"></i>
                )}
                Find Student
              </button>
            </div>
          </form>

          {lookupFeedback && (
            <div
              className={`alert ${
                lookupFeedback.success ? 'alert-success' : 'alert-danger'
              } d-flex align-items-center mt-3 mb-0 py-2 px-3 small`}
              role="alert"
            >
              <i
                className={`bi ${
                  lookupFeedback.success ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'
                } me-2`}
              ></i>
              <div>{lookupFeedback.message}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card border shadow-sm" style={{ maxWidth: '780px' }}>
        <div className="card-header bg-white py-3">
          <h6 className="fw-bold text-dark mb-0">Loan Circulation Details</h6>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              {/* Select Student */}
              <div className="col-12">
                <label htmlFor="studentSelect" className="form-label fw-medium small">
                  Selected Student Member <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.studentId ? 'is-invalid' : ''}`}
                  id="studentSelect"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: '' }));
                    setLookupFeedback(null);
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">— Select an Active Student Member —</option>
                  {students.map((stu) => (
                    <option key={stu._id} value={stu._id}>
                      {stu.name} (Card ID: {stu.libraryCardId || 'N/A'} • Student ID: {stu.studentId} • {stu.email})
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
                <label htmlFor="bookSelect" className="form-label fw-medium small">
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
                <label htmlFor="dueDate" className="form-label fw-medium small">
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
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/issues')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-dark fw-semibold d-flex align-items-center"
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
