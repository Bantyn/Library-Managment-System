import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getDaysOverdue } from '../../utils/formatDate';

const BorrowingTable = ({ issues = [], isHistory = false }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 bg-white small">
        <thead className="table-light">
          <tr>
            <th scope="col" style={{ width: '4%' }}>#</th>
            <th scope="col" style={{ width: '32%' }}>Book Title</th>
            <th scope="col" style={{ width: '16%' }}>Issue Date</th>
            <th scope="col" style={{ width: '16%' }}>Due Date</th>
            {isHistory && <th scope="col" style={{ width: '16%' }}>Return Date</th>}
            <th scope="col" style={{ width: '12%' }}>Fine</th>
            <th scope="col" className="text-end" style={{ width: '12%' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, idx) => {
            const daysOverdue = getDaysOverdue(issue.dueDate, issue.returnDate);
            const isLate = daysOverdue > 0;

            return (
              <tr key={issue._id}>
                <td className="text-muted">{idx + 1}</td>
                <td>
                  <div className="fw-semibold text-dark">
                    {issue.book ? (
                      <Link
                        to={`/books/${issue.book._id}`}
                        className="text-decoration-none text-dark hover-primary"
                      >
                        {issue.book.title}
                      </Link>
                    ) : (
                      'Unknown Title'
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    ISBN: {issue.book?.isbn || '—'} {issue.book?.shelfLocation ? `• Shelf: ${issue.book.shelfLocation}` : ''}
                  </div>
                </td>
                <td className="text-secondary">{formatDate(issue.issueDate)}</td>
                <td>
                  <span
                    className={
                      !issue.returnDate && isLate ? 'text-danger fw-bold' : 'text-secondary'
                    }
                  >
                    {formatDate(issue.dueDate)}
                  </span>
                  {!issue.returnDate && isLate && (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-block mt-1" style={{ width: 'fit-content', fontSize: '10px' }}>
                      {daysOverdue} days overdue
                    </span>
                  )}
                </td>
                {isHistory && (
                  <td className="text-secondary">
                    {issue.returnDate ? formatDate(issue.returnDate) : 'Not returned'}
                  </td>
                )}
                <td>
                  {issue.fine > 0 ? (
                    <span className="text-danger fw-bold">₹{issue.fine}</span>
                  ) : !issue.returnDate && isLate ? (
                    <span className="text-danger small">₹{daysOverdue * 5} (est.)</span>
                  ) : (
                    <span className="text-muted">₹0</span>
                  )}
                </td>
                <td className="text-end">
                  <span
                    className={`badge ${
                      issue.status === 'returned'
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : isLate
                        ? 'bg-danger-subtle text-danger border border-danger-subtle'
                        : 'bg-primary-subtle text-primary border border-primary-subtle'
                    }`}
                  >
                    {issue.status === 'returned'
                      ? 'Returned'
                      : isLate
                      ? 'Overdue'
                      : 'Issued (Active)'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BorrowingTable;
